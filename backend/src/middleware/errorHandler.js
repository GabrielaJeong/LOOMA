// 전역 에러 핸들러 미들웨어

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}

module.exports = errorHandler;
