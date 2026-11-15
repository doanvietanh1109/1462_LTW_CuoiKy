const test = require("node:test");
const assert = require("node:assert/strict");
const { RentalHistory } = require("../src/models/rentalHistory.model");
const { getRentalHistory, getRentalHistoryById } = require("../src/controllers/rentalHistory.controller");

const originalFind = RentalHistory.find;
const originalFindById = RentalHistory.findById;
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const invoke = async (handler, req) => {
  const res = response();
  let forwarded;
  await handler(req, res, (error) => { forwarded = error; });
  if (forwarded) throw forwarded;
  return res;
};

test.afterEach(() => {
  RentalHistory.find = originalFind;
  RentalHistory.findById = originalFindById;
});

test("landlord rental history is scoped to the authenticated landlord and empty is successful", async () => {
  let capturedQuery;
  RentalHistory.find = (query) => {
    capturedQuery = query;
    return { sort: () => ({ lean: async () => [] }) };
  };
  const res = await invoke(getRentalHistory, { user: { _id: "owner-a", role: "landlord" }, query: { landlordId: "owner-b" } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(capturedQuery, { landlordId: "owner-a" });
  assert.deepEqual(res.body.data.history, []);
});

test("tenant rental history is scoped to their id or legacy email", async () => {
  let capturedQuery;
  RentalHistory.find = (query) => {
    capturedQuery = query;
    return { sort: () => ({ lean: async () => [] }) };
  };
  const res = await invoke(getRentalHistory, { user: { _id: "tenant-a", email: "tenant@example.test", role: "user" }, query: {} });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(capturedQuery.$or, [{ tenantId: "tenant-a" }, { tenantEmail: "tenant@example.test" }]);
});

test("tenant cannot read another tenant's rental history", async () => {
  RentalHistory.findById = async () => ({ _id: "history-a", landlordId: "owner-a", tenantId: "tenant-b", tenantEmail: "b@example.test" });
  const res = await invoke(getRentalHistoryById, { params: { id: "history-a" }, user: { _id: "tenant-a", email: "a@example.test", role: "user" } });
  assert.equal(res.statusCode, 403);
});
