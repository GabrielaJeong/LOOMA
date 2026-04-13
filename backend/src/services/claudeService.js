// Claude AI 서비스 (Anthropic Claude API)
// STT 텍스트 → 구조화된 건강 기록 JSON 변환
// LangSmith로 모니터링

async function structureRecord(transcript, routine) {
  // TODO: Anthropic Claude API 호출
  // TODO: 루틴 항목을 기반으로 텍스트 구조화 프롬프트 구성
  // TODO: LangSmith 트레이싱
  // return { sections: Array, summary: string }
}

async function continueConversation(conversationHistory, userMessage, routine) {
  // TODO: 대화 이어가기 (추가 정보 요청 등)
  // return { reply: string, isComplete: boolean, updatedSections: Array }
}

module.exports = { structureRecord, continueConversation };
