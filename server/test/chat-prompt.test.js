const test = require("node:test");
const assert = require("node:assert/strict");
const { env } = require("../src/config/env");
const { buildSystemPrompt, chatWithGemini } = require("../src/controllers/chat.controller");

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
});

test("Gemini prompt requests concise natural Vietnamese Markdown without invented room facts", () => {
  const prompt = buildSystemPrompt();
  assert.match(prompt, /Vietnamese/i);
  assert.match(prompt, /Markdown/);
  assert.match(prompt, /do not invent listings or facts/i);
  assert.match(prompt, /never bold the whole response/i);
});

test("chat endpoint still forwards the user question to Gemini and returns its response", async () => {
  const oldFetch = global.fetch;
  const oldKey = env.GEMINI_API_KEY;
  const oldModel = env.GEMINI_MODEL;
  let requestBody;
  global.fetch = async (_url, options) => {
    requestBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "Xin chào!" }] } }] }) };
  };
  env.GEMINI_API_KEY = "test-only-key";
  env.GEMINI_MODEL = "gemini-test-model";
  try {
    const res = makeResponse();
    await chatWithGemini({ body: { message: "Xin chào" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.reply, "Xin chào!");
    assert.equal(requestBody.contents[0].parts[0].text, "Xin chào");
    assert.match(requestBody.systemInstruction.parts[0].text, /Markdown/);
  } finally {
    global.fetch = oldFetch;
    env.GEMINI_API_KEY = oldKey;
    env.GEMINI_MODEL = oldModel;
  }
});
