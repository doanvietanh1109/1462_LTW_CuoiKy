const { sendError } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message || err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return sendError(res, "Định dạng ID không hợp lệ", null, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(", ");
    return sendError(res, `Dữ liệu bị trùng lặp (${fields})`, err.keyValue, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((val) => val.message);
    return sendError(res, messages.join("; ") || "Dữ liệu đầu vào không hợp lệ", messages, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return sendError(res, "Token không hợp lệ hoặc đã hết hạn", null, 401);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const details = process.env.NODE_ENV === "development" ? err.stack : null;
  return sendError(res, message, details, statusCode);
};

module.exports = { errorHandler };
