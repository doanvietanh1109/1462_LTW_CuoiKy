import React, { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchDashboardAggregations,
  markInvoicePaidThunk,
  sendReminderThunk,
} from "../../store/slices/invoiceSlice";
import {
  fetchRoomsThunk,
  createRoomThunk,
  updateRoomThunk,
  deleteRoomThunk,
} from "../../store/slices/roomSlice";
import { apiRequest, formatVND } from "../../api/apiClient";
import { RevenueChart } from "../../components/landlord/RevenueChart";
import { resolveRoomImageUrl } from "../../components/rooms/RoomCard";

const AMENITIES_OPTIONS = [
  { value: "Giường", icon: "bi-lamp-fill", label: "Giường" },
  { value: "Tủ quần áo", icon: "bi-Archive-fill", label: "Tủ quần áo" },
  { value: "Bàn làm việc", icon: "bi-laptop", label: "Bàn làm việc" },
  { value: "Điều hòa", icon: "bi-snow", label: "Điều hòa" },
  { value: "Quạt điện", icon: "bi-fan", label: "Quạt điện" },
  { value: "Máy giặt", icon: "bi-droplet-fill", label: "Máy giặt" },
  { value: "Tủ lạnh", icon: "bi-box-seam", label: "Tủ lạnh" },
  { value: "Bếp", icon: "bi-fire", label: "Bếp" },
  { value: "WC riêng", icon: "bi-droplet", label: "WC riêng" },
  { value: "Nóng lạnh", icon: "bi-thermometer-half", label: "Nóng lạnh" },
  { value: "Wifi", icon: "bi-wifi", label: "Wifi" },
  { value: "Cửa sổ", icon: "bi-window", label: "Cửa sổ" },
  { value: "Gương", icon: "bi-square", label: "Gương" },
];

