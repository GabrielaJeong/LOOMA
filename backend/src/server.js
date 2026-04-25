require("dotenv").config();
const { validateEnv, PORT } = require("./config/env");
const { connectDB } = require("./config/database");
const app = require("./app");

async function start() {
  validateEnv();
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[LOOMA API] Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
