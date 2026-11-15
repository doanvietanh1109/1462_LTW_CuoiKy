const test = require("node:test");
const assert = require("node:assert/strict");
const { Room } = require("../src/models/room.model");
const { Contract } = require("../src/models/contract.model");
const { getRooms, getRoomById, createRoom, removeTenant } = require("../src/controllers/room.controller");

const originalFind = Room.find;
const originalFindById = Room.findById;
const originalCreate = Room.create;
const originalContractFindOne = Contract.findOne;
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const invoke = async (handler, req) => {
  const res = response();
  let forwarded;
  await handler(req, res, (error) => { forwarded = error; });
  if (forwarded) throw forwarded;
  return res;
};
test.afterEach(() => { Room.find = originalFind; Room.findById = originalFindById; Room.create = originalCreate; Contract.findOne = originalContractFindOne; });

test("public room query cannot use ownerId/status to expose occupied inventory", async () => {
  let capturedQuery;
  Room.find = (query) => {
    capturedQuery = query;
    return { populate() { return this; }, sort() { return Promise.resolve([]); } };
  };
  const res = await invoke(getRooms, { query: { ownerId: "bbbbbbbbbbbbbbbbbbbbbbbb", status: "all" } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(capturedQuery.status, "available");
  assert.equal(capturedQuery.ownerId, undefined);
});

test("room creation rejects invalid numeric fields before creating data", async () => {
  let created = false;
  Room.create = async () => { created = true; };
  const res = await invoke(createRoom, { user: { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", name: "Owner" }, body: { title: "Room", category: "Phòng trọ", price: "NaN", district: "Quận 1" } });
  assert.equal(res.statusCode, 400);
  assert.equal(created, false);
});

test("public room detail does not expose tenant or meter data", async () => {
  Room.findById = async () => ({
    _id: "aaaaaaaaaaaaaaaaaaaaaaaa", status: "available", ownerId: "bbbbbbbbbbbbbbbbbbbbbbbb",
    tenant: { name: "Private Tenant", email: "tenant@example.test" }, currentElectricity: 123, currentWater: 45,
    toObject() { return { ...this }; },
  });
  const res = await invoke(getRoomById, { params: { id: "aaaaaaaaaaaaaaaaaaaaaaaa" } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.room.tenant, undefined);
  assert.equal(res.body.data.room.ownerId, undefined);
  assert.equal(res.body.data.room.currentElectricity, undefined);
});

test("public room detail hides occupied rooms", async () => {
  Room.findById = async () => ({ _id: "aaaaaaaaaaaaaaaaaaaaaaaa", status: "rented" });
  const res = await invoke(getRoomById, { params: { id: "aaaaaaaaaaaaaaaaaaaaaaaa" } });
  assert.equal(res.statusCode, 404);
});

test("legacy room release cannot bypass an active contract", async () => {
  let saved = false;
  const room = { _id: "aaaaaaaaaaaaaaaaaaaaaaaa", ownerId: "bbbbbbbbbbbbbbbbbbbbbbbb", status: "rented", save: async () => { saved = true; } };
  Room.findById = async () => room;
  Contract.findOne = async () => ({ _id: "contract" });
  const res = await invoke(removeTenant, { params: { id: room._id }, user: { _id: room.ownerId, role: "landlord" } });
  assert.equal(res.statusCode, 409);
  assert.equal(saved, false);
});
