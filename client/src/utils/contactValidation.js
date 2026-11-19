const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const validateContactRequest = (values) => {
  const errors = {};
  const name = String(values.name || "").trim();
  const email = String(values.email || "").trim();
  const subject = String(values.subject || "").trim();
  const message = String(values.message || "").trim();

  if (name.length < 2 || name.length > 100) errors.name = "Họ tên cần có từ 2 đến 100 ký tự.";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) errors.email = "Vui lòng nhập địa chỉ email hợp lệ.";
  if (subject.length < 3 || subject.length > 120) errors.subject = "Chủ đề cần có từ 3 đến 120 ký tự.";
  if (message.length < 10 || message.length > 5000) errors.message = "Nội dung cần có từ 10 đến 5.000 ký tự.";
  return errors;
};
