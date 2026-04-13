const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["self", "family"], required: true },
    relationship: { type: String }, // 'self'일 경우 null
    gender: { type: String, enum: ["male", "female", "other"] },
    birthDate: { type: Date },
    height: { type: Number }, // cm
    weight: { type: Number }, // kg
    diseaseName: { type: String }, // 질병명
    region: { type: String },     // 거주 지역
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
