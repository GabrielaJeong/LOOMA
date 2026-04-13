const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    name: { type: String, required: true },
    items: [{ type: String }], // 루틴 항목 목록 (예: ["혈압", "혈당", "체중"])
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Routine", routineSchema);
