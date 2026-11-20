import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { blogPosts, blogCategories, filterBlogPosts, getBlogPostBySlug, getBlogReadingMinutes, getValidBlogDate, normalizeBlogText } from "../src/data/blogPosts.js";
import { formatPriceFilterValue, isWithinRange, moveRangeEndpoint } from "../src/utils/rangeFilter.js";
import { validateContactRequest } from "../src/utils/contactValidation.js";

test("search range endpoints clamp to bounds and retain an ordered interval", () => {
  assert.deepEqual(moveRangeEndpoint({ min: 0, max: 100, value: 120, endpoint: "max", step: 5, lowerBound: 0, upperBound: 100 }), { min: 0, max: 100 });
  assert.deepEqual(moveRangeEndpoint({ min: 20, max: 80, value: 70, endpoint: "min", step: 5, lowerBound: 0, upperBound: 100 }), { min: 70, max: 80 });
  assert.equal(isWithinRange(5000000, 0, 6000000), true);
  assert.equal(isWithinRange(7000000, 0, 6000000), false);
  assert.equal(formatPriceFilterValue(0), "0 đ");
  assert.equal(formatPriceFilterValue(6000000), "6 triệu đồng");
  assert.equal(formatPriceFilterValue(1500000), "1,5 triệu đồng");
});

test("public blog contains the requested guide topics with unique slugs and illustrations", () => {
  assert.ok(blogPosts.length >= 15);
  assert.equal(new Set(blogPosts.map(({ slug }) => slug)).size, blogPosts.length);
  assert.equal(new Set(blogPosts.map(({ image }) => image)).size, blogPosts.length);
  assert.ok(blogPosts.every((post) => existsSync(new URL(`../public${post.image}`, import.meta.url))));
  assert.ok(blogPosts.every((post) => post.title.length > 10 && post.sections.length >= 3 && post.conclusion.length > 60 && post.introduction.length > 100 && getBlogReadingMinutes(post) >= 2));
  assert.ok(blogCategories.every((category) => blogPosts.some((post) => post.categorySlug === category.slug && post.category === category.label)));
  assert.equal(normalizeBlogText("Điện nước & dịch vụ"), "dien nuoc & dich vu");
});

test("blog search, category filtering, legacy slugs, and date handling stay consistent", () => {
  assert.ok(filterBlogPosts(blogPosts, { query: "phòng trọ", categorySlug: "tim-phong" }).length >= 4);
  assert.ok(filterBlogPosts(blogPosts, { query: "biên nhận", categorySlug: "hop-dong-dat-coc" }).length > 0);
  assert.equal(filterBlogPosts(blogPosts, { query: "không tồn tại chủ đề này" }).length, 0);
  assert.equal(getBlogPostBySlug("kiem-tra-gi-truoc-khi-thue-phong-tro").slug, "12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro");
  assert.equal(getBlogPostBySlug("theo-doi-tien-dien-nuoc-va-dich-vu-hang-thang").slug, "cach-kiem-tra-tien-dien-nuoc-va-phi-dich-vu");
  assert.equal(getValidBlogDate("2026-11-18") > 0, true);
  assert.equal(getValidBlogDate("2026-02-31"), 0);
  assert.equal(getValidBlogDate(undefined), 0);
  const dated = [
    { slug: "later", publishedAt: "2026-11-18", categorySlug: "tim-phong", sections: [], title: "later" },
    { slug: "undated", categorySlug: "tim-phong", sections: [], title: "undated" },
    { slug: "earlier", publishedAt: "2026-10-10", categorySlug: "tim-phong", sections: [], title: "earlier" },
  ];
  assert.deepEqual(filterBlogPosts(dated, { sortBy: "newest" }).map(({ slug }) => slug), ["later", "earlier", "undated"]);
});

test("contact form accepts Vietnamese names and reports field-specific validation", () => {
  const valid = { name: "Đoàn Việt Anh", email: "doan@example.com", subject: "Hỗ trợ tài khoản", message: "Tôi cần được hỗ trợ đăng nhập." };
  assert.deepEqual(validateContactRequest(valid), {});
  assert.deepEqual(Object.keys(validateContactRequest({ ...valid, email: "không hợp lệ", subject: "a", message: "ngắn" })).sort(), ["email", "message", "subject"]);
});
