const test = require("node:test");
const assert = require("node:assert/strict");
const { ContactRequest } = require("../src/models/contactRequest.model");
const { createContactRequest, getContactRequests, validateContactRequest } = require("../src/controllers/contactRequest.controller");
const router = require("../src/routes/contactRequest.routes");

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
});

test("contact request validates and preserves Vietnamese, trims fields and lowercases email", () => {
  const result = validateContactRequest({ name: " Đoàn Việt Anh ", email: " A@EXAMPLE.COM ", subject: " Cần hỗ trợ ", message: " Xin hướng dẫn sử dụng. " });
  assert.deepEqual(result.fieldErrors, {});
  assert.deepEqual(result.values, { name: "Đoàn Việt Anh", email: "a@example.com", subject: "Cần hỗ trợ", message: "Xin hướng dẫn sử dụng." });
});

test("invalid contact request returns field errors without database write", async () => {
  const originalCreate = ContactRequest.create;
  ContactRequest.create = async () => { throw new Error("must not write"); };
  try {
    const res = makeResponse();
    await createContactRequest({ body: { name: "A", email: "bad", subject: "x", message: "short" } }, res, (e) => { throw e; });
    assert.equal(res.statusCode, 400);
    assert.deepEqual(Object.keys(res.body.errors.fieldErrors).sort(), ["email", "message", "name", "subject"]);
  } finally { ContactRequest.create = originalCreate; }
});

test("valid public contact request is stored once and returns minimal acknowledgement", async () => {
  const originalCreate = ContactRequest.create;
  const saved = [];
  ContactRequest.create = async (doc) => { saved.push(doc); return { _id: "request-1", createdAt: new Date("2026-11-18T00:00:00Z") }; };
  try {
    const res = makeResponse();
    await createContactRequest({ body: { name: "Đoàn Việt Anh", email: "A@example.com", subject: "Hỏi về phòng", message: "Tôi muốn tìm hiểu thêm về phòng này." } }, res, (e) => { throw e; });
    assert.equal(res.statusCode, 201);
    assert.equal(saved.length, 1);
    assert.equal(saved[0].name, "Đoàn Việt Anh");
    assert.equal(saved[0].email, "a@example.com");
    assert.deepEqual(res.body.data.request, { id: "request-1", createdAt: new Date("2026-11-18T00:00:00Z") });
  } finally { ContactRequest.create = originalCreate; }
});

test("contact request inbox requires authentication and administrator role", () => {
  const routes = router.stack.map(({ route }) => route).filter(Boolean);
  const getRoute = routes.find(({ path, methods }) => path === "/" && methods.get);
  assert.ok(getRoute);
  assert.deepEqual(getRoute.stack.slice(0, 2).map(({ name }) => name), ["requireAuth", "requireAdmin"]);
});

test("admin contact inbox paginates and validates filters", async () => {
  const originalFind = ContactRequest.find;
  const originalCount = ContactRequest.countDocuments;
  let querySeen;
  ContactRequest.find = (query) => {
    querySeen = query;
    return { sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => [{ _id: "r1" }] }) }) }) };
  };
  ContactRequest.countDocuments = async () => 1;
  try {
    const res = makeResponse();
    await getContactRequests({ query: { page: "2", limit: "5", status: "new" } }, res, (e) => { throw e; });
    assert.deepEqual(querySeen, { status: "new" });
    assert.deepEqual(res.body.data.pagination, { page: 2, limit: 5, total: 1, totalPages: 1 });
    const bad = makeResponse();
    await getContactRequests({ query: { limit: "500" } }, bad, (e) => { throw e; });
    assert.equal(bad.statusCode, 400);
  } finally { ContactRequest.find = originalFind; ContactRequest.countDocuments = originalCount; }
});
