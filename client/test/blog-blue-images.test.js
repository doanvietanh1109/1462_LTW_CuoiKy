import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { blogPosts } from "../src/data/blogPosts.js";

const expectedImageBySlug = {
  "kinh-nghiem-tim-phong-tro-cho-sinh-vien-nam-nhat": "RIPT_Rental_01.png",
  "chon-phong-tro-theo-ngan-sach-va-vi-tri": "RIPT_Rental_02.png",
  "checklist-di-xem-phong-truc-tiep": "RIPT_Rental_03.png",
  "nhung-dieu-can-biet-truoc-khi-dat-coc-thue-tro": "RIPT_Rental_04.png",
  "doc-hop-dong-thue-phong-tro": "RIPT_Rental_05.png",
  "nhung-khoan-phi-can-hoi-ro-khi-thue-tro": "RIPT_Rental_06.png",
  "cach-kiem-tra-tien-dien-nuoc-va-phi-dich-vu": "RIPT_Rental_07.png",
  "nhan-biet-tin-dang-phong-tro-lua-dao": "RIPT_Rental_08.png",
  "luu-y-an-ninh-va-phong-chay-khi-thue-tro": "RIPT_Rental_09.png",
  "chong-nong-chong-am-va-giu-phong-thong-thoang": "RIPT_Rental_10.png",
  "trang-tri-phong-tro-nho-dep-va-tiet-kiem": "RIPT_Rental_11.png",
  "kinh-nghiem-o-ghep-chia-chi-phi-va-trach-nhiem": "RIPT_Rental_12.png",
  "chuyen-tro-tiet-kiem-thoi-gian-va-chi-phi": "RIPT_Rental_13.png",
  "nhung-dieu-nguoi-thue-can-biet-ve-quyen-va-thu-tuc-cu-tru": "RIPT_Rental_14.png",
  "ban-giao-phong-va-doi-chieu-tien-coc": "RIPT_Rental_15.png",
};

test("the supplied Blue thumbnails map to the matching article titles", () => {
  assert.equal(blogPosts.length, 16);
  for (const [slug, filename] of Object.entries(expectedImageBySlug)) {
    const post = blogPosts.find((item) => item.slug === slug);
    assert.ok(post, `Article ${slug} exists`);
    assert.equal(post.image, `/images/blog/${filename}`);
    assert.ok(post.imageAlt.includes("Ảnh bìa Blue:"));
    assert.ok(existsSync(new URL(`../public${post.image}`, import.meta.url)));
  }

  const featuredArticle = blogPosts.find((post) => post.slug === "12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro");
  assert.equal(featuredArticle.featured, true);
  assert.equal(featuredArticle.image, "/images/blog/RIPT_Rental_12_Dieu_Kiem_Tra_Blue.png");
  assert.ok(featuredArticle.imageAlt.includes("12 điều cần kiểm tra"));
  assert.ok(existsSync(new URL(`../public${featuredArticle.image}`, import.meta.url)));
  assert.equal(new Set(Object.values(expectedImageBySlug)).size, 15);
});

test("article list, detail, and related cards all use the shared image field", async () => {
  const [listPage, detailPage, styles] = await Promise.all([
    readFile(new URL("../src/pages/BlogPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/BlogArticlePage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles/public-pages.css", import.meta.url), "utf8"),
  ]);

  assert.match(listPage, /src=\{featuredPost\.image\}/);
  assert.match(listPage, /src=\{post\.image\}/);
  assert.match(detailPage, /src=\{post\.image\}/);
  assert.match(detailPage, /src=\{item\.image\}/);
  assert.match(styles, /\.blog-related a img[\s\S]*?object-fit: cover/);
  assert.match(styles, /RIPT_Rental_12_Dieu_Kiem_Tra_Blue\.png[\s\S]*?object-fit: contain/);
  assert.match(styles, /\.blog-article-cover\[src\$="RIPT_Rental_12_Dieu_Kiem_Tra_Blue\.png"\][\s\S]*?aspect-ratio: auto/);
});
