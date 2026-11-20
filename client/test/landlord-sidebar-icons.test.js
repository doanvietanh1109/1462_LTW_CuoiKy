import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const layoutUrl = new URL("../src/components/layouts/LandlordLayout.jsx", import.meta.url);
const stylesUrl = new URL("../public/css/landlord.css", import.meta.url);

test("expanded landlord sidebar hides all menu and logout icons without changing their actions", async () => {
  const [layout, styles] = await Promise.all([
    readFile(layoutUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  const menu = layout.match(/<nav className="sidebar-nav">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(menu, "landlord menu should exist");
  assert.equal((menu.match(/<i className=/g) || []).length, 11);
  assert.match(styles, /\.dashboard-body \.landlord-sidebar \.sidebar-nav a > i,[\s\S]*?\.dashboard-body \.landlord-sidebar > \.btn-outline-light > i\s*\{\s*display:\s*none;/);
  assert.match(layout, /onClick=\{handleLogout\}/);
  assert.match(layout, /<LandlordBrandLogo\s*\/>/);
  assert.match(layout, /to="\/landlord\/dashboard"/);
  assert.match(layout, /to="\/landlord\/blocks"/);
  assert.match(layout, /to="\/landlord\/rooms"/);
  assert.match(layout, /to="\/landlord\/contracts"/);
  assert.match(layout, /to="\/landlord\/meters"/);
  assert.match(layout, /to="\/landlord\/invoices"/);
  assert.match(layout, /to="\/landlord\/repairs"/);
  assert.match(layout, /to="\/landlord\/contacts"/);
});