export const LandlordDashboardPage = () => {
  const dispatch = useDispatch();
  const { dashboardStats } = useSelector((state) => state.invoices);
  const { items: rooms } = useSelector((state) => state.rooms);
  const [notice, setNotice] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [rentalHistory, setRentalHistory] = useState([]);
  const [roomImageFiles, setRoomImageFiles] = useState([]);
  const [roomImagePreviews, setRoomImagePreviews] = useState([]);

  // Modal Đăng phòng mới / Sửa phòng (#roomModal - .rm-modal)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    title: "",
    price: "",
    area: "25",
    roomNumber: "",
    category: "Trọ",
    status: "available",
    district: "Hà Đông, Hà Nội",
    description: "",
    amenities: ["Wifi", "Điều hòa", "Nóng lạnh"],
    image: "",
  });

  useEffect(() => {
    const urls = roomImageFiles.map((file) => URL.createObjectURL(file));
    setRoomImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [roomImageFiles]);

  // Modal Cho thuê phòng (#assignTenantModal - .tm-modal)
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenantRoom, setTenantRoom] = useState(null);
  const [tenantEmailSearch, setTenantEmailSearch] = useState("");
  const [tenantFoundUser, setTenantFoundUser] = useState(null);
  const [tenantForm, setTenantForm] = useState({
    name: "",
    phone: "",
    email: "",
    idCard: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    notes: "",
  });

  const loadRentalHistory = useCallback(async (status = "all") => {
    try {
      const query = status && status !== "all" ? `?status=${status}` : "";
      const res = await apiRequest(`/rental-history${query}`);
      setRentalHistory(res?.data?.history || []);
    } catch (error) {
      setRentalHistory([]);
      setNotice(`Không thể tải lịch sử thuê: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchDashboardAggregations());
    dispatch(fetchRoomsThunk({ page: 1, limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    loadRentalHistory(historyFilter);
  }, [historyFilter, loadRentalHistory]);

  const {
    roomStatusCounts = {},
    unpaidRooms = [],
    monthlyRevenue = [],
    totalRevenueAllTime = 0,
    totalUnpaidDebt = 0,
  } = dashboardStats || {};

  const availableRoomsCount = rooms.filter(
    (r) => !r.isRented && r.status !== "rented" && r.status !== "maintenance"
  ).length;

  const openAddRoomModal = () => {
    setEditingRoom(null);
    setRoomImageFiles([]);
    setRoomForm({
      title: "",
      price: "",
      area: "25",
      roomNumber: `P.${100 + rooms.length + 1}`,
      category: "Trọ",
      status: "available",
      district: "Hà Đông, Hà Nội",
      description: "",
      amenities: ["Wifi", "Điều hòa", "Nóng lạnh"],
      image: "",
    });
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (room) => {
    setEditingRoom(room);
    setRoomImageFiles([]);
    setRoomForm({
      title: room.title || "",
      price: room.price || "",
      area: room.area || "25",
      roomNumber: room.roomNumber || "",
      category: room.category || room.type || "Trọ",
      status: room.status || "available",
      district: room.district || "Hà Đông, Hà Nội",
      description: room.description || room.desc || "",
      amenities: Array.isArray(room.amenities) ? room.amenities : [],
      image: room.image || room.img || "",
    });
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...roomForm,
        type: roomForm.category,
        desc: roomForm.description,
        img: roomForm.image,
        imagesFiles: roomImageFiles,
        price: Number(roomForm.price) || 0,
        area: Number(roomForm.area) || 25,
      };
      if (editingRoom) {
        await dispatch(
          updateRoomThunk({
            id: editingRoom._id || editingRoom.id,
            roomData: payload,
          })
        ).unwrap();
        setNotice("Đã cập nhật thông tin phòng thành công!");
      } else {
        await dispatch(createRoomThunk(payload)).unwrap();
        setNotice("Đã đăng phòng mới thành công!");
      }
      setIsRoomModalOpen(false);
      setRoomImageFiles([]);
      dispatch(fetchRoomsThunk({ page: 1, limit: 50 }));
      dispatch(fetchDashboardAggregations());
    } catch (err) {
      setNotice(`Lỗi lưu phòng: ${err}`);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Bạn có chắc muốn xóa "${room.title}"?`)) return;
    try {
      await dispatch(deleteRoomThunk(room._id || room.id)).unwrap();
      setNotice("Đã xóa phòng thành công!");
      dispatch(fetchDashboardAggregations());
    } catch (err) {
      setNotice(`Lỗi xóa phòng: ${err}`);
    }
  };

  const openAssignTenantModal = (room) => {
    setTenantRoom(room);
    setTenantEmailSearch("");
    setTenantFoundUser(null);
    setTenantForm({
      name: "",
      phone: "",
      email: "",
      idCard: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      notes: "",
    });
    setIsTenantModalOpen(true);
  };

  const handleSearchTenantByEmail = async () => {
    const email = tenantEmailSearch.trim();
    if (!email) return;
    try {
      const res = await apiRequest(
        `/users/search/email?email=${encodeURIComponent(email)}`
      );
      const found = res?.data?.user;
      if (found) {
        setTenantFoundUser(found);
        setTenantForm((prev) => ({
          ...prev,
          name: found.name || "",
          email: found.email || email,
          phone: found.phone || prev.phone,
        }));
      }
    } catch {
      setTenantFoundUser({ name: email.split("@")[0], email });
      setTenantForm((prev) => ({
        ...prev,
        name: email.split("@")[0],
        email,
      }));
    }
  };

  const handleConfirmAssignTenant = async (e) => {
    e.preventDefault();
    if (!tenantRoom) return;
    const roomId = tenantRoom._id || tenantRoom.id;
    try {
      await apiRequest("/contracts", {
        method: "POST",
        body: {
          roomId,
          tenantName: tenantForm.name,
          tenantEmail: tenantForm.email,
          tenantPhone: tenantForm.phone,
          identityCard: tenantForm.idCard,
          startDate: tenantForm.startDate,
          endDate: tenantForm.endDate || undefined,
          rentPrice: tenantRoom.price,
          deposit: tenantRoom.price,
          electricityPrice: tenantRoom.electricityPrice,
          waterPrice: tenantRoom.waterPrice,
          serviceFee: tenantRoom.serviceFee,
          initialElectricity: tenantRoom.currentElectricity,
          initialWater: tenantRoom.currentWater,
          notes: tenantForm.notes,
        },
      });
      setNotice(`Đã tạo hợp đồng cho phòng "${tenantRoom.title}" thành công!`);
      setIsTenantModalOpen(false);
      dispatch(fetchRoomsThunk({ page: 1, limit: 50 }));
      dispatch(fetchDashboardAggregations());
    } catch (err) {
      setNotice(`Lỗi gán người thuê: ${err.message}`);
    }
  };

  const handleReleaseRoom = async (room) => {
    if (!window.confirm(`Xác nhận trả phòng "${room.title}"?`)) return;
    const roomId = room._id || room.id;
    try {
      await apiRequest(`/rooms/${roomId}/release`, {
        method: "POST",
      });
      setNotice(`Đã trả phòng "${room.title}" về trạng thái Còn trống!`);
      dispatch(fetchRoomsThunk({ page: 1, limit: 50 }));
      dispatch(fetchDashboardAggregations());
    } catch (err) {
      setNotice(`Lỗi trả phòng: ${err.message}`);
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    await dispatch(markInvoicePaidThunk(invoiceId));
    setNotice("Đã đánh dấu thu tiền hóa đơn thành công!");
    dispatch(fetchDashboardAggregations());
  };

  const handleRemind = async (invoiceId) => {
    try {
      const res = await dispatch(sendReminderThunk(invoiceId)).unwrap();
      setNotice(res.message);
      dispatch(fetchDashboardAggregations());
    } catch (err) {
      setNotice(`Lỗi: ${err}`);
    }
  };

  return (
    <>
      {notice && (
        <div className="alert alert-info alert-dismissible fade show py-2 mb-3">
          <i className="bi bi-info-circle-fill me-1"></i>
          {notice}
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotice("")}
          ></button>
        </div>
      )}

      {/* Hàng 1: Thẻ metric-card chuẩn của landlord.html (#overview) */}
      <section id="overview" className="dashboard-grid">
        <article className="metric-card">
          <span className="metric-icon">
            <i className="bi bi-house-check"></i>
          </span>
          <p>Phòng đang quản lý</p>
          <div id="landlord-total-rooms" className="stat-val">
            {rooms.length}
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <i className="bi bi-eye"></i>
          </span>
          <p>Phòng còn trống</p>
          <div id="landlord-available-rooms" className="stat-val">
            {roomStatusCounts.available ?? availableRoomsCount}
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <i className="bi bi-exclamation-triangle"></i>
          </span>
          <p>Phòng nợ tiền / Doanh thu</p>
          <div className="stat-val text-danger">
            {unpaidRooms.length} phòng
          </div>
          <small className="text-muted">
            Đã thu: {formatVND(totalRevenueAllTime)} · Nợ:{" "}
            {formatVND(totalUnpaidDebt)}
          </small>
        </article>
      </section>

      {/* Panel Phòng của tôi (#rooms - giống hệt 100% landlord.html + js/pages/landlord.js) */}
      <section id="rooms" className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Rooms</p>
            <h2>Phòng của tôi</h2>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openAddRoomModal}
          >
            <i className="bi bi-plus-circle"></i> Thêm phòng
          </button>
        </div>

        <div id="landlord-room-list" className="landlord-room-list">
          {rooms.length === 0 ? (
            <p className="text-muted mb-0">
              Bạn chưa đăng phòng nào. Nhấn &quot;Thêm phòng&quot; để bắt đầu.
            </p>
          ) : (
            rooms.map((room) => {
              const roomId = room._id || room.id;
              const isRented =
                Boolean(room.isRented) || room.status === "rented";
              const isAvailable =
                room.isAvailable !== false && room.status !== "maintenance";
              const imageSrc = resolveRoomImageUrl(room.image || room.img);
              const imageCount = Array.isArray(room.images)
                ? room.images.length
                : 1;
              const tenantObj = room.currentTenant || room.tenant;

              return (
                <article key={roomId} className="landlord-room-card">
                  <div className="room-image-wrapper">
                    <img
                      src={imageSrc}
                      alt={room.title}
                      onError={(e) => {
                        e.currentTarget.src = "/images/room1.jpg";
                      }}
                    />
                    {imageCount > 1 && (
                      <span className="image-count-badge">
                        <i className="bi bi-images"></i> {imageCount}
                      </span>
                    )}
                  </div>
                  <div className="room-card-body">
                    <span
                      className={`badge ${
                        isRented
                          ? "text-bg-warning"
                          : isAvailable
                          ? "text-bg-success"
                          : "text-bg-secondary"
                      }`}
                    >
                      {isRented
                        ? "Đã cho thuê"
                        : isAvailable
                        ? "Đang hiển thị"
                        : "Đã ẩn"}
                    </span>
                    <h3>{room.title}</h3>
                    <p className="room-category">
                      <i className="bi bi-tag"></i>{" "}
                      {room.category || room.type || "Trọ"}
                    </p>
                    <p className="room-location">
                      <i className="bi bi-geo-alt"></i> {room.district}
                    </p>
                    <div className="room-price">
                      {formatVND(room.price)} / tháng
                    </div>

                    {isRented && tenantObj ? (
                      <div className="tenant-info">
                        <div className="tenant-badge">
                          <i className="bi bi-person-check-fill"></i>
                          <strong>{tenantObj.name}</strong>
                        </div>
                        <small className="text-muted d-block">
                          <i className="bi bi-telephone"></i> {tenantObj.phone}
                        </small>
                        {tenantObj.startDate && (
                          <small className="text-muted d-block">
                            <i className="bi bi-calendar"></i> Từ{" "}
                            {new Date(tenantObj.startDate).toLocaleDateString(
                              "vi-VN"
                            )}
                          </small>
                        )}
                      </div>
                    ) : null}

                    <div className="room-actions">
                      {isRented ? (
                        <button
                          type="button"
                          className="btn btn-warning btn-sm"
                          onClick={() => handleReleaseRoom(room)}
                          title="Trả phòng"
                        >
                          <i className="bi bi-box-arrow-right"></i> Trả phòng
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => openAssignTenantModal(room)}
                          title="Thêm người thuê"
                        >
                          <i className="bi bi-person-plus"></i> Thêm người thuê
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openEditRoomModal(room)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleDeleteRoom(room)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Panel Lịch sử cho thuê phòng (#history - giống hệt 100% landlord.html) */}
      <section id="history" className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Rental History</p>
            <h2>Lịch sử cho thuê phòng</h2>
          </div>
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm btn-outline-primary ${
                historyFilter === "all" ? "active" : ""
              }`}
              onClick={() => setHistoryFilter("all")}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`btn btn-sm btn-outline-success ${
                historyFilter === "active" ? "active" : ""
              }`}
              onClick={() => setHistoryFilter("active")}
            >
              Đang thuê
            </button>
            <button
              type="button"
              className={`btn btn-sm btn-outline-secondary ${
                historyFilter === "completed" ? "active" : ""
              }`}
              onClick={() => setHistoryFilter("completed")}
            >
              Đã trả
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Phòng</th>
                <th>Người thuê</th>
                <th>Liên hệ</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Giá thuê</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody id="rental-history-table-body">
              {rentalHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    Chưa có lịch sử cho thuê nào.
                  </td>
                </tr>
              ) : (
                rentalHistory.map((item, idx) => {
                  const isActive = item.status === "active";
                  return (
                    <tr key={item._id || idx}>
                      <td>
                        <strong>{item.roomTitle || "N/A"}</strong>
                        <br />
                        <small className="text-muted">
                          {item.roomDistrict || ""}
                        </small>
                      </td>
                      <td>
                        <strong>{item.tenantName}</strong>
                        <br />
                        {item.tenantEmail && (
                          <small className="text-muted">
                            {item.tenantEmail}
                          </small>
                        )}
                      </td>
                      <td>{item.tenantPhone}</td>
                      <td>
                        {item.startDate
                          ? new Date(item.startDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td>
                        {item.endDate
                          ? new Date(item.endDate).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td>{formatVND(item.roomPrice || 0)}</td>
                      <td>
                        <span
                          className={`badge ${
                            isActive ? "text-bg-success" : "text-bg-secondary"
                          }`}
                        >
                          {isActive ? "Đang thuê" : "Đã trả"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Biểu đồ doanh thu theo tháng (Đề 4 - Aggregation Pipeline) */}
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Revenue Analytics</p>
            <h2>Biểu đồ doanh thu theo tháng (Aggregation Pipeline)</h2>
          </div>
          <Link to="/landlord/meters" className="btn btn-primary btn-sm">
            <i className="bi bi-lightning-charge"></i> Nhập điện nước cuối tháng
          </Link>
        </div>
        <RevenueChart monthlyRevenue={monthlyRevenue} />
      </section>

      {/* Danh sách phòng nợ tiền (Đề 4 - Aggregation Pipeline) */}
      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">Unpaid Invoices</p>
            <h2>Danh sách phòng nợ tiền ({unpaidRooms.length})</h2>
          </div>
          <Link
            to="/landlord/invoices"
            className="btn btn-outline-primary btn-sm"
          >
            Xem tất cả hóa đơn
          </Link>
        </div>

        {unpaidRooms.length === 0 ? (
          <p className="text-success mb-0 fw-semibold">
            <i className="bi bi-check-circle-fill"></i> Tất cả các phòng đã đóng
            đủ tiền trọ!
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Phòng</th>
                  <th>Người thuê</th>
                  <th>Số kỳ nợ</th>
                  <th>Tổng tiền nợ</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {unpaidRooms.map((item) => {
                  const firstInvoiceId = item.invoices?.[0]?.invoiceId;
                  return (
                    <tr key={item._id}>
                      <td>
                        <strong>
                          P.{item.roomNumber || "N/A"} - {item.roomTitle}
                        </strong>
                      </td>
                      <td>
                        {item.tenantName || "Người thuê"}
                        <div className="small text-muted">
                          {item.tenantEmail || item.tenantPhone || ""}
                        </div>
                      </td>
                      <td>
                        <span className="badge text-bg-warning">
                          {item.unpaidInvoicesCount} hóa đơn
                        </span>
                      </td>
                      <td className="text-danger fw-bold">
                        {formatVND(item.totalDebtAmount)}
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          {firstInvoiceId && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={() => handleMarkPaid(firstInvoiceId)}
                              >
                                <i className="bi bi-check2-circle"></i> Đã thu
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemind(firstInvoiceId)}
                              >
                                <i className="bi bi-envelope"></i> Nhắc nợ
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal thêm/sửa phòng (#roomModal - .rm-modal chuẩn landlord.html) */}
      {isRoomModalOpen && (
        <div
          className="modal show"
          id="roomModal"
          style={{ display: "flex", backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-custom-60">
            <div className="modal-content rm-modal">
              <div className="rm-header">
                <div className="rm-header-icon">
                  <i className="bi bi-house-add-fill"></i>
                </div>
                <div>
                  <h5 className="rm-title" id="roomModalLabel">
                    {editingRoom ? "Chỉnh sửa thông tin phòng" : "Đăng phòng mới"}
                  </h5>
                  <p className="rm-subtitle">
                    Điền đầy đủ thông tin để thu hút người thuê nhanh hơn
                  </p>
                </div>
                <button
                  type="button"
                  className="rm-close"
                  onClick={() => setIsRoomModalOpen(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleSaveRoom}>
                <div className="rm-body">
                  <div className="rm-col">
                    <div className="rm-section">
                      <div className="rm-section-label">
                        <i className="bi bi-info-circle-fill"></i> Thông tin cơ
                        bản
                      </div>

                      <div className="rm-field">
                        <label className="rm-label">
                          Tên phòng / Tiêu đề tin đăng{" "}
                          <span className="rm-req">*</span>
                        </label>
                        <input
                          type="text"
                          className="rm-input"
                          placeholder="VD: Phòng trọ cao cấp gần ĐH Bách Khoa"
                          value={roomForm.title}
                          onChange={(e) =>
                            setRoomForm((p) => ({
                              ...p,
                              title: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="rm-row">
                        <div className="rm-field">
                          <label className="rm-label">
                            Giá thuê (VNĐ/tháng){" "}
                            <span className="rm-req">*</span>
                          </label>
                          <div className="rm-input-wrap">
                            <input
                              type="number"
                              className="rm-input rm-input-icon"
                              placeholder="2500000"
                              min="100000"
                              step="100000"
                              value={roomForm.price}
                              onChange={(e) =>
                                setRoomForm((p) => ({
                                  ...p,
                                  price: e.target.value,
                                }))
                              }
                              required
                            />
                            <span className="rm-input-suffix">₫</span>
                          </div>
                        </div>

                      </div>

                      <div className="rm-row">
                        <div className="rm-field">
                          <label className="rm-label">Diện tích (m²)</label>
                          <input
                            type="number"
                            className="rm-input"
                            value={roomForm.area}
                            onChange={(e) =>
                              setRoomForm((p) => ({
                                ...p,
                                area: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="rm-field">
                          <label className="rm-label">Trạng thái phòng</label>
                          <select
                            className="rm-input rm-select"
                            value={roomForm.status}
                            onChange={(e) =>
                              setRoomForm((p) => ({
                                ...p,
                                status: e.target.value,
                              }))
                            }
                          >
                            <option value="available">Còn trống</option>
                            <option value="rented">Đang thuê</option>
                            <option value="maintenance">Đang sửa chữa</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="rm-section">
                      <div className="rm-section-label">
                        <i className="bi bi-geo-alt-fill"></i> Địa chỉ &amp; Mô
                        tả
                      </div>

                      <div className="rm-field">
                        <label className="rm-label">
                          Khu vực / Địa chỉ <span className="rm-req">*</span>
                        </label>
                        <input
                          type="text"
                          className="rm-input"
                          placeholder="VD: Phường Bách Khoa, Hai Bà Trưng, Hà Nội"
                          value={roomForm.district}
                          onChange={(e) =>
                            setRoomForm((p) => ({
                              ...p,
                              district: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="rm-field">
                        <label className="rm-label">
                          Mô tả chi tiết <span className="rm-req">*</span>
                        </label>
                        <textarea
                          className="rm-input rm-textarea"
                          rows="4"
                          placeholder="Mô tả về diện tích, nội thất, quy định giờ giấc..."
                          value={roomForm.description}
                          onChange={(e) =>
                            setRoomForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          required
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  <div className="rm-col">
                    <div className="rm-section">
                      <div className="rm-section-label">
                        <i className="bi bi-stars"></i> Tiện ích phòng trọ
                      </div>
                      <div className="rm-amenities">
                        {AMENITIES_OPTIONS.map((am) => (
                          <label key={am.value} className="rm-amenity">
                            <input
                              type="checkbox"
                              checked={roomForm.amenities.includes(am.value)}
                              onChange={() =>
                                setRoomForm((p) => ({
                                  ...p,
                                  amenities: p.amenities.includes(am.value)
                                    ? p.amenities.filter((x) => x !== am.value)
                                    : [...p.amenities, am.value],
                                }))
                              }
                            />
                            <span>
                              <i className={`bi ${am.icon}`}></i> {am.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rm-section">
                      <div className="rm-section-label">
                        <i className="bi bi-images"></i> Hình ảnh đại diện
                      </div>
                      <div className="rm-field">
                        <label className="rm-label" htmlFor="dashboard-room-images">Tải ảnh lên (tối đa 8 ảnh, 5 MB mỗi ảnh)</label>
                        <input
                          id="dashboard-room-images"
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          multiple
                          className="rm-input"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                              setNotice("Chỉ nhận ảnh JPG, PNG, WebP tối đa 5 MB mỗi ảnh.");
                              e.target.value = "";
                              return;
                            }
                            const oldCount = editingRoom?.images?.length || (editingRoom?.image ? 1 : 0);
                            if (oldCount + files.length > 8) {
                              setNotice("Mỗi phòng được lưu tối đa 8 ảnh.");
                              e.target.value = "";
                              return;
                            }
                            setNotice("");
                            setRoomImageFiles(files);
                            e.target.value = "";
                          }}
                        />
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {(editingRoom?.images?.length ? editingRoom.images : editingRoom?.image ? [editingRoom.image] : []).map((src, index) => <img key={`saved-${index}`} src={src} alt={`Ảnh phòng đã lưu ${index + 1}`} style={{ width: 72, height: 56, objectFit: "cover", borderRadius: 6 }} />)}
                          {roomImagePreviews.map((src, index) => <img key={`preview-${index}`} src={src} alt={`Ảnh mới ${index + 1}`} style={{ width: 72, height: 56, objectFit: "cover", borderRadius: 6 }} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rm-footer">
                  <button
                    type="button"
                    className="rm-btn rm-btn-cancel"
                    onClick={() => setIsRoomModalOpen(false)}
                  >
                    <i className="bi bi-x-lg"></i> Hủy bỏ
                  </button>
                  <button type="submit" className="rm-btn rm-btn-save">
                    <i className="bi bi-check-lg"></i> Lưu phòng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cho thuê phòng (#assignTenantModal - .tm-modal chuẩn landlord.html) */}
      {isTenantModalOpen && (
        <div
          className="modal show"
          id="assignTenantModal"
          style={{ display: "flex", backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "560px", width: "95vw" }}
          >
            <div className="modal-content tm-modal">
              <div className="tm-header">
                <div className="tm-header-icon">
                  <i className="bi bi-person-plus-fill"></i>
                </div>
                <div>
                  <h5 className="tm-title">Cho thuê phòng</h5>
                  <p className="tm-subtitle">
                    Tìm khách hàng qua email để gán quyền thuê phòng{" "}
                    <strong>{tenantRoom?.title}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="tm-close"
                  onClick={() => setIsTenantModalOpen(false)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              <form onSubmit={handleConfirmAssignTenant}>
                <div className="tm-body">
                  <div className="tm-section">
                    <div className="tm-section-label">
                      <i className="bi bi-search"></i> Bước 1 — Tìm khách hàng
                      theo Email
                    </div>
                    <div className="tm-search-group">
                      <div className="tm-search-icon">
                        <i className="bi bi-envelope"></i>
                      </div>
                      <input
                        type="email"
                        className="form-control tm-search-input"
                        placeholder="Nhập email khách hàng (VD: user@example.com)"
                        value={tenantEmailSearch}
                        onChange={(e) => setTenantEmailSearch(e.target.value)}
                      />
                      <button
                        type="button"
                        className="tm-search-btn"
                        onClick={handleSearchTenantByEmail}
                      >
                        <i className="bi bi-search"></i> Tìm kiếm
                      </button>
                    </div>
                  </div>

                  <div id="userInfoSection">
                    {tenantFoundUser && (
                      <div className="tm-found-alert">
                        <i className="bi bi-check-circle-fill"></i>
                        <div>
                          Đã chọn tài khoản:{" "}
                          <strong>{tenantFoundUser.name}</strong>
                        </div>
                      </div>
                    )}

                    <div className="tm-section">
                      <div className="tm-section-label">
                        <i className="bi bi-person-badge"></i> Bước 2 — Thông
                        tin người thuê &amp; hợp đồng
                      </div>
                      <div className="tm-row">
                        <div className="tm-field">
                          <label className="tm-label">
                            <i className="bi bi-person"></i> Họ và tên{" "}
                            <span className="tm-req">*</span>
                          </label>
                          <input
                            type="text"
                            className="tm-input"
                            value={tenantForm.name}
                            onChange={(e) =>
                              setTenantForm((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                        <div className="tm-field">
                          <label className="tm-label">
                            <i className="bi bi-telephone"></i> Số điện thoại{" "}
                            <span className="tm-req">*</span>
                          </label>
                          <input
                            type="tel"
                            className="tm-input"
                            placeholder="VD: 0912345678"
                            value={tenantForm.phone}
                            onChange={(e) =>
                              setTenantForm((p) => ({
                                ...p,
                                phone: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="tm-row" style={{ marginTop: "12px" }}>
                        <div className="tm-field">
                          <label className="tm-label">
                            <i className="bi bi-envelope"></i> Email
                          </label>
                          <input
                            type="email"
                            className="tm-input"
                            value={tenantForm.email}
                            onChange={(e) =>
                              setTenantForm((p) => ({
                                ...p,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="tm-field">
                          <label className="tm-label">
                            <i className="bi bi-card-text"></i> Số CCCD/CMND
                          </label>
                          <input
                            type="text"
                            className="tm-input"
                            placeholder="VD: 001234567890"
                            value={tenantForm.idCard}
                            onChange={(e) =>
                              setTenantForm((p) => ({
                                ...p,
                                idCard: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="tm-row" style={{ marginTop: "12px" }}>
                        <div className="tm-field">
                          <label className="tm-label">
                            <i className="bi bi-calendar-check"></i> Ngày bắt
                            đầu <span className="tm-req">*</span>
                          </label>
                          <input
                            type="date"
                            className="tm-input"
                            value={tenantForm.startDate}
                            onChange={(e) =>
                              setTenantForm((p) => ({
                                ...p,
                                startDate: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                        <div className="tm-field">
                          <label className="tm-label">
                            <i className="bi bi-calendar-x"></i> Ngày kết thúc
                          </label>
                          <input
                            type="date"
                            className="tm-input"
                            value={tenantForm.endDate}
                            onChange={(e) =>
                              setTenantForm((p) => ({
                                ...p,
                                endDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="tm-footer">
                  <button
                    type="button"
                    className="tm-btn tm-btn-cancel"
                    onClick={() => setIsTenantModalOpen(false)}
                  >
                    <i className="bi bi-x-lg"></i> Hủy bỏ
                  </button>
                  <button type="submit" className="tm-btn tm-btn-confirm">
                    <i className="bi bi-check-lg"></i> Xác nhận cho thuê
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
