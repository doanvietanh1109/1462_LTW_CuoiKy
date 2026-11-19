const { Router } = require("express");
const { createContactRequest, getContactRequests } = require("../controllers/contactRequest.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");
const { contactRateLimit } = require("../middlewares/contactRateLimit");

const router = Router();
router.post("/", contactRateLimit, createContactRequest);
router.get("/", requireAuth, requireAdmin, getContactRequests);

module.exports = router;
