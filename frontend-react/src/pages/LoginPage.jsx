import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const LoginPage = () => {
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const redirectPath = location.state?.from || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    try {
      setError("");
      const user = await login(email, password);
      if (redirectPath !== "/") {
        navigate(redirectPath, { replace: true });
      } else if (user.role === "landlord" || user.role === "admin") {
        navigate("/landlord/dashboard", { replace: true });
      } else {
        navigate("/tenant/my-room", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    }
  };

  const quickLogin = async (demoEmail, demoPass, targetUrl) => {
    try {
      setError("");
      await login(demoEmail, demoPass);
      navigate(targetUrl, { replace: true });
    } catch (err) {
      setError(err.message || "Không thể đăng nhập tài khoản demo");
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: "520px" }}>
      <div className="card border-0 shadow rounded-4 p-4">
        <div className="text-center mb-3">
          <i className="bi bi-shield-lock-fill text-primary display-5" />
          <h3 className="fw-bold mt-2">Đăng Nhập Để Tiếp Tục</h3>
          <p className="text-muted small">
            Trang này được bảo vệ bằng <code>&lt;ProtectedRoute /&gt;</code> và{" "}
            <code>&lt;Navigate /&gt;</code>.
          </p>
        </div>

        <div className="p-3 rounded-3 bg-light border mb-3">
          <div className="small fw-bold mb-2">
            Chọn nhanh vai trò để kiểm thử Đề 4:
          </div>
          <div className="d-grid gap-2">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm text-start"
              onClick={() =>
                quickLogin(
                  "landlord@example.com",
                  "landlord123",
                  "/landlord/dashboard"
                )
              }
            >
              <i className="bi bi-buildings me-2" />
              <strong>Chủ trọ:</strong> landlord@example.com / landlord123
            </button>
            <button
              type="button"
              className="btn btn-outline-success btn-sm text-start"
              onClick={() =>
                quickLogin("user@example.com", "user123", "/tenant/my-room")
              }
            >
              <i className="bi bi-person-check me-2" />
              <strong>Người thuê 1 (Phòng P.101):</strong> user@example.com /
              user123
            </button>
            <button
              type="button"
              className="btn btn-outline-info btn-sm text-start"
              onClick={() =>
                quickLogin("sinhvien2@example.com", "user123", "/tenant/my-room")
              }
            >
              <i className="bi bi-person me-2" />
              <strong>Người thuê 2 (Phòng P.102):</strong> sinhvien2@example.com /
              user123
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="page-email" className="form-label fw-semibold">
              Email
            </label>
            <input
              id="page-email"
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="landlord@example.com"
            />
          </div>
          <div className="mb-3">
            <label htmlFor="page-pass" className="form-label fw-semibold">
              Mật khẩu
            </label>
            <input
              id="page-pass"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold py-2"
            disabled={authLoading}
          >
            {authLoading ? "Đang đăng nhập..." : "Đăng Nhập"}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/" className="small text-decoration-none">
            ← Về trang danh sách phòng trống
          </Link>
        </div>
      </div>
    </div>
  );
};
