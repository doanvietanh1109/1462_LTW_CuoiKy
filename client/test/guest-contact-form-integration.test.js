import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
  assert.match(form, /body:\s*\{\s*roomId,\s*\.\.\.form/);
  assert.match(form, /setSuccessMsg\(res\.message \|\|/);
  assert.match(form, /setServerError\(err\.message \|\|/);
  assert.match(form, /submittingRef\.current = false/);
});
