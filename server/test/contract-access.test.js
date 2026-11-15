const test = require("node:test");
const assert = require("node:assert/strict");
const { Contract } = require("../src/models/contract.model");
const { canAccessContract, buildContractQuery } = require("../src/controllers/contract.controller");

const idA = "aaaaaaaaaaaaaaaaaaaaaaaa";
const idB = "bbbbbbbbbbbbbbbbbbbbbbbb";

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
