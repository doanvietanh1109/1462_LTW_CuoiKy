import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, login, register, authLoading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [authMsg, setAuthMsg] = useState(null); // { text, type: 'error' | 'success' }
  const emailInputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input khi mở modal (useEffect + useRef + cleanup timer - Tiêu chí 4)
  useEffect(() => {
    if (isAuthModalOpen && emailInputRef.current) {
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthModalOpen, isRegisterMode]);

  if (!isAuthModalOpen) return null;

  const validatePassword = (pass) => {
    if (pass.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    if (!/[A-Z]/.test(pass)) return "Mật khẩu phải có ít nhất 1 chữ hoa (A-Z).";
    if (!/[0-9]/.test(pass)) return "Mật khẩu phải có ít nhất 1 chữ số (0-9).";
    return null;
  };

  const toggleAuthMode = () => {
    setIsRegisterMode((prev) => !prev);
    setAuthMsg(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setAuthMsg(null);
  };

  const handleRedirectByRole = (loggedUser) => {
    const role =
      loggedUser?.role ||
      (loggedUser?.email === "Vu69@gmail.com"
        ? "admin"
        : loggedUser?.email === "landlord@example.com"
        ? "landlord"
        : "user");

    if (role === "admin") {
      navigate("/admin");
    } else if (role === "landlord") {
      navigate("/landlord/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthMsg(null);

    const email = formData.email.trim();
    const pass = formData.password;

    if (isRegisterMode) {
      const name = formData.name.trim();
      if (!name) {
        setAuthMsg({ text: "Vui lòng nhập họ và tên.", type: "error" });
        return;
      }
      if (!email) {
        setAuthMsg({ text: "Vui lòng nhập email đăng nhập.", type: "error" });
        return;
      }
      const passErr = validatePassword(pass);
      if (passErr) {
        setAuthMsg({ text: passErr, type: "error" });
        return;
      }

      try {
        const loggedUser = await register({
          name,
          email,
          password: pass,
          role: formData.role,
        });
        setFormData({ name: "", email: "", password: "", role: "user" });
        handleRedirectByRole(loggedUser);
      } catch (err) {
        const msg = err.message || "";
        if (msg.toLowerCase().includes("email")) {
          setAuthMsg({
            text: "Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.",
            type: "error",
          });
        } else {
          setAuthMsg({
            text: msg || "Đăng ký thất bại. Vui lòng thử lại.",
            type: "error",
          });
        }
      }
    } else {
      if (!email || !pass) {
        setAuthMsg({
          text: "Vui lòng nhập đầy đủ email và mật khẩu.",
          type: "error",
        });
        return;
      }

      try {
        const loggedUser = await login(email, pass);
        setFormData({ name: "", email: "", password: "", role: "user" });
        handleRedirectByRole(loggedUser);
      } catch (err) {
        setAuthMsg({
          text: err.message || "Email hoặc mật khẩu không đúng. Vui lòng thử lại.",
          type: "error",
        });
      }
    }
  };

  return (
    <div id="auth-modal" className="auth-modal show">
      <div className="auth-modal-overlay" onClick={closeAuthModal}></div>
      <div className="auth-modal-content">
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthModal}
          aria-label="Đóng"
        >
          &times;
        </button>

        <section className="auth-section">
          <h2 id="auth-title">
            {isRegisterMode ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}
          </h2>
          <p className="auth-desc" id="auth-desc">
            {isRegisterMode
              ? "Tham gia cộng đồng để lưu lại phòng yêu thích!"
              : "Chào mừng bạn trở lại! Đăng nhập để tiếp tục."}
          </p>

          {authMsg && (
            <div
              id="auth-msg"
              style={{
                margin: "10px 0 14px",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: authMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
                color: authMsg.type === "error" ? "#dc2626" : "#16a34a",
                border:
                  authMsg.type === "error"
                    ? "1px solid #fecaca"
                    : "1px solid #bbf7d0",
              }}
            >
              <i
                className={`bi ${
                  authMsg.type === "error"
                    ? "bi-exclamation-circle-fill"
                    : "bi-check-circle-fill"
                }`}
              ></i>
              <span>{authMsg.text}</span>
            </div>
          )}

          <form id="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegisterMode && (
              <>
                <div className="form-group mb-3" id="name-group">
                  <label htmlFor="auth-name" className="form-label">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    id="auth-name"
                    name="name"
                    className="form-control"
                    placeholder="VD: Nguyễn Văn A"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group mb-3" id="role-group">
                  <label htmlFor="auth-role" className="form-label">
                    Vai trò
                  </label>
                  <select
                    id="auth-role"
                    name="role"
                    className="form-select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="user">Người thuê trọ</option>
                    <option value="landlord">Chủ trọ</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group mb-3">
              <label htmlFor="auth-email" className="form-label">
                Email đăng nhập
              </label>
              <input
                ref={emailInputRef}
                type="email"
                id="auth-email"
                name="email"
                className="form-control"
                placeholder="VD: sinhvien@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="auth-pass" className="form-label">
                Mật khẩu
              </label>
              <input
                type="password"
                id="auth-pass"
                name="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {isRegisterMode && (
                <small id="pass-hint" className="text-muted d-block mt-1">
                  Tối thiểu 6 ký tự, gồm ít nhất 1 chữ hoa (A-Z) và 1 chữ số (0-9).
                </small>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              id="auth-btn"
              disabled={authLoading}
            >
              {authLoading
                ? "Đang xử lý..."
                : isRegisterMode
                ? "Đăng Ký Ngay"
                : "Đăng Nhập"}
            </button>
          </form>

          <div className="divider">
            <span>Hoặc</span>
          </div>

          <p className="auth-link" id="auth-toggle-text">
            {isRegisterMode ? (
              <>
                Bạn đã có tài khoản?{" "}
                <a
                  href="#login"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleAuthMode();
                  }}
                >
                  Đăng nhập ngay
                </a>
              </>
            ) : (
              <>
                Bạn chưa có tài khoản?{" "}
                <a
                  href="#register"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleAuthMode();
                  }}
                >
                  Đăng ký ngay
                </a>
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  );
};
