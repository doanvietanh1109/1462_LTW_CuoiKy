const mongoose = require("mongoose");
const { sendError } = require("../utils/response");

const validateObjectId = (paramName = "id") => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, `ID không hợp lệ (${paramName})`, null, 400);
  }
  return next();
};

const validateRequiredFields = (fields = []) => (req, res, next) => {
  const missing = fields.filter((field) => {
    const val = req.body ? req.body[field] : undefined;
    return val === undefined || val === null || (typeof val === "string" && val.trim() === "");
  });

  if (missing.length > 0) {
    return sendError(
      res,
      `Thiếu trường dữ liệu bắt buộc: ${missing.join(", ")}`,
      { missingFields: missing },
      400
    );
  }
  return next();
};

module.exports = {
  validateObjectId,
  validateRequiredFields,
};
