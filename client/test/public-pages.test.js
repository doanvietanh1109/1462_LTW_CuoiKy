import test from "node:test";
import assert from "node:assert/strict";
import { blogPosts, blogCategories, normalizeBlogText } from "../src/data/blogPosts.js";
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

test("public blog has unique slugs, useful articles and accent-insensitive search", () => {
  assert.ok(blogPosts.length >= 3);
  assert.equal(new Set(blogPosts.map(({ slug }) => slug)).size, blogPosts.length);
  assert.ok(blogPosts.every((post) => post.title.length > 10 && post.sections.length >= 2 && post.conclusion.length > 20));
  assert.ok(blogCategories.every((category) => blogPosts.some((post) => post.category === category)));
  assert.equal(normalizeBlogText("Điện nước & dịch vụ"), "dien nuoc & dich vu");
});

test("contact form accepts Vietnamese names and reports field-specific validation", () => {
  const valid = { name: "Đoàn Việt Anh", email: "doan@example.com", subject: "Hỗ trợ tài khoản", message: "Tôi cần được hỗ trợ đăng nhập." };
  assert.deepEqual(validateContactRequest(valid), {});
  assert.deepEqual(Object.keys(validateContactRequest({ ...valid, email: "không hợp lệ", subject: "a", message: "ngắn" })).sort(), ["email", "message", "subject"]);
});
