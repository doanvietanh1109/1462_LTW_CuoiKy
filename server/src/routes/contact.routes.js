const { Router } = require("express");
const {
  createContactInquiry,
  getContactInquiries,
  updateContactStatus,
} = require("../controllers/contact.controller");
const { requireAuth, requireLandlord } = require("../middlewares/auth.middleware");
const { validateObjectId } = require("../middlewares/validate.middleware");
const { contactRateLimit } = require("../middlewares/contactRateLimit");

const router = Router();

// Khách (không đăng nhập) để lại thông tin liên hệ
router.post("/", contactRateLimit, createContactInquiry);

// Chủ trọ xem và cập nhật trạng thái liên hệ
router.get("/", requireAuth, requireLandlord, getContactInquiries);
router.patch("/:id/status", requireAuth, requireLandlord, validateObjectId("id"), updateContactStatus);

module.exports = router;
