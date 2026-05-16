const MASTER_SECTION_TITLES = [
  "주요 증상",
  "통증",
  "투약 기록",
  "식사/음료",
  "운동 및 활동량",
  "수면",
  "배변/배뇨",
  "감정/기분",
  "병원/검사",
  "생활 습관/환경",
  "해본 것",
  "걱정되는 것",
  "기타",
];

const LOW_QUALITY_PATTERNS = [
  /원문.*손상/,
  /인식되지 않/,
  /정리할 수 없/,
  /도출 불가/,
  /정보가 부족/,
  /내용이 부족/,
  /알 수 없/,
  /확인할 수 없/,
];

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isLowQualityText(value) {
  const normalized = normalizeString(value);
  return LOW_QUALITY_PATTERNS.some((pattern) => pattern.test(normalized));
}

function validateStructuredRecord(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { success: false, error: "Claude 응답이 객체 형태가 아닙니다." };
  }

  if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
    return { success: false, error: "sections가 비어 있거나 배열이 아닙니다." };
  }

  const normalizedSections = [];

  for (const [index, rawSection] of payload.sections.entries()) {
    if (!rawSection || typeof rawSection !== "object" || Array.isArray(rawSection)) {
      return { success: false, error: `sections[${index}]가 객체가 아닙니다.` };
    }

    const title = normalizeString(rawSection.title || rawSection.category);

    if (!title) {
      return { success: false, error: `sections[${index}]의 title이 비어 있습니다.` };
    }

    if (!MASTER_SECTION_TITLES.includes(title)) {
      return { success: false, error: `sections[${index}]의 title이 허용 목록 밖입니다: ${title}` };
    }

    if (!Array.isArray(rawSection.items) || rawSection.items.length === 0) {
      return { success: false, error: `sections[${index}]의 items가 비어 있거나 배열이 아닙니다.` };
    }

    const items = rawSection.items
      .map(normalizeString)
      .filter(Boolean);

    if (items.length === 0) {
      return { success: false, error: `sections[${index}]의 items가 모두 빈 문자열입니다.` };
    }

    if (items.some(isLowQualityText)) {
      return {
        success: false,
        error: `sections[${index}]의 items에 회피성 문구가 포함되어 있습니다.`,
      };
    }

    normalizedSections.push({
      title,
      items,
      order: index,
    });
  }

  const summary = normalizeString(payload.summary);
  const notes = normalizeString(payload.notes);

  if (!summary) {
    return { success: false, error: "summary가 비어 있습니다." };
  }

  if (isLowQualityText(summary)) {
    return { success: false, error: "summary에 회피성 문구가 포함되어 있습니다." };
  }

  return {
    success: true,
    data: {
      sections: normalizedSections,
      summary,
      notes,
    },
  };
}

function validateCreateRecordBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "요청 본문이 올바르지 않습니다." };
  }

  const routineId = normalizeString(body.routineId);
  const transcript = normalizeString(body.transcript);
  const date = normalizeString(body.date);
  const rawRoutineContext =
    body.routineContext && typeof body.routineContext === "object" && !Array.isArray(body.routineContext)
      ? body.routineContext
      : null;
  const routineContext = rawRoutineContext
    ? {
        subjectType: normalizeString(rawRoutineContext.subjectType),
        subjectName: normalizeString(rawRoutineContext.subjectName),
        gender: normalizeString(rawRoutineContext.gender),
        birthDate: normalizeString(rawRoutineContext.birthDate),
        heightCm: normalizeString(rawRoutineContext.heightCm),
        weightKg: normalizeString(rawRoutineContext.weightKg),
        diseaseName: normalizeString(rawRoutineContext.diseaseName),
        dotColor: normalizeString(rawRoutineContext.dotColor),
      }
    : null;

  if (!routineId && !routineContext) {
    return { success: false, error: "routineId 또는 routineContext 중 하나는 필수입니다." };
  }

  if (!transcript) {
    return { success: false, error: "transcript는 필수입니다." };
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false, error: "date는 YYYY-MM-DD 형식이어야 합니다." };
  }

  return {
    success: true,
    data: {
      routineId,
      transcript,
      date: date || null,
      routineContext,
    },
  };
}

function validateUpdateRecordBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "요청 본문이 올바르지 않습니다." };
  }

  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return { success: false, error: "수정할 sections가 비어 있습니다." };
  }

  const normalizedSections = [];

  for (const [index, rawSection] of body.sections.entries()) {
    if (!rawSection || typeof rawSection !== "object" || Array.isArray(rawSection)) {
      return { success: false, error: `sections[${index}]가 객체가 아닙니다.` };
    }

    const title = normalizeString(rawSection.title);
    if (!title) {
      return { success: false, error: `sections[${index}]의 title이 비어 있습니다.` };
    }

    if (!Array.isArray(rawSection.items) || rawSection.items.length === 0) {
      return { success: false, error: `sections[${index}]의 items가 비어 있거나 배열이 아닙니다.` };
    }

    const items = rawSection.items.map(normalizeString).filter(Boolean);
    if (items.length === 0) {
      return { success: false, error: `sections[${index}]의 items가 모두 빈 문자열입니다.` };
    }

    normalizedSections.push({
      title,
      items,
      order: index,
    });
  }

  return {
    success: true,
    data: {
      sections: normalizedSections,
    },
  };
}

module.exports = {
  MASTER_SECTION_TITLES,
  validateCreateRecordBody,
  validateStructuredRecord,
  validateUpdateRecordBody,
  isLowQualityText,
};
