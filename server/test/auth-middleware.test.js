const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { User } = require("../src/models/user.model");
const { env } = require("../src/config/env");
const { requireAuth, requireLandlord } = require("../src/middlewares/auth.middleware");

const originalFindById = User.findById;
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const invoke = async (middleware, req) => {
  const res = response();
  let nextCalled = false;
  await middleware(req, res, () => { nextCalled = true; });
  return { res, nextCalled, user: req.user };
};
test.afterEach(() => { User.findById = originalFindById; });

test("requireAuth rejects missing and invalid JWTs", async () => {
  const missing = await invoke(requireAuth, { headers: {} });
  assert.equal(missing.res.statusCode, 401);
  const invalid = await invoke(requireAuth, { headers: { authorization: "Bearer invalid" } });
  assert.equal(invalid.res.statusCode, 401);
});

test("requireAuth reloads identity from a valid JWT and blocks disabled accounts", async () => {
  User.findById = () => ({ select: async () => ({ _id: "u1", role: "user", status: "active" }) });
  const token = jwt.sign({ id: "u1" }, env.JWT_SECRET, { expiresIn: "1m" });
  const accepted = await invoke(requireAuth, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(accepted.nextCalled, true);
  assert.equal(accepted.user.role, "user");

  User.findById = () => ({ select: async () => ({ _id: "u1", role: "user", status: "blocked" }) });
  const blocked = await invoke(requireAuth, { headers: { authorization: `Bearer ${token}` } });
  assert.equal(blocked.res.statusCode, 403);
  assert.equal(blocked.nextCalled, false);
});

test("requireLandlord rejects a regular tenant", async () => {
  const result = await invoke(requireLandlord, { user: { role: "user" } });
  assert.equal(result.res.statusCode, 403);
  assert.equal(result.nextCalled, false);
});
