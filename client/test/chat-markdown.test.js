import test from "node:test";
import assert from "node:assert/strict";
import { isSafeChatLink, parseChatMarkdown } from "../src/utils/chatMarkdown.js";

test("chat markdown parses Vietnamese paragraphs, emphasis and headings", () => {
  const blocks = parseChatMarkdown("Xin chào!\nMình có thể hỗ trợ.\n\n## Gợi ý **phòng trọ**\nMột *lựa chọn* phù hợp.");
  assert.equal(blocks[0].type, "p");
  assert.equal(blocks[0].children[0].value, "Xin chào!\nMình có thể hỗ trợ.");
  assert.equal(blocks[1].type, "h2");
  assert.equal(blocks[1].children[1].type, "strong");
  assert.equal(blocks[2].children[1].type, "em");
});

test("chat markdown parses unordered and ordered lists", () => {
  const blocks = parseChatMarkdown("- Tìm theo khu vực\n- So sánh giá\n\n1. Xem phòng\n2. Trao đổi chủ trọ");
  assert.deepEqual(blocks.map(({ type }) => type), ["ul", "ol"]);
  assert.equal(blocks[0].items.length, 2);
  assert.equal(blocks[1].items.length, 2);
});

test("chat markdown handles code blocks, inline code, and tables", () => {
  const blocks = parseChatMarkdown("Dùng `npm test`.\n\n```js\nconst x = 1;\n```\n\n| Phòng | Giá |\n| --- | ---: |\n| A1 | 2 triệu |\n| B2 | 3 triệu |");
  assert.equal(blocks[0].children[1].type, "code");
  assert.equal(blocks[1].type, "codeBlock");
  assert.equal(blocks[1].language, "js");
  assert.equal(blocks[1].value, "const x = 1;");
  assert.equal(blocks[2].type, "table");
  assert.equal(blocks[2].headers.length, 2);
  assert.equal(blocks[2].rows.length, 2);
});

test("chat markdown only permits safe link protocols and treats raw HTML as text", () => {
  const blocks = parseChatMarkdown("[Trang chủ](/) [Trang nguy hiểm](javascript:alert(1))\n\n<script>alert(1)</script>");
  const tokens = blocks[0].children;
  const links = tokens.filter(({ type }) => type === "link");
  assert.equal(isSafeChatLink(links[0].href), true);
  assert.equal(isSafeChatLink(links[1].href), false);
  assert.equal(blocks[1].children[0].value, "<script>alert(1)</script>");
});
