export const validateGuestContactForm = (form) => {
  const errors = {};
  const name = form.name.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();
  const message = form.message.trim();

  if (!name) {
    errors.name = "Vui lòng nhập họ và tên của bạn";
  } else if (name.length < 2 || name.length > 100) {
    errors.name = "Họ và tên phải từ 2 đến 100 ký tự";
  }

  if (!phone) {
    errors.phone = "Vui lòng nhập số điện thoại liên hệ";
  } else if (!/^(0|\+84)[0-9]{8,10}$/.test(phone)) {
    errors.phone = "Số điện thoại không hợp lệ (9-11 chữ số)";
  }

  if (email.length > 254) {
    errors.email = "Email không được vượt quá 254 ký tự";
  } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Email không đúng định dạng";
  }

  if (message.length > 2000) {
    errors.message = "Lời nhắn không được vượt quá 2.000 ký tự";
  }

  return errors;
};

export const buildGuestContactPayload = (roomId, form) => ({
  roomId,
  name: form.name.trim(),
  phone: form.phone.trim(),
  email: form.email.trim(),
  message: form.message.trim(),
});
