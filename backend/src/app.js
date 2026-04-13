const express = require("express");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// TODO: cors, helmet, morgan, cookie-parser 추가 (SDK 확정 후)

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/routines", require("./routes/routines"));
app.use("/records", require("./routes/records"));
app.use("/onboarding", require("./routes/onboarding"));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Error handler (must be last)
app.use(require("./middleware/errorHandler"));

module.exports = app;
