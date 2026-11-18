const ACCOUNT_NUMBER_PATTERN = /^[A-Za-z0-9]{6,19}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export const validateBankAccount = ({ bankBin, bankName, accountNumber, accountName }) => {
  const errors = {};
  const normalizedName = typeof accountName === "string" ? accountName.trim() : "";

  if (!/^\d{6}$/.test(String(bankBin || "")) || !String(bankName || "").trim()) {
    errors.bankBin = "Vui lòng chọn ngân hàng từ danh sách.";
  }
  if (!ACCOUNT_NUMBER_PATTERN.test(String(accountNumber || ""))) {
    errors.accountNumber = "Số tài khoản cần có 6–19 chữ cái hoặc chữ số, không chứa khoảng trắng hay dấu phân cách.";
  }
  if (normalizedName.length < 5 || normalizedName.length > 50 || CONTROL_CHARACTER_PATTERN.test(normalizedName)) {
    errors.accountName = "Tên chủ tài khoản cần dài 5–50 ký tự và không chứa ký tự điều khiển.";
  }

  return errors;
};
