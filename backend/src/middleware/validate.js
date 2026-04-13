// 요청 유효성 검사 미들웨어 (스키마 기반)
// SDK 확정 후 joi 또는 zod로 구현 예정

function validate(schema) {
  return (req, res, next) => {
    // TODO: 요청 body/params/query 검증
    next();
  };
}

module.exports = { validate };
