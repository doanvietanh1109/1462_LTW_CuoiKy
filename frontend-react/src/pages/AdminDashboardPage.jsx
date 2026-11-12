import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest, formatVND } from "../api/apiClient";

export const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [userFilterRole, setUserFilterRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Coupon form state
  const [couponCode, setCouponCode] = useState("");
  const [couponVal, setCouponVal] = useState("");
  const [couponLimit, setCouponLimit] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("");

  const loadAdminData = async () => {
    try {
      const [orderRes, couponRes, dashRes, userRes, tenantRes, reviewRes] =
        await Promise.all([
          apiRequest("/orders").catch(() => ({ data: { orders: [] } })),
          apiRequest("/coupons").catch(() => ({ data: { coupons: [] } })),
          apiRequest("/admin/dashboard").catch(() => ({ data: {} })),
          apiRequest("/admin/users").catch(() => ({ data: { users: [] } })),
          apiRequest("/admin/tenants").catch(() => ({ data: { tenants: [] } })),
          apiRequest("/admin/reviews").catch(() => ({ data: { reviews: [] } })),
        ]);

      setOrders(orderRes?.data?.orders || []);
      setCoupons(couponRes?.data?.coupons || []);
      setStats(dashRes?.data || {});
      setUsers(userRes?.data?.users || []);
      setTenants(tenantRes?.data?.tenants || []);
      setReviews(reviewRes?.data?.reviews || []);
    } catch {
      // ignore fallback errors
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCreateCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    const val = parseInt(couponVal, 10);
    if (!code || !val || val <= 0) {
      alert("Vui lòng nhập mã và số tiền giảm hợp lệ!");
      return;
    }

    const payload = { code, value: val };
    if (couponLimit) payload.usageLimit = parseInt(couponLimit, 10);
    if (couponExpiry) payload.expiryDate = couponExpiry;

    try {
      await apiRequest("/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCouponCode("");
      setCouponVal("");
      setCouponLimit("");
      setCouponExpiry("");
      loadAdminData();
    } catch (err) {
      alert(err.message || "Không thể tạo mã giảm giá.");
    }
  };

  const handleToggleCoupon = async (c) => {
    const id = c._id || c.id;
    if (!id) return;
    try {
      await apiRequest(`/coupons/${id}/toggle`, { method: "PATCH" });
      loadAdminData();
    } catch (err) {
      alert(err.message || "Không thể cập nhật trạng thái mã.");
    }
  };

  const handleDeleteCoupon = async (c) => {
    const id = c._id || c.id;
    if (!id) return;
    if (!window.confirm(`Xóa mã "${c.code}"?`)) return;
    try {
      await apiRequest(`/coupons/${id}`, { method: "DELETE" });
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearOrders = async () => {
    if (!window.confirm("Xóa toàn bộ lịch sử đơn hàng?")) return;
    try {
      await apiRequest("/orders", { method: "DELETE" });
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleLockUser = async (u) => {
    try {
      await apiRequest(`/admin/users/${u._id}/lock`, { method: "PATCH" });
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Xóa tài khoản "${u.name}"?`)) return;
    try {
      await apiRequest(`/admin/users/${u._id}`, { method: "DELETE" });
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteReview = async (r) => {
    if (!window.confirm("Gỡ đánh giá này khỏi hệ thống?")) return;
    try {
      await apiRequest(`/admin/reviews/${r._id}`, { method: "DELETE" });
      loadAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userFilterRole && u.role !== userFilterRole) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [users, userFilterRole, searchQuery]);

  const adminName = user?.name || "Admin";
  const avatarLetter = adminName.trim().charAt(0).toUpperCase() || "A";
  const todayStr = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const ov = stats.overview || {};
  const rs = stats.roomStatus || {};
  const totalRevenue =
    ov.totalRevenue ??
    orders.reduce((sum, o) => sum + (Number(o.totalPrice || o.price) || 0), 0);

  return (
    <div className="ad-body">
      <div className="ad-layout">
        {/* ====== LEFT ICON SIDEBAR (matching admin.html 100%) ====== */}
        <aside className="ad-sidebar">
          <Link to="/" className="ad-brand">
            <span className="ad-brand-mark">
              <i className="bi bi-buildings"></i>
            </span>
            <span>
              Ript<b>Admin</b>
            </span>
          </Link>

          <div className="ad-nav-label">Menu</div>
          <nav className="ad-nav">
            <a href="#overview" className="active">
              <i className="bi bi-grid-1x2-fill"></i>
              <span>Tổng quan</span>
            </a>
            <a href="#users">
              <i className="bi bi-people-fill"></i>
              <span>Tài khoản</span>
            </a>
            <a href="#tenants">
              <i className="bi bi-person-badge-fill"></i>
              <span>Người thuê</span>
            </a>
            <a href="#reviews">
              <i className="bi bi-chat-square-quote-fill"></i>
              <span>Đánh giá</span>
            </a>
            <a href="#orders">
              <i className="bi bi-receipt"></i>
              <span>Đơn đặt phòng</span>
            </a>
            <a href="#coupons">
              <i className="bi bi-ticket-perforated-fill"></i>
              <span>Mã giảm giá</span>
            </a>
            <Link to="/landlord/dashboard">
              <i className="bi bi-houses-fill"></i>
              <span>Quản lý Nhà trọ</span>
            </Link>
            <Link to="/">
              <i className="bi bi-box-arrow-up-right"></i>
              <span>Trang thuê trọ</span>
            </Link>
          </nav>

          <button type="button" onClick={handleLogout} className="ad-logout">
            <i className="bi bi-box-arrow-right"></i> Đăng xuất
          </button>
        </aside>

        {/* ====== MAIN WORKSPACE ====== */}
        <main className="ad-main">
          {/* TOP BAR */}
          <header className="ad-topbar">
            <div className="ad-greeting">
              <h1>
                Xin chào, <b id="dashboard-user-name">{adminName}</b>
              </h1>
              <p>Tổng quan hoạt động hệ thống cho thuê phòng trọ hôm nay.</p>
            </div>
            <div className="ad-tools">
              <div className="ad-search">
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  id="admin-search"
                  placeholder="Tìm kiếm đơn hàng, khách thuê..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="ad-date">
                <i className="bi bi-calendar3"></i>
                <span id="ad-today">{todayStr}</span>
              </div>
              <button
                type="button"
                className="ad-icon-btn"
                title="Làm mới"
                onClick={loadAdminData}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
              <div className="ad-avatar" id="ad-avatar">
                {avatarLetter}
              </div>
            </div>
          </header>

          {/* FILTER TABS ROW */}
          <div className="ad-tabs-row">
            <div className="ad-tabs">
              <a href="#overview" className="ad-tab active">
                Tổng quan
              </a>
              <a href="#users" className="ad-tab">
                Tài khoản
              </a>
              <a href="#tenants" className="ad-tab">
                Người thuê
              </a>
              <a href="#reviews" className="ad-tab">
                Đánh giá
              </a>
              <a href="#orders" className="ad-tab">
                Đơn đặt phòng
              </a>
              <a href="#coupons" className="ad-tab">
                Mã giảm giá
              </a>
            </div>
            <button
              type="button"
              className="ad-btn ad-btn-primary"
              onClick={() => {
                const el = document.getElementById("cp-code");
                if (el) el.focus();
              }}
            >
              <i className="bi bi-plus-lg"></i> Tạo mã giảm giá
            </button>
          </div>

          {/* ====== 4.4 METRIC CARDS ====== */}
          <section id="overview" className="ad-stats">
            <article className="ad-stat">
              <div className="ad-stat-head">
                <span className="ad-stat-icon blue">
                  <i className="bi bi-houses-fill"></i>
                </span>
                <span className="ad-stat-title">Tổng số phòng</span>
              </div>
              <div className="ad-stat-body">
                <div id="total-rooms" className="ad-stat-val">
                  {ov.totalRooms ?? stats.totalRooms ?? 8}
                </div>
                <span className="ad-trend up">
                  <i className="bi bi-check2-circle"></i>{" "}
                  <b id="stat-available-rooms">{rs.available ?? 6}</b> còn trống
                </span>
              </div>
            </article>

            <article className="ad-stat">
              <div className="ad-stat-head">
                <span className="ad-stat-icon green">
                  <i className="bi bi-key-fill"></i>
                </span>
                <span className="ad-stat-title">Phòng đang thuê</span>
              </div>
              <div className="ad-stat-body">
                <div id="active-rentals" className="ad-stat-val">
                  {ov.rentedRooms ?? stats.activeRentals ?? 2}
                </div>
                <span className="ad-trend up">
                  <i className="bi bi-graph-up-arrow"></i> Đang hoạt động
                </span>
              </div>
            </article>

            <article className="ad-stat">
              <div className="ad-stat-head">
                <span className="ad-stat-icon orange">
                  <i className="bi bi-people-fill"></i>
                </span>
                <span className="ad-stat-title">Tổng người dùng</span>
              </div>
              <div className="ad-stat-body">
                <div id="unique-tenants" className="ad-stat-val">
                  {ov.totalUsers ?? users.length}
                </div>
                <span className="ad-trend up">
                  <i className="bi bi-person-badge"></i>{" "}
                  <b id="stat-landlords">{ov.totalLandlords ?? 1}</b> chủ trọ
                </span>
              </div>
            </article>

            <article className="ad-stat">
              <div className="ad-stat-head">
                <span className="ad-stat-icon purple">
                  <i className="bi bi-cash-coin"></i>
                </span>
                <span className="ad-stat-title">Tổng doanh thu</span>
              </div>
              <div className="ad-stat-body">
                <div id="stat-revenue" className="ad-stat-val">
                  {formatVND(totalRevenue)}
                </div>
                <span className="ad-trend up">
                  <i className="bi bi-bag-check"></i>{" "}
                  <b id="total-rentals">
                    {ov.totalOrders ?? orders.length}
                  </b>{" "}
                  đơn
                </span>
              </div>
            </article>

            <article className="ad-stat">
              <div className="ad-stat-head">
                <span className="ad-stat-icon blue">
                  <i className="bi bi-calendar2-day-fill"></i>
                </span>
                <span className="ad-stat-title">Đơn hôm nay</span>
              </div>
              <div className="ad-stat-body">
                <div id="rentals-today" className="ad-stat-val">
                  {ov.ordersToday ?? 0}
                </div>
                <span className="ad-trend up">
                  <i className="bi bi-clock-history"></i> 24h qua
                </span>
              </div>
            </article>

            <article className="ad-stat">
              <div className="ad-stat-head">
                <span className="ad-stat-icon green">
                  <i className="bi bi-ticket-perforated-fill"></i>
                </span>
                <span className="ad-stat-title">Mã giảm giá</span>
              </div>
              <div className="ad-stat-body">
                <div id="total-coupons" className="ad-stat-val">
                  {ov.totalCoupons ?? coupons.length}
                </div>
                <span className="ad-trend up">
                  <i className="bi bi-stars"></i> Đang kích hoạt
                </span>
              </div>
            </article>
          </section>

          {/* ====== ORDERS TABLE ====== */}
          <div className="ad-row">
            <section id="orders" className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <h2>Đơn đặt phòng gần đây</h2>
                  <p className="ad-sub">
                    Danh sách toàn bộ giao dịch giữ chỗ trên hệ thống
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearOrders}
                  className="ad-btn ad-btn-danger"
                >
                  <i className="bi bi-trash3"></i> Xóa lịch sử
                </button>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Khách hàng</th>
                      <th>Phòng đã thuê</th>
                      <th>Thực thu</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody id="order-table-body">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="ad-empty">
                          Chưa có đơn đặt phòng nào.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, idx) => {
                        const date = order.createdAt
                          ? new Date(order.createdAt).toLocaleString("vi-VN")
                          : order.date || "N/A";
                        const userName =
                          order.user?.name || order.userName || "Khách thuê";
                        const roomName =
                          order.room?.title || order.roomName || "Phòng trọ";
                        const pricePaid =
                          order.totalPrice ?? order.pricePaid ?? 0;
                        return (
                          <tr key={order._id || idx}>
                            <td>{date}</td>
                            <td>
                              <strong>{userName}</strong>
                            </td>
                            <td>{roomName}</td>
                            <td className="ad-price">{formatVND(pricePaid)}</td>
                            <td>
                              <span className="ad-badge">Thành công</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ====== 4.1 QUẢN LÝ TÀI KHOẢN ====== */}
          <div className="ad-row">
            <section id="users" className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <h2>Quản lý tài khoản</h2>
                  <p className="ad-sub">
                    Xem danh sách người dùng và chủ trọ, khóa hoặc xóa tài khoản
                    vi phạm
                  </p>
                </div>
                <div className="ad-filter-group">
                  <select
                    id="user-role-filter"
                    className="ad-select"
                    value={userFilterRole}
                    onChange={(e) => setUserFilterRole(e.target.value)}
                  >
                    <option value="">Tất cả vai trò</option>
                    <option value="user">Người thuê (User)</option>
                    <option value="landlord">Chủ trọ (Landlord)</option>
                    <option value="admin">Quản trị (Admin)</option>
                  </select>
                </div>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody id="user-table-body">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="ad-empty">
                          Chưa có tài khoản nào.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const roleBadge =
                          u.role === "admin"
                            ? "purple"
                            : u.role === "landlord"
                            ? "blue"
                            : "green";
                        const date = u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("vi-VN")
                          : "—";
                        return (
                          <tr
                            key={u._id || u.email}
                            className={u.isLocked ? "ad-row-off" : ""}
                          >
                            <td>
                              <strong>{u.name}</strong>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`ad-role ad-role-${roleBadge}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>{date}</td>
                            <td>
                              {u.isLocked ? (
                                <span className="ad-coupon-state off">
                                  Đã khóa
                                </span>
                              ) : (
                                <span className="ad-coupon-state on">
                                  Hoạt động
                                </span>
                              )}
                            </td>
                            <td>
                              {u.role === "admin" ? (
                                <span className="ad-muted">—</span>
                              ) : (
                                <div className="ad-coupon-actions">
                                  <button
                                    type="button"
                                    className="ad-icon-act"
                                    title={
                                      u.isLocked ? "Mở khóa" : "Khóa tài khoản"
                                    }
                                    onClick={() => handleToggleLockUser(u)}
                                  >
                                    <i
                                      className={`bi ${
                                        u.isLocked
                                          ? "bi-unlock-fill"
                                          : "bi-lock-fill"
                                      }`}
                                    ></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="ad-icon-act danger"
                                    title="Xóa tài khoản"
                                    onClick={() => handleDeleteUser(u)}
                                  >
                                    <i className="bi bi-trash3"></i>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ====== 4.2 QUẢN LÝ NGƯỜI THUÊ ====== */}
          <div className="ad-row">
            <section id="tenants" className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <h2>Danh sách người đang thuê phòng</h2>
                  <p className="ad-sub">
                    Theo dõi các hợp đồng thuê đang hoạt động trên toàn hệ thống
                  </p>
                </div>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Người thuê</th>
                      <th>Liên hệ</th>
                      <th>Phòng đang thuê</th>
                      <th>Chủ trọ</th>
                      <th>Giá thuê</th>
                      <th>Ngày bắt đầu</th>
                    </tr>
                  </thead>
                  <tbody id="tenant-table-body">
                    {tenants.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="ad-empty">
                          Hiện chưa có phòng nào đang được thuê.
                        </td>
                      </tr>
                    ) : (
                      tenants.map((room, idx) => {
                        const t = room.currentTenant || {};
                        const start = t.startDate
                          ? new Date(t.startDate).toLocaleDateString("vi-VN")
                          : "—";
                        return (
                          <tr key={room._id || idx}>
                            <td>
                              <strong>{t.name || "—"}</strong>
                              <br />
                              <small className="ad-muted">
                                CCCD: {t.idCard || "—"}
                              </small>
                            </td>
                            <td>
                              {t.phone || "—"}
                              <br />
                              <small className="ad-muted">
                                {t.email || ""}
                              </small>
                            </td>
                            <td>
                              <strong>{room.title}</strong>
                              <br />
                              <small className="ad-muted">
                                {room.district}
                              </small>
                            </td>
                            <td>
                              {room.owner?.name || room.ownerName || "—"}
                            </td>
                            <td className="ad-price">
                              {formatVND(room.price)}
                            </td>
                            <td>{start}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ====== 4.3 QUẢN LÝ ĐÁNH GIÁ ====== */}
          <div className="ad-row">
            <section id="reviews" className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <h2>Kiểm duyệt đánh giá &amp; phản hồi</h2>
                  <p className="ad-sub">Xem và gỡ các đánh giá không phù hợp</p>
                </div>
                <div className="ad-mini-stats">
                  <span>
                    <b id="stat-total-reviews">{reviews.length}</b> đánh giá
                  </span>
                </div>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Người đánh giá</th>
                      <th>Phòng</th>
                      <th>Số sao</th>
                      <th>Nội dung</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody id="review-table-body">
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="ad-empty">
                          Chưa có đánh giá nào.
                        </td>
                      </tr>
                    ) : (
                      reviews.map((r, idx) => (
                        <tr key={r._id || idx}>
                          <td>
                            <strong>
                              {r.userName || r.user?.name || "Ẩn danh"}
                            </strong>
                            <br />
                            <small className="ad-muted">
                              {r.userEmail || ""}
                            </small>
                          </td>
                          <td>{r.room?.title || "—"}</td>
                          <td>
                            <span style={{ color: "#f59e0b" }}>
                              {"★".repeat(Number(r.rating) || 5)}
                            </span>
                          </td>
                          <td>{r.comment}</td>
                          <td>
                            <button
                              type="button"
                              className="ad-icon-act danger"
                              title="Gỡ đánh giá"
                              onClick={() => handleDeleteReview(r)}
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* ====== COUPONS ====== */}
          <div className="ad-row">
            <section id="coupons" className="ad-panel">
              <div className="ad-panel-head">
                <div>
                  <h2>Quản lý mã giảm giá</h2>
                  <p className="ad-sub">
                    Tạo và quản lý mã giảm giá cho người thuê
                  </p>
                </div>
              </div>
              <div className="ad-coupon-form">
                <input
                  type="text"
                  id="cp-code"
                  placeholder="Mã (VD: DIS500)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <input
                  type="number"
                  id="cp-val"
                  placeholder="Số tiền giảm (đ)"
                  value={couponVal}
                  onChange={(e) => setCouponVal(e.target.value)}
                />
                <input
                  type="number"
                  id="cp-limit"
                  placeholder="Giới hạn lượt (tùy chọn)"
                  value={couponLimit}
                  onChange={(e) => setCouponLimit(e.target.value)}
                />
                <input
                  type="date"
                  id="cp-expiry"
                  title="Ngày hết hạn (tùy chọn)"
                  value={couponExpiry}
                  onChange={(e) => setCouponExpiry(e.target.value)}
                />
                <button
                  type="button"
                  className="ad-btn ad-btn-primary"
                  onClick={handleCreateCoupon}
                >
                  <i className="bi bi-plus-lg"></i> Tạo mã
                </button>
              </div>
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Mã giảm giá</th>
                      <th>Giá trị giảm</th>
                      <th>Trạng thái</th>
                      <th>Giới hạn lượt</th>
                      <th>Hạn sử dụng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody id="coupon-list">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="ad-empty">
                          Chưa có mã giảm giá nào.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((c) => {
                        const active = c.active !== false;
                        const expiry = c.expiryDate
                          ? new Date(c.expiryDate).toLocaleDateString("vi-VN")
                          : "Không giới hạn";
                        const limit =
                          c.usageLimit != null
                            ? `${c.usageLimit} lượt`
                            : "Không giới hạn";
                        return (
                          <tr
                            key={c._id || c.code}
                            className={active ? "" : "ad-row-off"}
                          >
                            <td>
                              <span className="ad-coupon-code">
                                <i className="bi bi-ticket-perforated"></i>{" "}
                                {c.code}
                              </span>
                            </td>
                            <td className="ad-price">-{formatVND(c.value)}</td>
                            <td>
                              <span
                                className={`ad-coupon-state ${
                                  active ? "on" : "off"
                                }`}
                              >
                                {active ? "Đang chạy" : "Đã tắt"}
                              </span>
                            </td>
                            <td>{limit}</td>
                            <td>{expiry}</td>
                            <td>
                              <div className="ad-coupon-actions">
                                <button
                                  type="button"
                                  className="ad-icon-act"
                                  title={active ? "Tắt mã" : "Bật mã"}
                                  onClick={() => handleToggleCoupon(c)}
                                >
                                  <i
                                    className={`bi ${
                                      active ? "bi-toggle-on" : "bi-toggle-off"
                                    }`}
                                  ></i>
                                </button>
                                <button
                                  type="button"
                                  className="ad-icon-act danger"
                                  title="Xóa mã"
                                  onClick={() => handleDeleteCoupon(c)}
                                >
                                  <i className="bi bi-trash3"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};
