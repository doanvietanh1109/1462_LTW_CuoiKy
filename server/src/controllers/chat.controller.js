const { env } = require("../config/env");
const { sendError, sendSuccess } = require("../utils/response");

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const buildSystemPrompt = () => {
  return [
    "You are a helpful assistant for RIPT Rental (room/apartment rental service).",
    "Respond in Vietnamese by default, concise and practical.",
    "Help users with room search, pricing, amenities, and area suggestions.",
    "If user asks unrelated topics, answer briefly then guide back to rental context.",
  ].join(" ");
};

const extractGeminiText = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((part) => part?.text || "").join("").trim();
};

const chatWithGemini = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return sendError(res, "Message is required", null, 400);
    }

    if (!env.GEMINI_API_KEY) {
      return sendError(res, "Gemini API key is missing on server", null, 500);
    }

    const model = env.GEMINI_MODEL || "gemini-2.5-flash";
    const endpoint = `${GEMINI_API_BASE}/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt() }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: message.trim() }],
          },
        ],
      }),
    });

    const payload = await geminiResponse.json().catch(() => ({}));
    if (!geminiResponse.ok) {
      const upstreamMessage =
        payload?.error?.message || `Gemini API error (${geminiResponse.status})`;
      return sendError(res, upstreamMessage, payload?.error || null, 502);
    }

    const reply = extractGeminiText(payload);
    if (!reply) {
      return sendError(res, "Gemini returned an empty response", null, 502);
    }

    return sendSuccess(res, "Chat response generated", { reply, model });
  } catch (error) {
    console.error("Gemini chat error:", error);
    return sendError(res, "Server error while calling Gemini", null, 500);
  }
};

module.exports = { chatWithGemini };
