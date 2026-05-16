const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { transcribeAudio } = require("../services/speechService");

// POST /speech/transcribe - 녹음 오디오를 Whisper로 텍스트 변환
router.post("/transcribe", authenticate, async (req, res, next) => {
  try {
    const transcript = await transcribeAudio({
      audioBase64: req.body?.audioBase64,
      mimeType: req.body?.mimeType,
    });

    return res.status(200).json({
      transcript,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
