const { ContactRequest } = require("../models/contactRequest.model");
const { sendSuccess, sendError } = require("../utils/response");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const cleanString = (value) => typeof value === "string" ? value.trim() : "";

const validateContactRequest = (body = {}) => {
  const name = cleanString(body.name);
  const email = cleanString(body.email).toLowerCase();
  const subject = cleanString(body.subject);
  const message = cleanString(body.message);
  const fieldErrors = {};
  if (name.length < 2 || name.length > 100) fieldErrors.name = "Họ tên cần có từ 2 đến 100 ký tự.";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) fieldErrors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
  if (subject.length < 3 || subject.length > 120) fieldErrors.subject = "Chủ đề cần có từ 3 đến 120 ký tự.";
  if (message.length < 10 || message.length > 5000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(message)) fieldErrors.message = "Nội dung cần có từ 10 đến 5.000 ký tự và không chứa ký tự điều khiển.";
  return { values: { name, email, subject, message }, fieldErrors };
};

const createContactRequest = async (req, res, next) => {
  try {
    const { values, fieldErrors } = validateContactRequest(req.body);
    if (Object.keys(fieldErrors).length) return sendError(res, "Vui lòng kiểm tra lại thông tin liên hệ.", { fieldErrors }, 400);
    const request = await ContactRequest.create(values);
    return sendSuccess(res, "Gửi yêu cầu thành công.", { request: { id: request._id, createdAt: request.createdAt } }, 201);
  } catch (error) {
    return next(error);
  }
};

const getContactRequests = async (req, res, next) => {
  try {
    const pageRaw = req.query.page === undefined ? "1" : req.query.page;
    const limitRaw = req.query.limit === undefined ? "20" : req.query.limit;
    const page = Number(pageRaw);
    const limit = Number(limitRaw);
    const status = req.query.status || "all";
    if (!/^\d+$/.test(String(pageRaw)) || page < 1 || !/^\d+$/.test(String(limitRaw)) || limit < 1 || limit > 100 || !["all", "new", "in_review", "resolved"].includes(status)) {
      return sendError(res, "Bộ lọc danh sách liên hệ không hợp lệ.", null, 400);
    }
    const query = status === "all" ? {} : { status };
    const [requests, total] = await Promise.all([
      ContactRequest.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ContactRequest.countDocuments(query),
    ]);
    return sendSuccess(res, "Lấy danh sách yêu cầu liên hệ thành công.", { requests, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createContactRequest, getContactRequests, validateContactRequest };
