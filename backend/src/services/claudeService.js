const {
  OPENAI_API_KEY,
  OPENAI_MODEL,
  LANGSMITH_PROJECT,
} = require("../config/env");
const {
  MASTER_SECTION_TITLES,
  validateStructuredRecord,
} = require("./structuredRecordSchema");

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_TIMEOUT_MS = 45000;
const RESPONSE_FORMAT = {
  type: "json_schema",
  name: "looma_record",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      sections: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: {
              type: "string",
              enum: MASTER_SECTION_TITLES,
            },
            items: {
              type: "array",
              minItems: 1,
              items: {
                type: "string",
              },
            },
          },
          required: ["title", "items"],
        },
      },
      summary: {
        type: "string",
      },
      notes: {
        type: "string",
      },
    },
    required: ["sections", "summary", "notes"],
  },
};

const SYSTEM_PROMPT = [
  "너는 LOOMA의 건강 기록 정리 도우미다.",
  "할 일은 사용자의 건강 관련 자유발화 기록을 JSON 기록지로 정리하는 것이다.",
  "의료 진단, 병명 추정, 치료, 복용 권고는 하지 않는다.",
  "사용자가 말하지 않은 정보를 추가하지 않는다.",
  "카테고리는 허용된 목록 안에서만 선택한다.",
  `허용 카테고리: ${MASTER_SECTION_TITLES.join(", ")}`,
  '어디에도 정확히 맞지 않으면 "기타"를 사용한다.',
  "각 item은 짧은 기록 문장으로 정리한다.",
  "입력 텍스트에 증상, 약, 식사, 감정, 행동이 들어 있으면 반드시 그 사실을 그대로 정리한다.",
  '절대 "원문 손상", "인식되지 않음", "정리할 수 없음", "정보 부족" 같은 회피 문구를 쓰지 않는다.',
  "입력이 짧더라도 비어 있지 않다면 최소 1개 이상의 section과 1개 이상의 item을 만들어야 한다.",
  "summary는 사용자가 실제로 말한 내용을 한 줄로 요약한다.",
  "마크다운, 코드블록, 설명 문장 없이 JSON만 출력한다.",
].join(" ");

function buildUserPrompt(transcript, routine) {
  return [
    `기록 대상 질환/증상 맥락: ${routine?.diseaseName || routine?.name || "미상"}`,
    "",
    "사용자 기록 원문:",
    transcript,
    "",
    "중요:",
    "- 사용자가 실제로 말한 증상/행동/복용/걱정 내용을 그대로 뽑아 주세요.",
    '- "원문 손상", "인식되지 않음", "정리할 수 없음" 같은 문구는 쓰지 마세요.',
    "- transcript가 비어 있지 않으므로 반드시 구조화 결과를 만들어 주세요.",
    "",
    "다음 JSON 스키마로만 응답해 주세요.",
    '{ "sections": [{ "title": "카테고리명", "items": ["문장1", "문장2"] }], "summary": "한 줄 요약", "notes": "" }',
  ].join("\n");
}

function extractJsonText(rawText) {
  const fencedMatch =
    rawText.match(/```json\s*([\s\S]*?)```/i) ||
    rawText.match(/```\s*([\s\S]*?)```/i);

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  return rawText.trim();
}

function extractOutputText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const texts =
    data?.output
      ?.flatMap((item) => item?.content || [])
      ?.filter((contentItem) => contentItem?.type === "output_text")
      ?.map((contentItem) => contentItem.text)
      ?.filter(Boolean) || [];

  return texts.join("\n").trim();
}

async function callOpenAI(userPrompt) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_output_tokens: 900,
      instructions: SYSTEM_PROMPT,
      input: userPrompt,
      text: {
        format: RESPONSE_FORMAT,
      },
    }),
  }).catch((error) => {
    if (error.name === "AbortError") {
      throw new Error("OpenAI 응답 시간이 너무 오래 걸렸습니다.");
    }

    throw error;
  }).finally(() => {
    clearTimeout(timeoutId);
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API 호출 실패 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const outputText = extractOutputText(data);

  if (!outputText) {
    throw new Error("OpenAI 응답에서 output_text를 찾지 못했습니다.");
  }

  return outputText;
}

async function structureRecord(transcript, routine) {
  const userPrompt = buildUserPrompt(transcript, routine);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const startedAt = Date.now();
    const responseText = await callOpenAI(userPrompt);
    const durationMs = Date.now() - startedAt;

    console.log(
      `[openai] structureRecord attempt=${attempt} model=${OPENAI_MODEL} durationMs=${durationMs} project=${LANGSMITH_PROJECT}`
    );

    try {
      const parsed = JSON.parse(extractJsonText(responseText));
      const validated = validateStructuredRecord(parsed);

      if (!validated.success) {
        throw new Error(validated.error);
      }

      return validated.data;
    } catch (error) {
      if (attempt === 2) {
        throw new Error(`OpenAI 응답 검증 실패: ${error.message}`);
      }
    }
  }

  throw new Error("OpenAI 응답을 구조화하지 못했습니다.");
}

async function continueConversation() {
  throw new Error("continueConversation은 아직 구현되지 않았습니다.");
}

module.exports = { structureRecord, continueConversation };
