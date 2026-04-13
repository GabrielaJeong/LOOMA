// 환경변수 검증 및 내보내기

const required = [
  "MONGODB_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "KAKAO_CLIENT_ID",
  "KAKAO_CLIENT_SECRET",
  "KAKAO_REDIRECT_URI",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
];

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

module.exports = {
  validateEnv,
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "1h",
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "30d",
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID,
  KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET,
  KAKAO_REDIRECT_URI: process.env.KAKAO_REDIRECT_URI,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
};
