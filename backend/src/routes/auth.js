const express = require("express");
const router = express.Router();

// POST /auth/kakao - Kakao OAuth 토큰으로 로그인/회원가입
router.post("/kakao", async (req, res, next) => {
  // TODO: Kakao 사용자 정보 조회 → User upsert → JWT 발급
});

// POST /auth/refresh - Access Token 갱신
router.post("/refresh", async (req, res, next) => {
  // TODO: Refresh Token 검증 → 새 Access Token 발급
});

// POST /auth/logout - 로그아웃
router.post("/logout", async (req, res, next) => {
  // TODO: Refresh Token 쿠키 삭제
});

module.exports = router;
