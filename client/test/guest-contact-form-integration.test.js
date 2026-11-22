import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildGuestContactPayload,
  validateGuestContactForm,
} from "../src/utils/guestContact.js";

const pageUrl = new URL("../src/pages/RoomDetailPage.jsx", import.meta.url);
const formUrl = new URL("../src/components/rooms/GuestContactForm.jsx", import.meta.url);
const stylesUrl = new URL("../public/css/detail.css", import.meta.url);

test("guest inquiry appears below landlord info only for unauthenticated guests and available rooms", async () => {
  const [page, styles] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(page, /import \{ GuestContactForm \} from "\.\.\/components\/rooms\/GuestContactForm"/);
  assert.match(page, /!isAuthenticated && room\.status === "available"/);
  assert.match(page, /roomId=\{room\._id \|\| room\.id \|\| id\}/);
  assert.match(page, /roomTitle=\{room\.title\}/);
  assert.ok(page.indexOf("className=\"contact-box\"") < page.indexOf("className=\"room-guest-contact\""));
  assert.match(styles, /\.room-guest-contact \.card[\s\S]*?border-top: 3px solid #1769AA/);
  assert.match(styles, /\.room-guest-contact \.btn-success[\s\S]*?background: #1769AA/);
});

test("guest form validates, posts its roomId, reports both outcomes, and locks concurrent submits", async () => {
  const form = await readFile(formUrl, "utf8");

  assert.match(form, /if \(submittingRef\.current\) return/);
  assert.match(form, /if \(!validate\(\)\) return/);
  assert.match(form, /apiRequest\("\/contacts",\s*\{\s*method: "POST"/);
  assert.match(form, /body:\s*buildGuestContactPayload\(roomId, form\)/);
  assert.match(form, /maxLength=\{254\}/);
  assert.match(form, /maxLength=\{2000\}/);
  assert.match(form, /setSuccessMsg\(res\.message \|\|/);
  assert.match(form, /setServerError\(err\.message \|\|/);
  assert.match(form, /submittingRef\.current = false/);
});

test("guest contact payload trims and preserves each submitted field and roomId", () => {
  const payload = buildGuestContactPayload("room-123", {
    name: "  Nguyễn Minh Khoa  ",
    phone: " 0987654321 ",
    email: " khoa@example.test ",
    message: "  Tôi muốn hỏi lịch xem phòng.  ",
  });

  assert.deepEqual(payload, {
    roomId: "room-123",
    name: "Nguyễn Minh Khoa",
    phone: "0987654321",
    email: "khoa@example.test",
    message: "Tôi muốn hỏi lịch xem phòng.",
  });
});

test("guest contact limits are validated after trimming and accept exact limits", () => {
  const base = {
    name: "Nguyễn Minh Khoa",
    phone: "0987654321",
    email: `${"a".repeat(247)}@b.test`, // exactly 254 chars
    message: "m".repeat(2000),
  };
  assert.deepEqual(validateGuestContactForm(base), {});

  const overEmail = { ...base, email: ` ${"a".repeat(248)}@b.test ` };
  const overMessage = { ...base, message: ` ${"m".repeat(2001)} ` };
  assert.match(validateGuestContactForm(overEmail).email, /254/);
  assert.match(validateGuestContactForm(overMessage).message, /2.000/);
});
