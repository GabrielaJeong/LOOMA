// JWT 인증 미들웨어

// Access Token 검증
async function authenticate(req, res, next) {
  // TODO: Authorization 헤더에서 Bearer 토큰 추출
  // TODO: JWT 검증 (jwt.verify)
  // TODO: req.user 설정
  next();
}

// 온보딩 완료 여부 확인
async function requireOnboarding(req, res, next) {
  // TODO: req.user.onboardingCompleted 확인
  next();
}

module.exports = { authenticate, requireOnboarding };
