import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-brand">
          <Link to="/" className="logo d-flex align-items-center gap-2">
            <img
              src="/images/logo.jpg"
              alt="Logo"
              style={{ height: "50px", width: "auto", borderRadius: "4px" }}
            />
            <span style={{ fontWeight: 600, fontSize: "1.2rem" }}>RIPT Rental</span>
          </Link>
          <p className="footer-tagline">
            Nền tảng tìm kiếm và đặt thuê phòng trọ uy tín
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Liên kết</h4>
            <ul>
              <li>
                <Link to="/">Trang chủ</Link>
              </li>
              <li>
                <Link to="/search">Tìm phòng</Link>
              </li>
              <li>
                <Link to="/bookmarks">Đã lưu</Link>
              </li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Theo dõi</h4>
            <div className="social-icons">
              <a
                href="https://web.facebook.com/oanvietanhspike/?locale=vi_VN"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#instagram" className="social-icon">
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © 2026 RIPT Rental - Hệ thống Thuê Phòng Trực Tuyến. Thiết kế bởi Sinh viên
          Học viện.
        </p>
      </div>
    </footer>
  );
};
