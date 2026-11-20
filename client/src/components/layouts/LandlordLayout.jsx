import React from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LandlordBrandLogo } from "../common/LandlordBrandLogo";

// Nested Route Layout cho Chủ trọ có sử dụng <Outlet /> và NavLink active, giống hệt 100% landlord.html
export const LandlordLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dashboard-body">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar landlord-sidebar">
          <Link to="/" className="dashboard-brand">
            <LandlordBrandLogo />
          </Link>

          <div className="sidebar-label">Chủ trọ</div>
          <nav className="sidebar-nav">
            <NavLink
              to="/landlord/dashboard"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="bi bi-grid-1x2"></i> Tổng quan
            </NavLink>
            <a href="/landlord/dashboard#rooms">
              <i className="bi bi-house-door"></i> Phòng của tôi
            </a>
            <a href="/landlord/dashboard#history">
              <i className="bi bi-clock-history"></i> Lịch sử thuê
            </a>
            <NavLink
              to="/landlord/blocks"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="bi bi-buildings"></i> Quản lý dãy trọ
            </NavLink>
            <NavLink
              to="/landlord/rooms"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="bi bi-door-open"></i> Phòng &amp; trạng thái
            </NavLink>
            <NavLink
              to="/landlord/contracts"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="bi bi-file-earmark-text"></i> Hợp đồng thuê
            </NavLink>
            <NavLink
              to="/landlord/meters"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="bi bi-lightning-charge"></i> Chỉ số điện nước
            </NavLink>
            <NavLink
              to="/landlord/invoices"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="bi bi-receipt-cutoff"></i> Hóa đơn &amp; thu tiền
            </NavLink>
            <NavLink
              to="/landlord/repairs"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="bi bi-tools"></i> Yêu cầu sửa chữa
            </NavLink>
            <NavLink
              to="/landlord/contacts"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <i className="bi bi-person-lines-fill"></i> Khách liên hệ
            </NavLink>
            <Link to="/">
              <i className="bi bi-box-arrow-up-right"></i> Trang thuê trọ
            </Link>
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline-light mt-auto"
          >
            <i className="bi bi-box-arrow-right"></i> Đăng xuất
          </button>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-topbar">
            <div>
              <p className="dashboard-kicker">Khu vực chủ trọ</p>
              <h1>Quản lý phòng trọ</h1>
            </div>
            <div className="dashboard-user">
              <i className="bi bi-person-circle"></i>
              <span id="dashboard-user-name">{user?.name || "Chủ trọ"}</span>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
};
