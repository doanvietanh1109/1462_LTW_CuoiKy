const test = require("node:test");
const assert = require("node:assert/strict");
const { ContactInquiry } = require("../src/models/contactInquiry.model");
const { Room } = require("../src/models/room.model");
const { RepairRequest } = require("../src/models/repairRequest.model");
const { Contract } = require("../src/models/contract.model");
const contacts = require("../src/controllers/contact.controller");
const repairs = require("../src/controllers/repairRequest.controller");
const { validateImageFiles } = require("../src/middlewares/upload.middleware");
const { contactRateLimit } = require("../src/middlewares/contactRateLimit");

const originals = new Map();
const replace = (object, key, value) => {
  if (!originals.has(`${object.modelName}.${key}`)) originals.set(`${object.modelName}.${key}`, [object, key, object[key]]);
  object[key] = value;
};
const restore = () => { for (const [object, key, value] of originals.values()) object[key] = value; originals.clear(); };
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

test.afterEach(restore);

test("landlord cannot change another landlord's contact inquiry", async () => {
  replace(ContactInquiry, "findById", async () => ({ landlordId: idB, status: "new" }));
  const res = await invoke(contacts.updateContactStatus, { params: { id: idA }, user: { _id: idA, role: "landlord" }, body: { status: "contacted" } });
  assert.equal(res.statusCode, 403);
});

test("contact message is validated before database write", async () => {
  let created = false;
  replace(ContactInquiry, "create", async () => { created = true; });
  const res = await invoke(contacts.createContactInquiry, { body: { roomId: idA, name: "A", phone: "1", message: "x" } });
  assert.equal(res.statusCode, 400);
  assert.equal(created, false);
});

test("contact endpoints return validation errors for null or missing JSON bodies", async () => {
  const guestRes = await invoke(contacts.createContactInquiry, { body: null });
  assert.equal(guestRes.statusCode, 400);

  replace(ContactInquiry, "findById", async () => ({ landlordId: idA, status: "new" }));
  const updateRes = await invoke(contacts.updateContactStatus, {
    params: { id: idB },
    body: null,
    user: { _id: idA, role: "landlord" },
  });
  assert.equal(updateRes.statusCode, 400);
});

test("contact email and message limits are enforced after trimming", async () => {
  let created = false;
  let roomRead = false;
  replace(ContactInquiry, "create", async () => { created = true; });
  replace(Room, "findById", async () => { roomRead = true; return { _id: idA, status: "available" }; });
  const valid = {
    roomId: idA,
    name: " Nguyễn Minh Khoa ",
    phone: " 0987654321 ",
    email: `${"a".repeat(247)}@b.test`, // exactly 254 after trim
    message: ` ${"m".repeat(2000)} `, // exactly 2,000 after trim
  };

  const boundaryRes = await invoke(contacts.createContactInquiry, { body: valid });
  assert.equal(boundaryRes.statusCode, 201);
  assert.equal(created, true);

  created = false;
  roomRead = false;
  const emailRes = await invoke(contacts.createContactInquiry, {
    body: { ...valid, email: ` ${"a".repeat(248)}@b.test ` },
  });
  assert.equal(emailRes.statusCode, 400);
  assert.equal(roomRead, false);
  assert.equal(created, false);

  const messageRes = await invoke(contacts.createContactInquiry, {
    body: { ...valid, message: ` ${"m".repeat(2001)} ` },
  });
  assert.equal(messageRes.statusCode, 400);
  assert.equal(created, false);
});

test("guest inquiry derives landlordId from the selected room and ignores a supplied landlordId", async () => {
  const landlordId = "bbbbbbbbbbbbbbbbbbbbbbbb";
  let createdInquiry;
  replace(Room, "findById", async () => ({ _id: idA, ownerId: landlordId, status: "available" }));
  replace(ContactInquiry, "create", async (payload) => {
    createdInquiry = payload;
    return { _id: "cccccccccccccccccccccccc", ...payload };
  });

  const res = await invoke(contacts.createContactInquiry, {
    body: {
      roomId: idA,
      landlordId: "aaaaaaaaaaaaaaaaaaaaaaaa",
      name: "Nguyễn Minh Khoa",
      phone: "0987654321",
      email: "khoa@example.test",
      message: "Tôi muốn hỏi lịch xem phòng.",
    },
  });

  assert.equal(res.statusCode, 201);
  assert.equal(createdInquiry.roomId, idA);
  assert.equal(createdInquiry.landlordId, landlordId);
  assert.notEqual(createdInquiry.landlordId, "aaaaaaaaaaaaaaaaaaaaaaaa");
});

test("landlord inquiry list is scoped to that landlord for the management page", async () => {
  const landlordId = "bbbbbbbbbbbbbbbbbbbbbbbb";
  const inquiries = [{ _id: "cccccccccccccccccccccccc", landlordId, roomId: idA }];
  let querySeen;
  replace(ContactInquiry, "find", (query) => {
    querySeen = query;
    return { populate: () => ({ sort: async () => inquiries }) };
  });

  const res = await invoke(contacts.getContactInquiries, {
    user: { _id: landlordId, role: "landlord" },
    query: {},
  });

  assert.deepEqual(querySeen, { landlordId });
  assert.deepEqual(res.body.data.inquiries, inquiries);
});

test("tenant cannot create repair request for a room without their active contract", async () => {
  replace(Contract, "findOne", () => ({ sort: async () => null }));
  const res = await invoke(repairs.createRepairRequest, {
    params: {},
    body: { roomId: idB, title: "Rò nước", description: "Vòi nước trong phòng bị rò" },
    files: [],
    user: { _id: idA, email: "a@example.test", role: "user" },
  });
  assert.equal(res.statusCode, 403);
});

test("repair endpoints return validation errors for null JSON bodies", async () => {
  const createRes = await invoke(repairs.createRepairRequest, {
    body: null,
    files: [],
    user: { _id: idA, email: "a@example.test", role: "user" },
  });
  assert.equal(createRes.statusCode, 400);

  replace(RepairRequest, "findById", async () => ({ landlordId: idA, status: "new" }));
  const updateRes = await invoke(repairs.updateRepairStatus, {
    params: { id: idB },
    body: null,
    user: { _id: idA, role: "landlord" },
  });
  assert.equal(updateRes.statusCode, 400);
});

test("landlord cannot change a repair request owned by another landlord", async () => {
  replace(RepairRequest, "findById", async () => ({ landlordId: idB, status: "new" }));
  const res = await invoke(repairs.updateRepairStatus, {
    params: { id: idA }, body: { status: "resolved" }, user: { _id: idA, role: "landlord" },
  });
  assert.equal(res.statusCode, 403);
});

test("upload validation checks file signatures rather than trusting client MIME", async () => {
  const res = response();
  let nextCalled = false;
  validateImageFiles({ files: [{ mimetype: "image/png", buffer: Buffer.from("not an image") }] }, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 400);
  assert.equal(nextCalled, false);
});

test("contact submissions have a basic per-address rate limit", () => {
  const ip = `test-${Date.now()}`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let nextCalled = false;
    contactRateLimit({ ip }, response(), () => { nextCalled = true; });
    assert.equal(nextCalled, true);
  }
  const res = response();
  contactRateLimit({ ip }, res, () => assert.fail("Expected rate limit"));
  assert.equal(res.statusCode, 429);
});
