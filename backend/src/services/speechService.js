const { OPENAI_API_KEY } = require("../config/env");

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/mpga",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
]);

function normalizeBase64(value) {
  return String(value || "").replace(/^data:audio\/[a-zA-Z0-9.+-]+;base64,/, "");
}

function getAudioExtension(mimeType) {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "mp3";
  if (mimeType.includes("m4a")) return "m4a";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

function normalizeMimeType(mimeType) {
  return String(mimeType || "audio/webm").split(";")[0].trim().toLowerCase();
}

async function transcribeAudio({ audioBase64, mimeType }) {
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (!SUPPORTED_MIME_TYPES.has(normalizedMimeType)) {
    const error = new Error("지원하지 않는 음성 파일 형식이에요.");
    error.status = 400;
    throw error;
  }

  const audioBuffer = Buffer.from(normalizeBase64(audioBase64), "base64");

  if (!audioBuffer.length) {
    const error = new Error("음성 파일이 비어 있어요.");
    error.status = 400;
    throw error;
  }

  if (audioBuffer.length > MAX_AUDIO_BYTES) {
    const error = new Error("음성 파일은 최대 25MB까지 변환할 수 있어요.");
    error.status = 413;
    throw error;
  }

  const formData = new FormData();
  const audioBlob = new Blob([audioBuffer], { type: normalizedMimeType });

  formData.append(
    "file",
    audioBlob,
    `looma-recording.${getAudioExtension(normalizedMimeType)}`
  );
  formData.append("model", process.env.OPENAI_TRANSCRIPTION_MODEL || "whisper-1");
  formData.append("language", "ko");
  formData.append("response_format", "json");
  formData.append(
    "prompt",
    "LOOMA 건강 기록 앱의 한국어 음성입니다. 증상, 약 복용, 식사, 운동, 감정, 걱정 등을 자연스럽게 받아 적어주세요."
  );

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Whisper API 호출 실패 (${response.status}): ${detail}`);
  }

  const result = await response.json();
  const transcript = String(result.text || "").trim();

  if (!transcript) {
    const error = new Error("음성을 텍스트로 변환하지 못했어요.");
    error.status = 422;
    throw error;
  }

  return transcript;
}

module.exports = {
  transcribeAudio,
};
