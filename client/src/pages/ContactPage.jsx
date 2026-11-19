import React, { useRef, useState } from "react";
import { apiRequest } from "../api/apiClient";
import { validateContactRequest } from "../utils/contactValidation";
import "../styles/public-pages.css";

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

export const ContactPage = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setStatus({ type: "", text: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const nextErrors = validateContactRequest(form);
    setErrors(nextErrors);
    setStatus({ type: "", text: "" });
    if (Object.keys(nextErrors).length) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await apiRequest("/contact-requests", { method: "POST", body: {
        name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim(), message: form.message.trim(),
      } });
      setForm(EMPTY_FORM);
      setStatus({ type: "success", text: "Yêu cầu đã được gửi. Đội ngũ hỗ trợ sẽ tiếp nhận và phản hồi qua email bạn cung cấp." });
    } catch (error) {
      const fieldErrors = error.details?.fieldErrors;
      if (fieldErrors && typeof fieldErrors === "object") setErrors(fieldErrors);
      setStatus({ type: "error", text: error.message || "Chưa gửi được yêu cầu. Vui lòng thử lại sau." });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div className="contact-form-field" key={name}>
      <label htmlFor={`contact-${name}`}>{label}</label>
      <input id={`contact-${name}`} name={name} value={form[name]} onChange={updateField} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `contact-${name}-error` : undefined} {...props}/>
      {errors[name] && <span className="contact-field-error" id={`contact-${name}-error`}>{errors[name]}</span>}
    </div>
  );

  return (
    <main className="public-info-page contact-page">
      <section className="public-hero contact-hero"><div className="public-page-container">
        <span className="public-eyebrow"><i className="bi bi-chat-square-text" aria-hidden="true"/> CHÚNG TÔI CÓ THỂ GIÚP GÌ?</span>
        <h1>Liên hệ với RIPT Rental</h1>
        <p>Gửi câu hỏi hoặc góp ý qua biểu mẫu. Thông tin sẽ được chuyển đến bộ phận quản trị để tiếp nhận.</p>
      </div></section>
      <div className="public-page-container contact-content">
        <section className="contact-copy">
          <span className="public-eyebrow">KẾT NỐI VỚI CHÚNG TÔI</span>
          <h2>Chia sẻ điều bạn đang cần</h2>
          <p>Hãy mô tả rõ vấn đề và cung cấp email có thể nhận phản hồi. Không gửi mật khẩu, mã xác thực hoặc thông tin thanh toán nhạy cảm qua biểu mẫu này.</p>
          <div className="contact-note"><i className="bi bi-shield-check" aria-hidden="true"/><span>Yêu cầu chỉ được hiển thị cho quản trị viên được phân quyền.</span></div>
          <div className="contact-faq"><h3>Trước khi gửi</h3><ul><li>Nếu câu hỏi liên quan một phòng cụ thể, hãy ghi mã phòng trong nội dung.</li><li>Với giao dịch tiền thuê, vui lòng liên hệ trực tiếp chủ trọ qua thông tin trong tài khoản.</li><li>Không gửi thông tin khẩn cấp hoặc dữ liệu cá nhân không cần thiết.</li></ul></div>
        </section>
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <h2>Gửi yêu cầu</h2>
          <div className="contact-form-grid">
            {field("name", "Họ và tên", { type: "text", autoComplete: "name", maxLength: 100, required: true })}
            {field("email", "Email nhận phản hồi", { type: "email", autoComplete: "email", maxLength: 254, required: true })}
            <div className="contact-form-field contact-form-full" key="subject">
              <label htmlFor="contact-subject">Chủ đề</label>
              <input id="contact-subject" name="subject" value={form.subject} onChange={updateField} maxLength={120} required aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? "contact-subject-error" : undefined}/>
              {errors.subject && <span className="contact-field-error" id="contact-subject-error">{errors.subject}</span>}
            </div>
            <div className="contact-form-field contact-form-full" key="message">
              <label htmlFor="contact-message">Nội dung</label>
              <textarea id="contact-message" name="message" value={form.message} onChange={updateField} rows="6" maxLength={5000} required aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "contact-message-error" : undefined}/>
              {errors.message && <span className="contact-field-error" id="contact-message-error">{errors.message}</span>}
              <small>{form.message.length}/5000 ký tự</small>
            </div>
          </div>
          {status.text && <p className={`contact-submit-status is-${status.type}`} role={status.type === "error" ? "alert" : "status"}>{status.text}</p>}
          <button className="btn btn-primary public-primary-button" type="submit" disabled={submitting}>{submitting ? "Đang gửi…" : "Gửi yêu cầu"} <i className={`bi ${submitting ? "bi-arrow-repeat" : "bi-arrow-right"}`} aria-hidden="true"/></button>
        </form>
      </div>
    </main>
  );
};
