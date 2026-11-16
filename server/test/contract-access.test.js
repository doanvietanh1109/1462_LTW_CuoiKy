const test = require("node:test");
const assert = require("node:assert/strict");
const { Contract } = require("../src/models/contract.model");
const { Room } = require("../src/models/room.model");
const { canAccessContract, buildContractQuery, updateRoomAfterContractTermination } = require("../src/controllers/contract.controller");

const idA = "aaaaaaaaaaaaaaaaaaaaaaaa";
const idB = "bbbbbbbbbbbbbbbbbbbbbbbb";
const originalRoomMethods = {};
const originalContractFindOne = Contract.findOne;
test.afterEach(() => {
  for (const [key, value] of Object.entries(originalRoomMethods)) Room[key] = value;
  for (const key of Object.keys(originalRoomMethods)) delete originalRoomMethods[key];
  Contract.findOne = originalContractFindOne;
});

test("contract access is limited to its landlord or tenant", () => {
  const contract = { landlordId: idA, tenantId: idB, tenantEmail: "tenant@example.test" };
  assert.equal(canAccessContract({ _id: idA, role: "landlord" }, contract), true);
  assert.equal(canAccessContract({ _id: idB, role: "user", email: "other@example.test" }, contract), true);
  assert.equal(canAccessContract({ _id: idA, role: "user", email: "owner@example.test" }, contract), false);
  assert.equal(canAccessContract({ _id: idB, role: "landlord" }, contract), false);
});

test("contract search is combined with the tenant scope and escaped", () => {
  const query = buildContractQuery({ _id: idA, role: "user", email: "a@example.test" }, {
    search: ".*", status: "active", roomId: idB,
  });
  assert.equal(query.$and.length, 2);
  assert.deepEqual(query.$and[0], { $or: [{ tenantId: idA }, { tenantEmail: "a@example.test" }] });
  assert.equal(query.$and[1].$or[0].contractCode.$regex, "\\.\\*");
  assert.equal(query.status, "active");
  assert.equal(query.roomId, idB);
});

test("contract search cannot replace landlord ownership filter", () => {
  const query = buildContractQuery({ _id: idA, role: "landlord" }, { search: "tenant" });
  assert.deepEqual(query.$and[0], { landlordId: idA });
  assert.equal(query.$and.length, 2);
});

test("contract schema declares a unique partial index for active room occupancy", () => {
  const index = Contract.schema.indexes().find(([keys, options]) =>
    keys.roomId === 1 && options.unique && options.partialFilterExpression?.status === "active"
  );
  assert.ok(index, "expected a unique partial index on active contracts by room");
});

test("ending an old contract preserves a room assigned to its successor", async () => {
  const room = { _id: idA, status: "rented", tenant: { userId: idB } };
  originalRoomMethods.findById = Room.findById;
  originalRoomMethods.findOneAndUpdate = Room.findOneAndUpdate;
  const successor = { _id: idB };
  Contract.findOne = async () => successor;
  Room.findById = async () => room;
  let released = false;
  Room.findOneAndUpdate = async () => { released = true; return null; };
  const result = await updateRoomAfterContractTermination({ roomId: idA, tenantId: idA });
  assert.equal(result.successor, successor);
  assert.equal(result.room, room);
  assert.equal(released, false);
});

test("ending a contract only releases a room still assigned to that tenant", async () => {
  originalRoomMethods.findOneAndUpdate = Room.findOneAndUpdate;
  Contract.findOne = async () => null;
  let filter;
  const releasedRoom = { _id: idA, status: "available" };
  Room.findOneAndUpdate = async (query) => { filter = query; return releasedRoom; };
  const result = await updateRoomAfterContractTermination({ roomId: idA, tenantId: idB });
  assert.equal(result.room, releasedRoom);
  assert.equal(filter.status, "rented");
  assert.equal(filter["tenant.userId"], idB);
});
