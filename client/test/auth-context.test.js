import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { shouldClearAuthSession } from "../src/contexts/authSessionPolicy.js";
import { getInvoicePaymentLines, getPaymentResponseData } from "../src/utils/paymentPresentation.js";
import { validateBankAccount } from "../src/utils/bankAccountValidation.js";

test("only one-time AuthContext bootstrap calls /auth/me", async () => {
  const source = await readFile(
    new URL("../src/contexts/AuthContext.jsx", import.meta.url),
    "utf8"
  );

  assert.equal((source.match(/apiRequest\("\/auth\/me"\)/g) || []).length, 1);
  assert.match(source, /\/auth\/me[\s\S]*?\}, \[\]\);/);
});

test("network failures and non-auth HTTP errors do not clear the saved session", () => {
  assert.equal(shouldClearAuthSession(new TypeError("fetch failed")), false);
  assert.equal(shouldClearAuthSession({ status: 404 }), false);
  assert.equal(shouldClearAuthSession({ status: 500 }), false);
});

test("invalid or blocked sessions are cleared", () => {
  assert.equal(shouldClearAuthSession({ status: 401 }), true);
  assert.equal(shouldClearAuthSession({ status: 403 }), true);
});

test("payment instructions use the apiClient envelope without double unwrapping", () => {
  const instructions = { configured: true, invoice: { amount: 4100000 } };
  assert.equal(getPaymentResponseData({ success: true, data: instructions }), instructions);
  assert.equal(getPaymentResponseData({ success: true, data: null }), null);
});

test("payment breakdown displays only positive charges from the selected invoice", () => {
  assert.deepEqual(getInvoicePaymentLines({ roomPrice: 3500000, electricityCost: 420000, waterCost: 180000, serviceFee: 0 }), [
    { label: "Tiền thuê phòng", amount: 3500000 },
    { label: "Tiền điện", amount: 420000 },
    { label: "Tiền nước", amount: 180000 },
  ]);
  assert.deepEqual(getInvoicePaymentLines({ roomPrice: 1000000, electricityCost: 50000, waterCost: 25000, serviceFee: 12000 }), [
    { label: "Tiền thuê phòng", amount: 1000000 },
    { label: "Tiền điện", amount: 50000 },
    { label: "Tiền nước", amount: 25000 },
    { label: "Phí dịch vụ", amount: 12000 },
  ]);
});

test("ACB account number and Vietnamese account name pass bank form validation", () => {
  assert.deepEqual(validateBankAccount({ bankBin: "970416", bankName: "ACB", accountNumber: "20129811", accountName: "Đoàn Việt Anh" }), {});
});

test("bank form identifies the invalid field and explains its expected format", () => {
  assert.deepEqual(validateBankAccount({ bankBin: "", bankName: "", accountNumber: "2012 9811", accountName: "A\nB" }), {
    bankBin: "Vui lòng chọn ngân hàng từ danh sách.",
    accountNumber: "Số tài khoản cần có 6–19 chữ cái hoặc chữ số, không chứa khoảng trắng hay dấu phân cách.",
    accountName: "Tên chủ tài khoản cần dài 5–50 ký tự và không chứa ký tự điều khiển.",
  });
});
