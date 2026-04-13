const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  order: { type: Number, required: true },
});

const recordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    routineId: { type: mongoose.Schema.Types.ObjectId, ref: "Routine", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    sections: [sectionSchema], // AI가 구조화한 섹션 목록
    summary: { type: String }, // AI 요약
    notes: { type: String },   // 사용자 메모
  },
  { timestamps: true }
);

// 헬스 데이터 암호화는 저장 전 훅에서 처리 (AES-256)
// recordSchema.pre("save", async function () { ... });

module.exports = mongoose.model("Record", recordSchema);
