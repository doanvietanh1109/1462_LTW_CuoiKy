const test = require("node:test");
const assert = require("node:assert/strict");
const { Room } = require("../src/models/room.model");
const { Contract } = require("../src/models/contract.model");
const { Invoice } = require("../src/models/invoice.model");
const { MeterReading } = require("../src/models/meterReading.model");
const { Notification } = require("../src/models/notification.model");
const { User } = require("../src/models/user.model");
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

test("invoice and meter uniqueness scope a monthly record to its contract", () => {
  for (const [schema, name] of [[Invoice.schema, "uniq_invoice_room_period_contract"], [MeterReading.schema, "uniq_meter_room_period_contract"]]) {
    const index = schema.indexes().find(([, options]) => options.name === name);
    assert.ok(index);
    assert.deepEqual(index[0], { roomId: 1, month: 1, year: 1, contractId: 1 });
    assert.equal(index[1].unique, true);
  }
});

test("batch duplicate-key classifier distinguishes legacy indexes from contract-period races", () => {
  const legacy = meter.describeDuplicateKey({ keyPattern: { roomId: 1, month: 1, year: 1 } });
  assert.equal(legacy.code, "legacy_room_period_index");
  assert.equal(legacy.requiresIndexMigration, true);
  const contractScoped = meter.describeDuplicateKey({ keyPattern: { roomId: 1, month: 1, year: 1, contractId: 1 } });
  assert.equal(contractScoped.code, "contract_period_conflict");
  assert.equal(contractScoped.requiresIndexMigration, false);
  const invoiceCode = meter.describeDuplicateKey({ keyPattern: { invoiceCode: 1 } });
  assert.equal(invoiceCode.code, "invoice_code_conflict");
});

test("batch issue reports the legacy room-period index instead of a generic race", async () => {
  const room = { _id: idA, ownerId: idA, status: "rented", price: 1000, electricityPrice: 3, waterPrice: 4, serviceFee: 0 };
  const contract = { _id: idB, roomId: idA, tenantId: idB, rentPrice: 1000, electricityPrice: 3, waterPrice: 4, serviceFee: 0 };
  replace(Room, "find", async () => [room]);
  replace(Contract, "find", async () => [contract]);
  replace(Invoice, "find", async () => []);
  replace(Invoice, "create", async () => { throw { code: 11000, keyPattern: { roomId: 1, month: 1, year: 1 }, keyValue: { roomId: idA, month: 11, year: 2026 } }; });
  let readingWrite = false;
  replace(MeterReading, "findOneAndUpdate", async () => { readingWrite = true; });
  const res = await invoke(meter.saveBatchMeterReadings, {
    user: { _id: idA, role: "landlord" },
    body: { month: 11, year: 2026, issueInvoices: true, useTieredElectricity: false, rows: [row(idA)] },
  });
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.errors.code, "legacy_room_period_index");
  assert.equal(res.body.errors.requiresIndexMigration, true);
  assert.equal(res.body.errors.contractId, idB);
  assert.equal(readingWrite, false);
});

test("landlord A cannot batch-write landlord B's room", async () => {
  replace(Room, "find", async () => []);
  replace(Contract, "find", async () => []);
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
  const query = { populate() { return this; }, then(resolve) { resolve({ _id: idB, tenantId: null, roomId: { tenant: { userId: idB } }, contractId: null }); } };
  replace(Invoice, "findById", () => query);
  const res = await invoke(billing.getInvoiceById, { params: { id: idB }, user: { _id: idA, email: "a@example.test", role: "user" } });
  assert.equal(res.statusCode, 403);
});

