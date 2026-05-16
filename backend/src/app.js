const express = require("express");
const app = express();

// Middleware
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json({ limit: "35mb" }));
app.use(express.urlencoded({ extended: true, limit: "35mb" }));
// TODO: cors, helmet, morgan, cookie-parser 추가 (SDK 확정 후)

// Routes
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const routinesRouter = require("./routes/routines");
const recordsRouter = require("./routes/records");
const speechRouter = require("./routes/speech");
const onboardingRouter = require("./routes/onboarding");

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/routines", routinesRouter);
app.use("/records", recordsRouter);
app.use("/speech", speechRouter);
app.use("/onboarding", onboardingRouter);

// Temporary compatibility layer: frontend env still points to /api/*
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/routines", routinesRouter);
app.use("/api/records", recordsRouter);
app.use("/api/speech", speechRouter);
app.use("/api/onboarding", onboardingRouter);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Error handler (must be last)
app.use(require("./middleware/errorHandler"));

module.exports = app;
