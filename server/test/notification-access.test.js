const test = require("node:test");
const assert = require("node:assert/strict");
const { Notification } = require("../src/models/notification.model");
const { listNotifications, markRead, markAllRead } = require("../src/controllers/notification.controller");

const originalFind = Notification.find;
const originalCountDocuments = Notification.countDocuments;
const originalFindOneAndUpdate = Notification.findOneAndUpdate;
const originalUpdateMany = Notification.updateMany;
const response = () => ({ statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const invoke = async (handler, req) => { const res = response(); let forwarded; await handler(req, res, (error) => { forwarded = error; }); if (forwarded) throw forwarded; return res; };

test.afterEach(() => {
  Notification.find = originalFind;
  Notification.countDocuments = originalCountDocuments;
  Notification.findOneAndUpdate = originalFindOneAndUpdate;
  Notification.updateMany = originalUpdateMany;
});

test("notification list and unread count are scoped to the authenticated user", async () => {
  let listQuery; let countQuery;
  Notification.find = (query) => { listQuery = query; return { sort: () => ({ skip: () => ({ limit: async () => [{ _id: "n1" }] }) }) }; };
  Notification.countDocuments = async (query) => { countQuery = query; return 2; };
  const res = await invoke(listNotifications, { user: { _id: "tenant-a" }, query: { read: "false" } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(listQuery, { userId: "tenant-a", readAt: null });
  assert.deepEqual(countQuery, { userId: "tenant-a", readAt: null });
  assert.equal(res.body.data.unreadCount, 2);
});

test("tenant cannot mark another user's notification as read", async () => {
  let query;
  Notification.findOneAndUpdate = async (filter) => { query = filter; return null; };
  const res = await invoke(markRead, { params: { id: "notification-b" }, user: { _id: "tenant-a" } });
  assert.equal(res.statusCode, 404);
  assert.deepEqual(query, { _id: "notification-b", userId: "tenant-a" });
});

test("mark all read updates only the authenticated user's unread items", async () => {
  let query;
  Notification.updateMany = async (filter) => { query = filter; return { modifiedCount: 3 }; };
  const res = await invoke(markAllRead, { user: { _id: "tenant-a" } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(query, { userId: "tenant-a", readAt: null });
  assert.equal(res.body.data.updatedCount, 3);
});
