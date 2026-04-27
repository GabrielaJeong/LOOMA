const mongoose = require("mongoose");

mongoose.connection.on("connected", () => {
  console.log("[DB] MongoDB 연결됨");
});

mongoose.connection.on("error", (err) => {
  console.error("[DB] MongoDB 오류:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[DB] MongoDB 연결 끊김 — 자동 재연결 시도 중");
});

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
}

module.exports = { connectDB };
