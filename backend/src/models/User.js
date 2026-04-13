const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    kakaoId: { type: String, required: true, unique: true },
    name: { type: String },
    phone: { type: String },
    terms: {
      service: { type: Boolean, default: false },     // 서비스 이용약관 (필수)
      privacy: { type: Boolean, default: false },     // 개인정보 처리방침 (필수)
      age: { type: Boolean, default: false },         // 만 14세 이상 (필수)
      marketing: { type: Boolean, default: false },   // 마케팅 수신 동의 (선택)
    },
    notifications: {
      push: { type: Boolean, default: true },
      event: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
    },
    onboardingCompleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
