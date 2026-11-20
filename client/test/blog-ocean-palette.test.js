import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const stylesUrl = new URL("../src/styles/public-pages.css", import.meta.url);
const illustrationDirectory = new URL("../public/images/blog/", import.meta.url);

test("Blog list and article pages use the scoped RIPT Ocean Blue palette", async () => {
  const styles = await readFile(stylesUrl, "utf8");
  const blogStyles = styles.slice(styles.indexOf("/* RIPT Rental editorial guide"), styles.indexOf("@media (max-width: 900px)"));

  for (const color of ["#0B2942", "#1769AA", "#087FA8", "#12558A", "#EAF5FC", "#F4F9FD", "#C9E3F4", "#1E293B", "#64748B", "#FB923C"]) {
    assert.ok(blogStyles.includes(color), `Blog palette should define ${color}`);
  }
  assert.ok(!blogStyles.includes("blog-green"));
  assert.match(blogStyles, /\.blog-category-bar button:focus-visible/);
  assert.match(blogStyles, /\.blog-article-content section h2:target/);
  assert.match(blogStyles, /\.blog-article-cta/);
});

test("Blog SVG illustrations use blue brand accents without global image filters", async () => {
  const files = (await readdir(illustrationDirectory)).filter((file) => file.endsWith(".svg"));
  assert.ok(files.length >= 15, "Expected the existing set of Blog illustrations");

  const sources = await Promise.all(files.map((file) => readFile(new URL(file, illustrationDirectory), "utf8")));
  assert.ok(sources.every((source) => source.includes("#0B2942")));
  assert.ok(sources.filter((source) => source.includes("#1769AA")).length >= 13);
  assert.ok(sources.every((source) => !/#(?:15803d|14532d|164e35|21543a|cfe8d8|e2f1ec)\b/i.test(source)));
  assert.ok(!/\.blog-page img[^\n]*filter|\.blog-article-page img[^\n]*filter/i.test(await readFile(stylesUrl, "utf8")));
});
