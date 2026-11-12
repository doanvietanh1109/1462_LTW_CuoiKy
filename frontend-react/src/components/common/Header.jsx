import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

export const Header = ({ onToggleChat }) => {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài (useEffect có cleanup listener - Tiêu chí 4)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const getUserRole = (u) => {
    if (!u) return "guest";
    if (u.role) return u.role;
    if (u.email === "Vu69@gmail.com") return "admin";
    if (u.email === "landlord@example.com") return "landlord";
    return "user";
  };

  const role = getUserRole(user);
  const name = user?.name || "Người dùng";
  const letter = name.trim().charAt(0).toUpperCase() || "A";
  const roleLabels = {
    admin: "Quản trị viên",
    landlord: "Chủ trọ",
    user: "Người thuê",
  };

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      setDropdownOpen(false);
      logout();
      navigate("/");
    }
  };

  const handleToggleChat = (e) => {
    e.preventDefault();
    if (typeof onToggleChat === "function") {
      onToggleChat();
    } else {
      window.dispatchEvent(new CustomEvent("toggle-ai-chat"));
    }
  };

  return (
    <header>
      <div className="navbar navbar-expand-lg app-navbar">
        <Link to="/" className="logo navbar-brand d-flex align-items-center gap-2">
          <img
            src="/images/logo.jpg"
            alt="Logo"
            style={{ height: "40px", width: "auto", borderRadius: "4px" }}
          />
          <span style={{ fontWeight: 600 }}>RIPT Rental</span>
        </Link>

        <ul className="nav-links navbar-nav">
          <li className="nav-item">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              Trang chủ
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/search"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              Tìm phòng
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/bookmarks"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <i className="bi bi-bookmark-heart"></i> Đã lưu
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/compare"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              So sánh
            </NavLink>
          </li>
          <li className="nav-item">
            <a href="#about" className="nav-link">
              Giới thiệu
            </a>
          </li>
          <li className="nav-item">
            <a href="#blog" className="nav-link">
              Blog
            </a>
          </li>
          <li className="nav-item">
            <a href="#contact" className="nav-link">
              Liên hệ
            </a>
          </li>
          <li className="dropdown nav-item">
            <a
              href="#support"
              onClick={(e) => e.preventDefault()}
              className="dropbtn nav-link"
            >
              Hỗ trợ ▾
            </a>
            <div className="dropdown-content">
              <a href="#chat-ai" onClick={handleToggleChat}>
                <i className="bi bi-chat-dots"></i> Chat với AI
              </a>
              <a href="tel:0987654321">
                <i className="bi bi-telephone"></i> Gọi: 0987.654.321
              </a>
              <a
                href="#theme"
                onClick={(e) => {
                  e.preventDefault();
                  toggleTheme();
                }}
              >
                <i
                  className={`bi ${
                    theme === "dark" ? "bi-sun-fill text-warning" : "bi-moon-stars-fill"
                  }`}
                ></i>{" "}
                Giao diện: {theme === "dark" ? "Tối" : "Sáng"}
              </a>
            </div>
          </li>
        </ul>

        <div className="user-icons">
          {!isAuthenticated ? (
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                openAuthModal();
              }}
              className="btn btn-primary btn-header"
              id="btn-login"
            >
              <i className="bi bi-person-circle"></i> Đăng ký / Đăng nhập
            </a>
          ) : (
            <div className="user-dropdown" id="user-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="user-dropdown-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen((prev) => !prev);
                }}
              >
                <span className="user-avatar-circle" id="user-avatar-letter">
                  {letter}
                </span>
                <span className="user-display-name" id="user-display-name">
                  {name}
                </span>
                <i
                  className={`bi bi-chevron-down user-chevron ${
                    dropdownOpen ? "open" : ""
                  }`}
                  id="user-chevron"
                ></i>
              </button>

              <div
                className={`user-dropdown-menu ${dropdownOpen ? "open" : ""}`}
                id="user-dropdown-menu"
              >
                <div className="user-dropdown-info">
                  <div
                    className="user-dropdown-info-avatar"
                    id="user-dropdown-avatar-letter"
                  >
                    {letter}
                  </div>
                  <div className="user-dropdown-info-text">
                    <span className="user-dropdown-name" id="user-dropdown-fullname">
                      {name}
                    </span>
                    <span className="user-dropdown-role" id="user-dropdown-role">
                      {roleLabels[role] || "Người dùng"}
                    </span>
                  </div>
                </div>
                <hr className="user-dropdown-divider" />

                {role === "admin" && (
                  <Link
                    to="/admin"
                    id="user-dropdown-admin"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <i className="bi bi-speedometer2"></i> Quản trị Admin
                  </Link>
                )}

                {(role === "landlord" || role === "admin") && (
                  <Link
                    to="/landlord/dashboard"
                    id="user-dropdown-landlord"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <i className="bi bi-houses"></i> Quản lý phòng
                  </Link>
                )}

                <Link
                  to="/tenant/my-room"
                  onClick={() => setDropdownOpen(false)}
                >
                  <i className="bi bi-receipt-cutoff"></i> Phòng & Hóa đơn của tôi
                </Link>

                <a
                  href="#logout"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i> Đăng xuất
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