test("tenant may read their invoice through its direct tenantId link", async () => {
  const invoice = { _id: idB, tenantId: { _id: idA }, roomId: { tenant: null }, contractId: null };
  const query = { populate() { return this; }, then(resolve) { resolve(invoice); } };
  replace(Invoice, "findById", () => query);
  const res = await invoke(billing.getInvoiceById, { params: { id: idB }, user: { _id: idA, email: "a@example.test", role: "user" } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.invoice, invoice);
});

test("current room tenant does not gain access to an unlinked historical invoice", async () => {
  const invoice = { _id: idB, tenantId: null, roomId: { tenant: { userId: idA } }, contractId: null };
  const query = { populate() { return this; }, then(resolve) { resolve(invoice); } };
  replace(Invoice, "findById", () => query);
  const res = await invoke(billing.getInvoiceById, { params: { id: idB }, user: { _id: idA, email: "new@example.test", role: "user" } });
  assert.equal(res.statusCode, 403);
});

test("tenant payment instructions use the owned invoice amount and configured landlord account", async () => {
  const invoice = { _id: idB, invoiceCode: "INV-1", month: 11, year: 2026, totalAmount: 3147500, status: "unpaid", landlordId: idB, tenantId: idA, roomId: { tenant: null, roomNumber: "901" }, contractId: null };
  replace(Invoice, "findById", () => ({ populate() { return this; }, then(resolve) { resolve(invoice); } }));
  replace(User, "findById", () => ({ select() { return this; }, then(resolve) { resolve({ bankAccount: { bankBin: "970000", bankName: "Bank", accountNumber: "12345678", accountName: "TENANT OWNER" } }); } }));
  const res = await invoke(billing.getPaymentInstructions, { params: { id: idB }, user: { _id: idA, email: "tenant@example.test", role: "user" } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.invoice.amount, 3147500);
  assert.equal(new URL(res.body.data.qrUrl).searchParams.get("amount"), "3147500");
  assert.equal(new URL(res.body.data.qrUrl).searchParams.get("addInfo"), `RIPT${idB.toUpperCase()}`);
});

test("tenant cannot get payment instructions for another tenant invoice", async () => {
  replace(Invoice, "findById", () => ({ populate() { return this; }, then(resolve) { resolve({ _id: idB, status: "unpaid", landlordId: idB, tenantId: idB, roomId: { tenant: null }, contractId: null }); } }));
  const res = await invoke(billing.getPaymentInstructions, { params: { id: idB }, user: { _id: idA, email: "tenant@example.test", role: "user" } });
  assert.equal(res.statusCode, 403);
});

test("payment instructions do not return a QR when landlord has no bank account", async () => {
  const invoice = { _id: idB, status: "unpaid", landlordId: idB, tenantId: idA, roomId: { tenant: null }, contractId: null };
  replace(Invoice, "findById", () => ({ populate() { return this; }, then(resolve) { resolve(invoice); } }));
  replace(User, "findById", () => ({ select() { return this; }, then(resolve) { resolve({ bankAccount: null }); } }));
  const res = await invoke(billing.getPaymentInstructions, { params: { id: idB }, user: { _id: idA, email: "tenant@example.test", role: "user" } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.configured, false);
  assert.equal(res.body.data.qrUrl, undefined);
});

test("tenant invoice list includes records linked directly by tenantId", async () => {
  replace(Contract, "find", () => ({ select: async () => [] }));
  replace(Room, "find", () => ({ select: async () => [] }));
  let capturedQuery;
  const invoiceQuery = { populate() { return this; }, sort() { return this; }, skip() { return this; }, limit: async () => [{ _id: idB }] };
  replace(Invoice, "find", (query) => { capturedQuery = query; return invoiceQuery; });
  replace(Invoice, "countDocuments", async () => 1);
  const res = await invoke(billing.getInvoices, { query: {}, user: { _id: idA, email: "a@example.test", role: "user" } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(capturedQuery.$or, [{ tenantId: idA }, { contractId: { $in: [] } }]);
  assert.deepEqual(res.body.data.invoices, [{ _id: idB }]);
});

test("tenant payment request waits for landlord confirmation instead of marking paid", async () => {
  const invoice = { _id: idA, status: "unpaid", paymentConfirmationStatus: "none", totalAmount: 1000, invoiceCode: "INV-1", landlordId: idB, tenantId: idA, roomId: { tenant: { userId: idA }, roomNumber: "901" }, contractId: null };
  replace(Invoice, "findById", () => ({ populate() { return this; }, then(resolve) { resolve(invoice); } }));
  replace(Invoice, "findOneAndUpdate", async (filter, update) => { assert.equal(filter.status, "unpaid"); assert.equal(update.$set.paymentConfirmationStatus, "pending"); invoice.paymentConfirmationStatus = update.$set.paymentConfirmationStatus; invoice.paymentSubmittedAt = update.$set.paymentSubmittedAt; invoice.paymentConfirmationRequests = update.$push.paymentConfirmationRequests; return invoice; });
  const recipients = [];
  replace(Notification, "create", async (data) => { recipients.push(data.userId); return {}; });
  const res = await invoke(billing.tenantPayInvoice, { params: { id: idA }, user: { _id: idA, email: "tenant@example.test", role: "user" } });
  assert.equal(res.statusCode, 200);
  assert.equal(invoice.status, "unpaid");
  assert.equal(invoice.paymentConfirmationStatus, "pending");
  assert.ok(invoice.paymentSubmittedAt instanceof Date);
  assert.equal(invoice.paidAt, undefined);
  assert.deepEqual(recipients, [idB, idA]);
});

test("landlord confirmation marks paid once and sends the tenant a success notification", async () => {
  const invoice = { _id: idA, status: "unpaid", paymentConfirmationStatus: "pending", paymentSubmittedAt: new Date(), paymentConfirmationRequests: [{ tenantId: idB, status: "pending" }], landlordId: { toString: () => idA }, tenantId: idB, invoiceCode: "INV-2", totalAmount: 3147500 };
  let reads = 0; let writes = 0; const notices = [];
  replace(Invoice, "findById", () => ++reads === 1 ? Promise.resolve(invoice) : ({ populate() { return this; }, then(resolve) { resolve({ ...invoice }); } }));
  replace(Invoice, "findOneAndUpdate", async (filter, update) => { writes += 1; assert.equal(filter.paymentConfirmationStatus, "pending"); invoice.status = update.$set.status; invoice.paymentMethod = update.$set.paymentMethod; invoice.paymentConfirmationStatus = update.$set.paymentConfirmationStatus; return invoice; });
  replace(Notification, "create", async (notice) => { notices.push(notice); return {}; });
  const req = { params: { id: idA }, body: {}, user: { _id: idA, role: "landlord" } };
  const first = await invoke(billing.markInvoicePaid, req);
  const second = await invoke(billing.markInvoicePaid, req);
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 409);
  assert.equal(writes, 1);
  assert.equal(invoice.status, "paid");
  assert.equal(invoice.paymentMethod, "bank_transfer");
  assert.equal(notices.length, 1);
  assert.equal(notices[0].userId, idB);
  assert.equal(notices[0].title, "Thanh toán đã được xác nhận");
});

test("landlord rejection keeps invoice unpaid, records reason, and notifies only its tenant", async () => {
  const invoice = { _id: idA, status: "unpaid", paymentConfirmationStatus: "pending", paymentSubmittedAt: new Date(), paymentConfirmationRequests: [{ tenantId: idB, status: "pending" }], landlordId: { toString: () => idA }, tenantId: idB, invoiceCode: "INV-3" };
  replace(Invoice, "findById", async () => invoice);
  replace(Invoice, "findOneAndUpdate", async (_filter, update) => { invoice.status = update.$set.status; invoice.paymentConfirmationStatus = update.$set.paymentConfirmationStatus; invoice.paymentRejectionReason = update.$set.paymentRejectionReason; return invoice; });
  let notice;
  replace(Notification, "create", async (data) => { notice = data; return {}; });
  const res = await invoke(billing.rejectPaymentRequest, { params: { id: idA }, body: { reason: "Chưa thấy giao dịch vào tài khoản" }, user: { _id: idA, role: "landlord" } });
  assert.equal(res.statusCode, 200);
  assert.equal(invoice.status, "unpaid");
  assert.equal(invoice.paymentConfirmationStatus, "rejected");
  assert.equal(invoice.paymentRejectionReason, "Chưa thấy giao dịch vào tài khoản");
  assert.equal(notice.userId, idB);
  assert.match(notice.message, /Chưa thấy giao dịch/);
});

test("tenant cannot submit a duplicate request while one is pending", async () => {
  const invoice = { _id: idA, status: "unpaid", paymentConfirmationStatus: "pending", tenantId: idA, roomId: { tenant: { userId: idA } }, contractId: null };
  replace(Invoice, "findById", () => ({ populate() { return this; }, then(resolve) { resolve(invoice); } }));
  let wrote = false;
  replace(Invoice, "findOneAndUpdate", async () => { wrote = true; });
  const res = await invoke(billing.tenantPayInvoice, { params: { id: idA }, user: { _id: idA, email: "tenant@example.test", role: "user" } });
  assert.equal(res.statusCode, 409);
  assert.equal(wrote, false);
});

test("batch rejects decreasing readings, invalid numbers, periods, and repeated room IDs", async () => {
  const cases = [
    { month: 5, year: 2026, rows: [row(idA, { newElectricity: 9 })] },
    { month: 5, year: 2026, rows: [row(idA, { oldWater: -1 })] },
    { month: 13, year: 2026, rows: [row()] },
    { month: 5, year: 2101, rows: [row()] },
    { month: 5, year: 2026, rows: [row(idA, { newWater: "NaN" })] },
    { month: 5, year: 2026, rows: [row(idA, { oldElectricity: true })] },
    { month: 5, year: 2026, rows: [null] },
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
  replace(Invoice, "find", async () => []);
  const now = new Date();
  const oldMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const oldYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const res = await invoke(meter.saveBatchMeterReadings, { user: { _id: idA, role: "landlord" }, body: { month: oldMonth, year: oldYear, rows: [row()] } });
  assert.equal(res.statusCode, 201);
  assert.equal(room.currentElectricity, 900);
  assert.equal(room.currentWater, 90);
  assert.equal(room.saved, undefined);
});

test("meter sheet includes a rented room linked to an active contract and carries forward prior reading", async () => {
  const room = { _id: idA, ownerId: idA, status: "available", title: "P.107", currentElectricity: 145, currentWater: 56, price: 100, electricityPrice: 3, waterPrice: 4, serviceFee: 0, blockId: null };
  replace(Contract, "find", (query) => ({ lean: async () => query.status === "active" ? [{ roomId: idA, landlordId: idA, tenantName: "Tenant A", initialElectricity: 10, initialWater: 2, rentPrice: 100, electricityPrice: 3, waterPrice: 4, serviceFee: 0 }] : [] }));
  replace(Room, "find", () => ({ populate() { return this; }, sort() { return this; }, lean: async () => [room] }));
  replace(MeterReading, "find", (query) => ({ sort() { return this; }, lean: async () => query.$or ? [{ roomId: idA, month: 1, year: 2026, newElectricity: 140, newWater: 50 }] : [] }));
  replace(Invoice, "find", () => ({ lean: async () => [] }));
  const res = await invoke(meter.getMeterSheet, { user: { _id: idA, role: "landlord" }, query: { month: 2, year: 2026 } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.rows.length, 1);
  assert.equal(res.body.data.rows[0].oldElectricity, 140);
  assert.equal(res.body.data.rows[0].oldWater, 50);
});

test("a reading linked to an issued invoice cannot be changed", async () => {
  const room = { _id: idA, ownerId: idA, status: "rented", price: 100, electricityPrice: 3, waterPrice: 4, serviceFee: 0 };
  let readingWritten = false;
  replace(Room, "find", async () => [room]);
  replace(Contract, "find", async () => []);
  replace(Invoice, "find", async () => [{ roomId: { toString: () => idA }, invoiceCode: "INV-1", oldElectricity: 10, newElectricity: 12, oldWater: 2, newWater: 3 }]);
  replace(MeterReading, "findOneAndUpdate", async () => { readingWritten = true; return {}; });
  const res = await invoke(meter.saveBatchMeterReadings, { user: { _id: idA, role: "landlord" }, body: { month: 5, year: 2026, rows: [row(idA, { newElectricity: 14 })] } });
  assert.equal(res.statusCode, 409);
  assert.equal(readingWritten, false);
});

test("batch database failure reports partial writes for reconciliation", async () => {
  const roomA = { _id: idA, ownerId: idA, status: "rented", price: 100, electricityPrice: 3, waterPrice: 4, serviceFee: 0 };
  const roomBId = "cccccccccccccccccccccccc";
  const roomB = { ...roomA, _id: roomBId };
  let writes = 0;
  replace(Room, "find", async () => [roomA, roomB]);
  replace(Contract, "find", async () => []);
  replace(Invoice, "find", async () => []);
  replace(MeterReading, "findOneAndUpdate", async () => {
    writes += 1;
    if (writes === 2) throw new Error("simulated storage failure");
    return { _id: "saved-reading" };
  });
  const res = await invoke(meter.saveBatchMeterReadings, { user: { _id: idA, role: "landlord" }, body: { month: 5, year: 2026, rows: [row(idA), row(roomBId)] } });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.errors.partial, true);
  assert.equal(res.body.errors.savedReadingCount, 1);
});

test("explicit zero service fee is preserved when creating an invoice", async () => {
  const room = { _id: idA, ownerId: idA, status: "rented", price: 1000, electricityPrice: 3, waterPrice: 4, serviceFee: 77, currentElectricity: 20, currentWater: 20, save: async () => {} };
  let created;
  replace(Invoice, "findOne", async () => null);
  replace(Invoice, "create", async (data) => { created = data; return { ...data, _id: "new-invoice", save: async () => {} }; });
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
  let readingWritten = false;
  replace(Invoice, "findOne", async () => null);
  replace(Invoice, "create", async () => { throw { code: 11000, keyValue: { roomId: idA, month: 11, year: new Date().getFullYear() } }; });
  replace(Room, "findById", async () => room);
  replace(Contract, "findOne", async () => null);
  replace(MeterReading, "findOneAndUpdate", async () => { readingWritten = true; return { _id: "reading" }; });
  const now = new Date();
  const res = await invoke(billing.createInvoice, { user: { _id: idA, role: "landlord" }, body: { roomId: idA, month: now.getMonth() + 1, year: now.getFullYear(), oldElectricity: 1, newElectricity: 1, oldWater: 1, newWater: 1 } });
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /đã được tạo bởi yêu cầu khác/);
  assert.equal(readingWritten, false);
});

test("new contract receives a new unpaid invoice in a room-period already billed to an old contract", async () => {
  const oldContractId = "cccccccccccccccccccccccc";
  const newTenantId = "dddddddddddddddddddddddd";
  const room = { _id: idA, ownerId: idA, status: "rented", price: 1000, electricityPrice: 3, waterPrice: 4, serviceFee: 0, currentElectricity: 12, currentWater: 3, save: async () => {} };
  const activeContract = { _id: idB, roomId: idA, tenantId: newTenantId, rentPrice: 1000, electricityPrice: 3, waterPrice: 4, serviceFee: 0 };
  const oldInvoice = { _id: "eeeeeeeeeeeeeeeeeeeeeeee", roomId: idA, contractId: oldContractId, tenantId: oldContractId, status: "paid", invoiceCode: "OLD-PAID" };
  const created = { _id: "ffffffffffffffffffffffff", tenantId: newTenantId, contractId: idB, status: "unpaid", serviceFee: 0, totalAmount: 1006, save: async () => {} };
  let duplicateQuery;
  replace(Invoice, "findOne", async (query) => { duplicateQuery = query; return query.contractId === oldContractId ? oldInvoice : null; });
  replace(Invoice, "create", async (data) => { Object.assign(created, data); return created; });
  replace(Invoice, "findById", () => ({ populate() { return this; }, then(resolve) { resolve(created); } }));
  replace(Room, "findById", async () => room);
  replace(Contract, "findOne", async () => activeContract);
  replace(MeterReading, "findOneAndUpdate", async () => ({ _id: "reading-id" }));
  replace(Notification, "create", async () => ({}));
  const now = new Date();
  const res = await invoke(billing.createInvoice, {
    user: { _id: idA, role: "landlord" },
    body: { roomId: idA, month: now.getMonth() + 1, year: now.getFullYear(), oldElectricity: 10, newElectricity: 12, oldWater: 2, newWater: 3, serviceFee: 0 },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(duplicateQuery.contractId, idB);
  assert.equal(created.contractId, idB);
  assert.equal(created.tenantId, newTenantId);
  assert.equal(created.status, "unpaid");
  assert.equal(oldInvoice.status, "paid");
  assert.equal(oldInvoice.tenantId, oldContractId);
});
