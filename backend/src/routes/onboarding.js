const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

// POST /onboarding/terms - 약관 동의 저장
router.post("/terms", authenticate, async (req, res, next) => {});

// POST /onboarding/complete - 온보딩 완료 처리
router.post("/complete", authenticate, async (req, res, next) => {});

module.exports = router;
