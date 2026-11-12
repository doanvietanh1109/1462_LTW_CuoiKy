const { Router } = require("express");
const { chatWithGemini } = require("../controllers/chat.controller");

const router = Router();

router.post("/gemini", chatWithGemini);

module.exports = router;
