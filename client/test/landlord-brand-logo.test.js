import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const componentUrl = new URL("../src/components/common/LandlordBrandLogo.jsx", import.meta.url);
const layoutUrl = new URL("../src/components/layouts/LandlordLayout.jsx", import.meta.url);
const stylesUrl = new URL("../public/css/landlord.css", import.meta.url);

test("landlord sidebar uses the Green RIPT Rental house and checklist mark", async () => {
  const [component, layout, styles] = await Promise.all([
    readFile(componentUrl, "utf8"),
    readFile(layoutUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(layout, /<LandlordBrandLogo\s*\/>/);
  assert.doesNotMatch(layout, /<span>Thuê Phòng<\/span>/);
  assert.match(component, /viewBox="0 0 48 48"/);
  assert.match(component, /landlord-brand-logo__checklist/);
  assert.match(component, /landlord-brand-logo__check/);
  assert.match(component, /RIPT Rental/);
  assert.match(styles, /\.landlord-brand-logo__mark[\s\S]*?width: 40px/);
  assert.match(styles, /fill: #A8F0C6/);
  assert.match(styles, /stroke: #fff/);
});
