const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    routineId: { type: mongoose.Schema.Types.ObjectId, ref: "Routine", required: true },
    messages: [messageSchema],
    audioUrls: [{ type: String }], // STT 완료 후 즉시 삭제되므로 임시 참조용
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
