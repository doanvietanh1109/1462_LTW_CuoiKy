const test = require("node:test");
const assert = require("node:assert/strict");
const { Room } = require("../src/models/room.model");
const { Contract } = require("../src/models/contract.model");
const { Invoice } = require("../src/models/invoice.model");
const { MeterReading } = require("../src/models/meterReading.model");
const meter = require("../src/controllers/meterReading.controller");
const billing = require("../src/controllers/invoice.controller");

const originals = new Map();
const replace = (object, key, value) => {
  if (!originals.has(`${object.modelName}.${key}`)) originals.set(`${object.modelName}.${key}`, [object, key, object[key]]);
  object[key] = value;
};
const restore = () => {
  for (const [object, key, value] of originals.values()) object[key] = value;
  originals.clear();
};
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const invoke = async (handler, req) => {
  const res = response();
  let forwarded;
  await handler(req, res, (error) => { forwarded = error; });
  if (forwarded) throw forwarded;
  return res;
};
const idA = "aaaaaaaaaaaaaaaaaaaaaaaa";
const idB = "bbbbbbbbbbbbbbbbbbbbbbbb";
const row = (roomId = idA, overrides = {}) => ({ roomId, oldElectricity: 10, newElectricity: 12, oldWater: 2, newWater: 3, ...overrides });

test.afterEach(restore);

test("landlord A cannot batch-write landlord B's room", async () => {
  replace(Room, "find", async () => []);
  const res = await invoke(meter.saveBatchMeterReadings, {
    user: { _id: idA, role: "landlord" }, body: { month: 5, year: 2026, rows: [row(idB)] },
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.errors.rowErrors[idB], /không thuộc quyền quản lý/);
});

test("landlord A cannot mark landlord B's invoice paid", async () => {
  replace(Invoice, "findById", async () => ({ landlordId: { toString: () => idB } }));
  const res = await invoke(billing.markInvoicePaid, { params: { id: idB }, user: { _id: idA, role: "landlord" } });
  assert.equal(res.statusCode, 403);
});

test("tenant cannot read an invoice tied to another room", async () => {
  const query = { populate() { return this; }, then(resolve) { resolve({ _id: idB, tenantId: { _id: idA }, roomId: { tenant: { userId: idB } }, contractId: null }); } };
  replace(Invoice, "findById", () => query);
  const res = await invoke(billing.getInvoiceById, { params: { id: idB }, user: { _id: idA, email: "a@example.test", role: "user" } });
  assert.equal(res.statusCode, 403);
});

test("batch rejects decreasing readings, invalid numbers, periods, and repeated room IDs", async () => {
  const cases = [
    { month: 5, year: 2026, rows: [row(idA, { newElectricity: 9 })] },
    { month: 5, year: 2026, rows: [row(idA, { oldWater: -1 })] },
    { month: 13, year: 2026, rows: [row()] },
    { month: 5, year: 2101, rows: [row()] },
    { month: 5, year: 2026, rows: [row(idA, { newWater: "NaN" })] },
    { month: 5, year: 2026, rows: [row(idA), row(idA)] },
  ];
  for (const body of cases) {
    const res = await invoke(meter.saveBatchMeterReadings, { user: { _id: idA, role: "landlord" }, body });
    assert.equal(res.statusCode, 400);
  }
});

test("single invoice rejects decreasing meter values", async () => {
  const res = await invoke(billing.createInvoice, {
    user: { _id: idA, role: "landlord" },
    body: { roomId: idA, month: 5, year: 2026, oldElectricity: 10, newElectricity: 9, oldWater: 1, newWater: 2 },
  });
  assert.equal(res.statusCode, 400);
});

test("historical meter correction does not change current room counters", async () => {
  const room = { _id: idA, ownerId: idA, status: "rented", price: 100, electricityPrice: 3, waterPrice: 4, serviceFee: 0, currentElectricity: 900, currentWater: 90, save: async () => { room.saved = true; } };
  replace(Room, "find", async () => [room]);
  replace(Contract, "find", async () => []);
  replace(MeterReading, "findOneAndUpdate", async () => ({ _id: "reading" }));
  replace(Invoice, "findOne", async () => null);
  const now = new Date();
  const oldMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const oldYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const res = await invoke(meter.saveBatchMeterReadings, { user: { _id: idA, role: "landlord" }, body: { month: oldMonth, year: oldYear, rows: [row()] } });
  assert.equal(res.statusCode, 201);
  assert.equal(room.currentElectricity, 900);
  assert.equal(room.currentWater, 90);
  assert.equal(room.saved, undefined);
});

test("explicit zero service fee is preserved when creating an invoice", async () => {
  const room = { _id: idA, ownerId: idA, status: "rented", price: 1000, electricityPrice: 3, waterPrice: 4, serviceFee: 77, currentElectricity: 20, currentWater: 20, save: async () => {} };
  let created;
  replace(Invoice, "findOne", async () => null);
  replace(Invoice, "create", async (data) => { created = data; return { ...data, _id: "new-invoice" }; });
  replace(Invoice, "findById", () => ({ populate() { return this; }, then(resolve) { resolve({ ...created, _id: "new-invoice" }); } }));
  replace(Room, "findById", async () => room);
  replace(Contract, "findOne", async () => ({ rentPrice: 1000, electricityPrice: 3, waterPrice: 4, serviceFee: 77 }));
  replace(MeterReading, "findOneAndUpdate", async () => ({ _id: "reading" }));
  const now = new Date();
  const res = await invoke(billing.createInvoice, { user: { _id: idA, role: "landlord" }, body: { roomId: idA, month: now.getMonth() + 1, year: now.getFullYear(), oldElectricity: 1, newElectricity: 1, oldWater: 1, newWater: 1, serviceFee: 0 } });
  assert.equal(res.statusCode, 201);
  assert.equal(created.serviceFee, 0);
  assert.equal(created.totalAmount, 1000);
});

test("duplicate-key race is translated to HTTP 409", () => {
  assert.equal(billing.isDuplicateKeyError({ code: 11000 }), true);
  assert.equal(billing.isDuplicateKeyError({ code: 11001 }), false);
});

test("invoice creation converts a unique-index race into HTTP 409", async () => {
  const room = { _id: idA, ownerId: idA, status: "rented", price: 1000, electricityPrice: 3, waterPrice: 4, serviceFee: 0, currentElectricity: 1, currentWater: 1, save: async () => {} };
  replace(Invoice, "findOne", async () => null);
  replace(Invoice, "create", async () => { throw { code: 11000, keyValue: { roomId: idA, month: 11, year: new Date().getFullYear() } }; });
  replace(Room, "findById", async () => room);
  replace(Contract, "findOne", async () => null);
  replace(MeterReading, "findOneAndUpdate", async () => ({ _id: "reading" }));
  const now = new Date();
  const res = await invoke(billing.createInvoice, { user: { _id: idA, role: "landlord" }, body: { roomId: idA, month: now.getMonth() + 1, year: now.getFullYear(), oldElectricity: 1, newElectricity: 1, oldWater: 1, newWater: 1 } });
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /đã được tạo bởi yêu cầu khác/);
});
