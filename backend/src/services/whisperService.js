// Whisper STT 서비스 (OpenAI Whisper API)
// 오디오 파일 → 텍스트 변환
// 처리 완료 후 오디오 파일 즉시 삭제

async function transcribe(audioBuffer, mimeType) {
  // TODO: OpenAI Whisper API 호출
  // TODO: 임시 파일 생성 → API 전송 → 즉시 삭제
  // return { text: string, language: string, duration: number }
}

module.exports = { transcribe };
