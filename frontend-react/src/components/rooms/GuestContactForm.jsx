import React, { useState } from "react";
import { apiRequest } from "../../api/apiClient";

// Chức năng bắt buộc Đề 4 cho Khách (không đăng nhập): Để lại thông tin liên hệ
export const GuestContactForm = ({ roomId, roomTitle }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: `Tôi quan tâm đến phòng "${roomTitle || ""}", vui lòng liên hệ tư vấn giúp tôi.`,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = "Vui lòng nhập họ và tên của bạn";
    }
    if (!form.phone.trim()) {
      errs.phone = "Vui lòng nhập số điện thoại liên hệ";
    } else if (!/^(0|\+84)[0-9]{8,10}$/.test(form.phone.trim())) {
      errs.phone = "Số điện thoại không hợp lệ (9-11 chữ số)";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Email không đúng định dạng";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setServerError("");

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await apiRequest("/contacts", {
        method: "POST",
        body: {
          roomId,
          ...form,
        },
      });
      setSuccessMsg(res.message || "Đã gửi thông tin liên hệ thành công!");
      setForm({
        name: "",
        phone: "",
        email: "",
        message: "",
      });
    } catch (err) {
      setServerError(err.message || "Có lỗi xảy ra khi gửi thông tin liên hệ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mt-3">
      <h4 className="fw-bold mb-1">
        <i className="bi bi-chat-heart-fill text-primary me-2" />
        Để Lại Thông Tin Liên Hệ Xem Phòng
      </h4>
      <p className="text-muted small mb-3">
        Dành cho khách xem phòng (không cần đăng nhập). Chủ trọ sẽ gọi lại ngay cho bạn!
      </p>

      {successMsg && (
        <div className="alert alert-success py-2 small">
          <i className="bi bi-check-circle-fill me-1" />
          {successMsg}
        </div>
      )}
      {serverError && (
        <div className="alert alert-danger py-2 small">{serverError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="guest-name" className="form-label fw-semibold small">
            Họ và tên của bạn *
          </label>
          <input
            id="guest-name"
            name="name"
            type="text"
            className={`form-control ${errors.name ? "is-invalid" : ""}`}
            placeholder="VD: Nguyễn Minh Khoa"
            value={form.name}
            onChange={handleChange}
          />
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="guest-phone" className="form-label fw-semibold small">
            Số điện thoại *
          </label>
          <input
            id="guest-phone"
            name="phone"
            type="tel"
            className={`form-control ${errors.phone ? "is-invalid" : ""}`}
            placeholder="VD: 0987654321"
            value={form.phone}
            onChange={handleChange}
          />
          {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="guest-email" className="form-label fw-semibold small">
            Email (Tùy chọn)
          </label>
          <input
            id="guest-email"
            name="email"
            type="email"
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            placeholder="VD: khoa@gmail.com"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="guest-message" className="form-label fw-semibold small">
            Lời nhắn / Thời gian muốn xem phòng
          </label>
          <textarea
            id="guest-message"
            name="message"
            rows="3"
            className="form-control"
            value={form.message}
            onChange={handleChange}
            placeholder="Nhập thời gian bạn muốn đến xem phòng..."
          />
        </div>

        <button
          type="submit"
          className="btn btn-success w-100 fw-semibold py-2"
          disabled={submitting}
        >
          <i className="bi bi-send-check-fill me-1" />
          {submitting ? "Đang gửi..." : "Gửi Thông Tin Liên Hệ"}
        </button>
      </form>
    </div>
  );
};
