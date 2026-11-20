import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const component = new URL("../src/components/common/BrandLogo.jsx", import.meta.url);
const header = new URL("../src/components/common/Header.jsx", import.meta.url);
const footer = new URL("../src/components/common/Footer.jsx", import.meta.url);
const blogPage = new URL("../src/pages/BlogPage.jsx", import.meta.url);
const blogArticlePage = new URL("../src/pages/BlogArticlePage.jsx", import.meta.url);
const styles = new URL("../public/css/layout.css", import.meta.url);

test("Header and Footer share the accessible home mark with light and dark variants", async () => {
  const [componentSource, headerSource, footerSource, blogPageSource, blogArticleSource, styleSource] = await Promise.all([
    readFile(component, "utf8"), readFile(header, "utf8"), readFile(footer, "utf8"),
    readFile(blogPage, "utf8"), readFile(blogArticlePage, "utf8"), readFile(styles, "utf8"),
  ]);

  assert.match(componentSource, /variant = "light"/);
  assert.match(componentSource, /RIPT Rental — Trang chủ/);
  assert.match(componentSource, /viewBox="0 0 48 48"/);
  assert.match(headerSource, /<BrandLogo variant="light"/);
  assert.match(footerSource, /<BrandLogo variant="dark"/);
  assert.match(blogPageSource, /<BrandLogo variant="light" className="blog-sidebar-brand__logo"\/>/);
  assert.match(blogArticleSource, /<BrandLogo variant="light" className="blog-sidebar-brand__logo"\/>/);
  assert.doesNotMatch(headerSource, /src="\/images\/logo\.jpg"/);
  assert.doesNotMatch(footerSource, /src="\/images\/logo\.jpg"/);
  assert.doesNotMatch(blogPageSource, /src="\/images\/logo\.jpg"/);
  assert.doesNotMatch(blogArticleSource, /src="\/images\/logo\.jpg"/);
  assert.match(styleSource, /\.brand-logo--light \{ color: #0B2942; \}/);
  assert.match(styleSource, /\.brand-logo--dark[\s\S]*?color: #fff;/);
  assert.match(styleSource, /--brand-mark-primary: #56C5E8/);
});
