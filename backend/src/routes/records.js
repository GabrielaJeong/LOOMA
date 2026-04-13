const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

// GET /records - 기록 목록 조회 (날짜 필터)
router.get("/", authenticate, async (req, res, next) => {});

// POST /records - 기록 생성 (음성 업로드 → STT → AI 구조화)
router.post("/", authenticate, async (req, res, next) => {
  // TODO: multipart/form-data 처리 (오디오 파일)
  // TODO: whisperService.transcribe(audioFile)
  // TODO: claudeService.structureRecord(transcript, routine)
  // TODO: 오디오 파일 즉시 삭제 (보안)
});

// GET /records/:recordId - 기록 상세 조회
router.get("/:recordId", authenticate, async (req, res, next) => {});

// PUT /records/:recordId - 기록 수정
router.put("/:recordId", authenticate, async (req, res, next) => {});

// DELETE /records/:recordId - 기록 삭제
router.delete("/:recordId", authenticate, async (req, res, next) => {});

// GET /records/calendar?year=&month= - 캘린더용 기록 존재 날짜 조회
router.get("/calendar", authenticate, async (req, res, next) => {});

module.exports = router;
