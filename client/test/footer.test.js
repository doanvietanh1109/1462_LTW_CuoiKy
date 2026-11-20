import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const componentUrl = new URL("../src/components/common/Footer.jsx", import.meta.url);
const stylesUrl = new URL("../public/css/layout.css", import.meta.url);

test("public footer keeps its required copy, live routes, and configured social link", async () => {
  const component = await readFile(componentUrl, "utf8");

  for (const expected of [
    "Tìm phòng dễ dàng. Thuê trọ an tâm.",
    "Nền tảng kết nối người tìm trọ và chủ nhà, giúp việc tìm kiếm và quản lý",
    "[\"Tìm phòng\", \"/search\"]",
    "[\"Giới thiệu\", \"/about\"]",
    "[\"Cẩm nang thuê trọ\", \"/blog\"]",
    "to=\"/contact\"",
    "https://web.facebook.com/oanvietanhspike/?locale=vi_VN",
    "new Date().getFullYear()",
    "© {new Date().getFullYear()} RIPT Rental. Bảo lưu mọi quyền.",
  ]) assert.ok(component.includes(expected), `Footer should contain ${expected}`);

  assert.ok(!component.includes("href=\"#\""));
});

test("footer styles provide the required palette, responsive layout, and visible keyboard focus", async () => {
  const styles = await readFile(stylesUrl, "utf8");
  const footerStyles = styles.slice(styles.indexOf("/* ======================== 6. FOOTER"), styles.indexOf("/* ======================== CONTAINERS"));

  for (const expected of ["#0B2942", "#124C73", "#56C5E8", "#FB923C", "#CBD5E1", "#94A3B8", "#34546B", "@media (max-width: 760px)", "@media (max-width: 480px)", ".site-footer a:focus-visible"]) {
    assert.ok(footerStyles.includes(expected), `Footer styles should include ${expected}`);
  }
});
