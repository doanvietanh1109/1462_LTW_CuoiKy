import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomsThunk } from "../store/slices/roomSlice";
import { apiRequest, formatVND, formatDateVN } from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";
import { StatusBadge } from "../components/common/StatusBadge";
import { RepairRequestForm } from "../components/tenant/RepairRequestForm";
import { resolveRoomImageUrl } from "../components/rooms/RoomCard";
import {
  createContractFromBooking,
} from "../utils/tenantContractHelper";
import "../styles/tenant.css";

export const TenantPortalPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: rooms } = useSelector((state) => state.rooms);

  const [activeTab, setActiveTab] = useState("contract");
  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // Invoice list filter state
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentInstructions, setPaymentInstructions] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);

  const openPayment = async (invoice) => {
    setPayingInvoice(invoice); setPaymentInstructions(null); setPaymentError(""); setQrFailed(false); setPaymentLoading(true);
    try {
      const response = await apiRequest(`/invoices/${invoice._id || invoice.id}/payment-instructions`);
      setPaymentInstructions(response?.data?.data || null);
    } catch (error) { setPaymentError(error.message || "Không tải được thông tin thanh toán."); }
    finally { setPaymentLoading(false); }
  };

  useEffect(() => {
    if (!rooms.length) {
      dispatch(fetchRoomsThunk({ page: 1, limit: 20 }));
    }
  }, [dispatch, rooms.length]);

  const loadTenantData = async () => {
    setLoading(true);
    try {
      const [contractRes, invoicesRes, repairsRes, notificationsRes] = await Promise.all([
        apiRequest("/contracts/my-active").then((data) => ({ data })).catch((error) => ({ error })),
        apiRequest("/invoices").then((data) => ({ data })).catch((error) => ({ error })),
        apiRequest("/repair-requests").then((data) => ({ data })).catch((error) => ({ error })),
        apiRequest("/notifications?limit=50").then((data) => ({ data })).catch((error) => ({ error })),
      ]);

      const activeContract = contractRes?.data?.data?.contract || null;
      const invoiceList = invoicesRes?.data?.data?.invoices || [];
      const errors = [];
      if (contractRes.error) errors.push("hợp đồng");
      if (invoicesRes.error) errors.push("hóa đơn");
      if (repairsRes.error) errors.push("yêu cầu sửa chữa");
      setApiError(errors.length ? `Không thể tải ${errors.join(" và ")} từ máy chủ. Hãy thử lại; dữ liệu chưa tải không được thay bằng dữ liệu mẫu.` : "");
      const repairList = repairsRes?.data?.requests || [];

      setContract(activeContract);
      setInvoices(invoiceList);
      setRepairs(repairList);
      setNotifications(notificationsRes.data?.data?.notifications || []);
      setUnreadCount(notificationsRes.data?.data?.unreadCount || 0);
    } catch (error) {
      console.error("Load tenant portal error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, [user?.email]);

  // Nút 1-Click: Tự động đăng ký thuê phòng & khởi tạo Hợp đồng điện tử + Bảng kê hóa đơn
  const handleQuickCreateContract = async (selectedRoom = null) => {
    const targetRoom = selectedRoom || rooms.find((r) => r.status === "available") || null;
    if (!targetRoom) {
      setToastMsg("Hiện không có phòng còn trống để tạo hợp đồng.");
      return;
    }
    try {
      const result = await createContractFromBooking({ room: targetRoom, user, durationMonths: 6 });
      setToastMsg("Đã tạo hợp đồng trên máy chủ thành công.");
      if (result?.contract && !contract) setContract(result.contract);
      await loadTenantData();
    } catch (error) {
      setToastMsg(error.message || "Không thể tạo hợp đồng. Hãy thử lại.");
    }
  };

  // Gia hạn hợp đồng thêm 6 tháng
  const handleExtendContract = async (months = 6) => {
    if (!contract) return;
    const contractId = contract._id || contract.id;

    try {
      const res = await apiRequest(`/contracts/${contractId}/extend`, {
        method: "PATCH",
        body: JSON.stringify({ months }),
      });
      if (res?.data?.contract) {
        setContract(res.data.contract);
        setToastMsg(
          res.message || `Đã gia hạn hợp đồng thêm ${months} tháng thành công!`
        );
        return;
      }
    } catch (error) {
      setToastMsg(error.message || "Không thể gia hạn hợp đồng. Hãy thử lại.");
      return;
    }
    setToastMsg("Máy chủ không trả về hợp đồng sau khi gia hạn.");
  };

  // Kết thúc hợp đồng / Trả phòng
  const handleTerminateMyContract = async () => {
    if (!contract) return;
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn gửi yêu cầu kết thúc hợp đồng và trả phòng này không?"
      )
    ) {
      return;
    }

    const contractId = contract._id || contract.id;
    try {
      await apiRequest(`/contracts/${contractId}/tenant-terminate`, {
        method: "PATCH",
      });
      setContract(null);
      setToastMsg("Đã gửi yêu cầu kết thúc hợp đồng đến máy chủ.");
      await loadTenantData();
    } catch (error) {
      setToastMsg(error.message || "Không thể gửi yêu cầu kết thúc hợp đồng.");
    }
  };

  // Gửi yêu cầu xác nhận sau khi người thuê đã thanh toán theo phương thức đã thống nhất.
  const handleConfirmPayInvoice = async (inv) => {
    if (!inv) return;
    setPaymentSubmitting(true);
    const invId = inv._id || inv.id;

    try {
      const response = await apiRequest(`/invoices/${invId}/tenant-pay`, {
        method: "PATCH",
      });
      const updatedInvoices = invoices.map((item) =>
        String(item._id || item.id) === String(invId)
          ? { ...item, status: response.data.invoice.status, paymentSubmittedAt: response.data.invoice.paymentSubmittedAt }
          : item
      );
      setInvoices(updatedInvoices);
      setPayingInvoice(null);
      setToastMsg("Đã gửi yêu cầu xác nhận thanh toán. Hóa đơn sẽ được cập nhật sau khi chủ trọ xác nhận.");
    } catch {
      setToastMsg("Không gửi được yêu cầu thanh toán. Hãy thử lại hoặc liên hệ chủ trọ.");
    } finally { setPaymentSubmitting(false); }
  };

  const handleCreateRepair = async (payload) => {
    try {
      const body = new FormData();
      body.append("roomId", payload.roomId);
      body.append("title", payload.title);
      body.append("description", payload.description);
      body.append("priority", payload.priority);
      payload.images.forEach((image) => body.append("images", image));
      const res = await apiRequest("/repair-requests", {
        method: "POST",
        body,
      });
      setToastMsg(res.message || "Đã gửi yêu cầu sửa chữa!");
      setRepairs((prev) => [res.data.request, ...prev]);
    } catch (error) {
      setToastMsg(error.message || "Không thể gửi yêu cầu sửa chữa. Hãy thử lại.");
      throw error;
    }
  };

  const markNotificationRead = async (notification) => {
    if (!notification || notification.readAt) return;
    try {
      await apiRequest(`/notifications/${notification._id}/read`, { method: "PATCH" });
      setNotifications((list) => list.map((item) => item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) { setToastMsg(error.message || "Không thể cập nhật thông báo."); }
  };

  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === "all") return invoices;
    if (invoiceFilter === "unpaid") return invoices.filter((inv) => inv.status !== "paid");
    return invoices.filter((inv) => inv.status === invoiceFilter);
  }, [invoices, invoiceFilter]);

  const filteredNotifications = useMemo(
    () => notificationFilter === "all" ? notifications : notifications.filter((item) => item.type === notificationFilter),
    [notifications, notificationFilter]
  );

  const unpaidInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== "paid"),
    [invoices]
  );

  const totalUnpaidAmount = useMemo(
    () =>
      unpaidInvoices.reduce(
        (sum, inv) => sum + (Number(inv.totalAmount) || 0),
        0
      ),
    [unpaidInvoices]
  );

  const availableSuggestedRooms = useMemo(
    () =>
      rooms
        .filter((r) => r.status !== "rented" && r.status !== "maintenance")
        .slice(0, 3),
    [rooms]
  );

  if (loading) {
    return (
      <main className="main-container">
        <div className="empty-state">
          <p className="text-muted">Đang tải thông tin phòng thuê của bạn...</p>
        </div>
      </main>
    );
  }

  const roomInfo = contract?.roomId || {};
  const roomImage = resolveRoomImageUrl(roomInfo.image || roomInfo.img);
  const electricCounter = roomInfo.currentElectricity ?? contract?.initialElectricity;
  const waterCounter = roomInfo.currentWater ?? contract?.initialWater;
  const amenitiesList =
    Array.isArray(roomInfo.amenities) && roomInfo.amenities.length > 0
      ? roomInfo.amenities
      : [];

  return (
    <main className="main-container">
      {apiError && <div className="alert alert-danger" role="alert">{apiError}</div>}
      {/* Header Banner */}
      <div
        className="p-4 rounded-4 mb-4 text-white shadow-sm"
        style={{
          background:
            "linear-gradient(135deg, #0d2b4e 0%, #0077b6 60%, #0096c7 100%)",
        }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="badge bg-warning text-dark fw-bold mb-2">
              <i className="bi bi-shield-check me-1"></i> Cổng thông tin người thuê
            </span>
            <h2 className="fw-bold mb-1" style={{ fontSize: "26px" }}>
              <i className="bi bi-buildings me-2"></i>
              Xin chào{user?.name ? `, ${user.name}` : ""}
            </h2>
            <p className="mb-0 opacity-75 small">
              Quản lý hợp đồng điện tử, đối soát chi tiết từng khoản hóa đơn
              (tiền phòng, điện, nước, dịch vụ) và theo dõi tiến độ sửa chữa
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {contract ? (
              <button
                type="button"
                className="btn btn-light btn-sm fw-semibold"
                onClick={() => window.print()}
              >
                <i className="bi bi-printer me-1 text-primary"></i> In Hợp Đồng
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-warning btn-sm fw-bold text-dark"
                onClick={() => navigate("/search")}
              >
                <i className="bi bi-search me-1"></i> Tìm phòng để thuê
              </button>
            )}
            <Link to="/search" className="btn btn-outline-light btn-sm">
              <i className="bi bi-search me-1"></i> Tìm thêm phòng
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Thẻ KPI Tổng Quan */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background: "#e0f2fe",
                  color: "#0284c7",
                  fontSize: 22,
                }}
              >
                <i className="bi bi-door-open-fill"></i>
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <div className="text-muted small">Phòng đang thuê</div>
                <div className="fw-bold text-truncate">
                  {contract
                    ? `${
                        roomInfo.roomNumber ? `P.${roomInfo.roomNumber} - ` : ""
                      }${roomInfo.title || "Phòng trọ"}`
                    : "Chưa nhận phòng"}
                </div>
                <small className="text-secondary">
                  {contract
                    ? `${roomInfo.area ? `${roomInfo.area} m²` : ""}${roomInfo.area && contract.blockId?.name ? " · " : ""}${contract.blockId?.name || ""}`
                    : "Hãy chọn phòng bên dưới"}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background: "#dcfce7",
                  color: "#16a34a",
                  fontSize: 22,
                }}
              >
                <i className="bi bi-file-earmark-check-fill"></i>
              </div>
              <div>
                <div className="text-muted small">Hợp đồng thuê</div>
                <div className="fw-bold">
                  {contract ? contract.contractCode : "Chưa có HĐ"}
                </div>
                <small className="text-success fw-semibold">
                  {contract
                    ? `Hiệu lực đến ${formatDateVN(contract.endDate)}`
                    : "Chưa kích hoạt"}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background:
                    unpaidInvoices.length > 0 ? "#fee2e2" : "#fef9c3",
                  color: unpaidInvoices.length > 0 ? "#dc2626" : "#ca8a04",
                  fontSize: 22,
                }}
              >
                <i className="bi bi-receipt-cutoff"></i>
              </div>
              <div>
                <div className="text-muted small">Cần thanh toán kỳ này</div>
                <div
                  className={`fw-bold ${
                    unpaidInvoices.length > 0 ? "text-danger" : "text-success"
                  }`}
                >
                  {unpaidInvoices.length > 0
                    ? formatVND(totalUnpaidAmount)
                    : "0 ₫ (Đã đóng đủ)"}
                </div>
                <small className="text-muted">
                  Tổng số: {invoices.length} hóa đơn hàng tháng
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{
                  width: 48,
                  height: 48,
                  background: "#f3e8ff",
                  color: "#9333ea",
                  fontSize: 22,
                }}
              >
                <i className="bi bi-tools"></i>
              </div>
              <div>
                <div className="text-muted small">Yêu cầu sửa chữa</div>
                <div className="fw-bold">{repairs.length} yêu cầu</div>
                <small className="text-secondary">
                  Mới → Đang xử lý → Xong
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh Chuyển Tab (3 Phân hệ chính của Người thuê) */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4 bg-white p-2 rounded-4 shadow-sm">
        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn rounded-3 px-4 py-2 fw-semibold ${
              activeTab === "contract"
                ? "btn-primary shadow-sm"
                : "btn-light text-secondary"
            }`}
            onClick={() => setActiveTab("contract")}
          >
            <i className="bi bi-file-earmark-text-fill me-2" />
            1. Thông Tin Phòng &amp; Hợp Đồng
          </button>
          <button
            type="button"
            className={`btn rounded-3 px-4 py-2 fw-semibold ${
              activeTab === "invoices"
                ? "btn-primary shadow-sm"
                : "btn-light text-secondary"
            }`}
            onClick={() => setActiveTab("invoices")}
          >
            <i className="bi bi-receipt me-2" />
            2. Danh Sách Hóa Đơn &amp; Chi Tiết Từng Khoản ({invoices.length})
            {unpaidInvoices.length > 0 && (
              <span className="badge bg-danger ms-2">
                {unpaidInvoices.length} chưa đóng
              </span>
            )}
          </button>
          <button
            type="button"
            className={`btn rounded-3 px-4 py-2 fw-semibold ${
              activeTab === "repairs"
                ? "btn-primary shadow-sm"
                : "btn-light text-secondary"
            }`}
            onClick={() => setActiveTab("repairs")}
          >
            <i className="bi bi-wrench-adjustable-circle me-2" />
            3. Yêu Cầu Sửa Chữa ({repairs.length})
          </button>
          <button type="button" className={`btn rounded-3 px-4 py-2 fw-semibold ${activeTab === "notifications" ? "btn-primary shadow-sm" : "btn-light text-secondary"}`} onClick={() => setActiveTab("notifications")}>
            <i className="bi bi-bell me-2" />Thông báo {unreadCount > 0 && <span className="badge bg-danger ms-1">{unreadCount}</span>}
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="alert alert-success alert-dismissible fade show py-2 mb-4 shadow-sm">
          <i className="bi bi-check-circle-fill me-2"></i>
          {toastMsg}
          <button
            type="button"
            className="btn-close"
            onClick={() => setToastMsg("")}
          />
        </div>
      )}

      {/* =====================================================================
          TAB 1: THÔNG TIN PHÒNG & BẢN HỢP ĐỒNG THUÊ NHÀ ĐIỆN TỬ
      ===================================================================== */}
      {activeTab === "contract" && (
        <div className="tenant-contract-view">
          {!contract ? (
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
              <div className="text-center mb-4">
                <div
                  className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 80,
                    height: 80,
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: 36,
                  }}
                >
                  <i className="bi bi-file-earmark-plus"></i>
                </div>
                <h4 className="fw-bold mb-2">
                  Tài khoản của bạn hiện chưa có hợp đồng thuê phòng nào đang
                  hoạt động
                </h4>
                <p
                  className="text-muted mx-auto mb-3"
                  style={{ maxWidth: 640 }}
                >
                  Chọn một phòng đang trống để gửi đăng ký thuê. Hợp đồng và
                  hóa đơn chỉ được tạo sau khi nghiệp vụ tương ứng được xác nhận.
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2 fw-bold"
                    onClick={() => navigate("/search")}
                  >
                    <i className="bi bi-search me-2"></i>
                    Tìm phòng đang trống
                  </button>
                  <Link
                    to="/search"
                    className="btn btn-outline-primary px-4 py-2 fw-semibold"
                  >
                    <i className="bi bi-search me-2"></i>
                    Khám phá danh sách phòng trống
                  </Link>
                </div>
              </div>

              {availableSuggestedRooms.length > 0 && (
                <div className="border-top pt-4 mt-2">
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-stars text-warning me-2"></i>
                    Chọn nhanh phòng đang trống để Đăng ký Hợp đồng thuê:
                  </h5>
                  <div className="row g-3">
                    {availableSuggestedRooms.map((r) => {
                      const rId = r._id || r.id;
                      return (
                        <div className="col-md-4" key={rId}>
                          <div className="card h-100 border rounded-4 overflow-hidden shadow-sm">
                            <img
                              src={resolveRoomImageUrl(r.image || r.img)}
                              alt={r.title}
                              style={{ height: 160, objectFit: "cover" }}
                              onError={(e) => {
                                e.currentTarget.src = "/images/room1.jpg";
                              }}
                            />
                            <div className="card-body d-flex flex-column">
                              <span className="badge bg-success-subtle text-success align-self-start mb-2">
                                Còn trống{r.area ? ` · ${r.area} m²` : ""}
                              </span>
                              <h6 className="fw-bold mb-1">{r.title}</h6>
                              <p className="text-muted small mb-2">
                                <i className="bi bi-geo-alt me-1"></i>
                                {r.district}
                              </p>
                              <div className="fw-bold text-danger fs-5 mb-3">
                                {formatVND(r.price)}/tháng
                              </div>
                              <div className="mt-auto d-flex gap-2">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm flex-grow-1 fw-semibold"
                                  onClick={() => handleQuickCreateContract(r)}
                                >
                                  <i className="bi bi-pen me-1"></i> Ký HĐ thuê
                                  ngay
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => navigate(`/rooms/${rId}`)}
                                >
                                  Chi tiết
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="row g-4">
              {/* CỘT TRÁI: THẺ THÔNG TIN PHÒNG ĐANG THUÊ & ĐỒNG HỒ ĐIỆN NƯỚC */}
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                  <div style={{ position: "relative", height: 230 }}>
                    <img
                      src={roomImage}
                      alt={roomInfo.title || "Phòng đang thuê"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = "/images/room1.jpg";
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <span className="badge bg-primary px-3 py-2 shadow-sm">
                        <i className="bi bi-door-open me-1"></i>
                        {roomInfo.roomNumber
                          ? `Phòng ${roomInfo.roomNumber}`
                          : "Phòng đang thuê"}
                      </span>
                      <StatusBadge
                        type="room"
                        status={roomInfo.status || "rented"}
                      />
                    </div>
                  </div>

                  <div className="p-4">
                    <h4 className="fw-bold mb-1">
                      {roomInfo.title || (roomInfo.roomNumber ? `Phòng ${roomInfo.roomNumber}` : "Phòng đang thuê")}
                    </h4>
                    <p className="text-muted small mb-3">
                      <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                      {roomInfo.district || "Chưa cập nhật địa chỉ"} ·{" "}
                      <strong>
                        {contract.blockId?.name || "—"}
                      </strong>
                    </p>

                    {/* 2 Hộp Đồng Hồ Điện Nước Hiện Tại */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div
                          className="p-3 rounded-3"
                          style={{
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                          }}
                        >
                          <div className="small text-secondary d-flex align-items-center gap-1">
                            <i className="bi bi-lightning-charge-fill text-warning"></i>
                            Chỉ số Điện hiện tại
                          </div>
                          <div className="fw-bold fs-5 text-dark mt-1">
                            {electricCounter ?? "—"}{" "}
                            <small className="fs-6 fw-normal">kWh</small>
                          </div>
                          <div className="small text-muted">
                            Đơn giá: {formatVND(contract.electricityPrice)}/kWh
                          </div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div
                          className="p-3 rounded-3"
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          <div className="small text-secondary d-flex align-items-center gap-1">
                            <i className="bi bi-droplet-fill text-primary"></i>
                            Chỉ số Nước hiện tại
                          </div>
                          <div className="fw-bold fs-5 text-dark mt-1">
                            {waterCounter ?? "—"}{" "}
                            <small className="fs-6 fw-normal">m³</small>
                          </div>
                          <div className="small text-muted">
                            Đơn giá: {formatVND(contract.waterPrice)}/m³
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tiện nghi bàn giao trong phòng */}
                    <div className="mb-3">
                      <div className="small fw-bold text-uppercase text-secondary mb-2">
                        Tiện nghi{roomInfo.area ? ` · ${roomInfo.area} m²` : ""}
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {amenitiesList.length ? amenitiesList.map((am, idx) => (
                          <span
                            key={idx}
                            className="badge bg-light text-dark border px-2 py-1"
                          >
                            <i className="bi bi-check2-circle text-success me-1"></i>
                            {am}
                          </span>
                        )) : <span className="small text-muted">Chưa có thông tin tiện nghi.</span>}
                      </div>
                    </div>

                    {/* Thông tin chủ trọ */}
                    <div className="p-3 rounded-3 bg-light border d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted">
                          Chủ nhà / Quản lý dãy trọ
                        </div>
                        <div className="fw-bold">
                          {contract.landlordId?.name || "Chưa cập nhật"}
                        </div>
                        <div className="small text-primary fw-semibold">
                          <i className="bi bi-telephone-fill me-1"></i>
                          {contract.landlordId?.phone || "Chưa cập nhật số điện thoại"}
                        </div>
                      </div>
                      <div className="d-flex flex-column gap-1">
                        {roomInfo._id && (
                            <Link
                              to={`/rooms/${roomInfo._id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-eye me-1"></i> Xem tin phòng
                            </Link>
                          )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning text-dark"
                          onClick={() => setActiveTab("repairs")}
                        >
                          <i className="bi bi-tools me-1"></i> Báo sửa chữa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: VĂN BẢN HỢP ĐỒNG THUÊ PHÒNG ĐIỆN TỬ */}
              <div className="col-lg-7">
                <div
                  className="card border-0 shadow-sm rounded-4 p-4 h-100"
                  style={{ borderTop: "4px solid #0077b6" }}
                >
                  {/* Quốc hiệu & Tiêu đề Hợp đồng */}
                  <div className="text-center border-bottom pb-3 mb-3">
                    <div className="small fw-bold text-uppercase text-secondary">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </div>
                    <div className="small text-muted mb-2">
                      Độc lập - Tự do - Hạnh phúc
                    </div>
                    <h4 className="fw-bold text-primary mb-1">
                      THÔNG TIN HỢP ĐỒNG THUÊ PHÒNG
                    </h4>
                    <div className="d-flex justify-content-center align-items-center gap-2 small">
                      <span>
                        Mã số: <strong>{contract.contractCode}</strong>
                      </span>
                      <span>·</span>
                      <StatusBadge type="contract" status={contract.status} />
                    </div>
                  </div>

                  {/* Điều 1: Các bên tham gia */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <div className="p-3 rounded-3 bg-light h-100 border">
                        <div className="small fw-bold text-uppercase text-primary mb-1">
                          <i className="bi bi-person-workspace me-1"></i>
                          BÊN CHO THUÊ (BÊN A)
                        </div>
                        <div className="small">
                          <div>
                            Họ tên:{" "}
                            <strong>
                              {contract.landlordId?.name || "Chưa cập nhật"}
                            </strong>
                          </div>
                          <div>
                            Số điện thoại:{" "}
                            <strong>
                              {contract.landlordId?.phone || "Chưa cập nhật"}
                            </strong>
                          </div>
                          <div>
                            Cơ sở:{" "}
                            <strong>
                              {contract.blockId?.name || "—"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 rounded-3 bg-light h-100 border">
                        <div className="small fw-bold text-uppercase text-success mb-1">
                          <i className="bi bi-person-check-fill me-1"></i>
                          BÊN THUÊ PHÒNG (BÊN B)
                        </div>
                        <div className="small">
                          <div>
                            Họ tên:{" "}
                            <strong>
                              {contract.tenantName || user?.name || "Người thuê"}
                            </strong>
                          </div>
                          <div>
                            Email:{" "}
                            <strong>
                              {contract.tenantEmail || user?.email}
                            </strong>
                          </div>
                          <div>
                            SĐT:{" "}
                            <strong>
                              {contract.tenantPhone || "Chưa cập nhật"}
                            </strong>{" "}
                            · CCCD:{" "}
                            <strong>
                              {contract.identityCard || "Chưa cập nhật"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Điều khoản và biểu phí theo dữ liệu hợp đồng */}
                  <section className="tenant-contract-terms" aria-labelledby="contract-terms-heading">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 id="contract-terms-heading" className="fw-bold mb-0">Thời hạn và chi phí</h5>
                    </div>
                    <div className="tenant-contract-terms-grid">
                      <div className="tenant-contract-term tenant-contract-term-wide"><span>Thời hạn hợp đồng</span><strong>{formatDateVN(contract.startDate)} – {formatDateVN(contract.endDate)}</strong></div>
                      <div className="tenant-contract-term"><span>Tiền thuê / tháng</span><strong>{formatVND(contract.rentPrice)}</strong></div>
                      <div className="tenant-contract-term"><span>Tiền đặt cọc</span><strong>{formatVND(contract.deposit)}</strong></div>
                      <div className="tenant-contract-term"><span>Điện</span><strong>{formatVND(contract.electricityPrice)} / kWh</strong></div>
                      <div className="tenant-contract-term"><span>Nước</span><strong>{formatVND(contract.waterPrice)} / m³</strong></div>
                      <div className="tenant-contract-term tenant-contract-term-wide"><span>Phí dịch vụ / tháng</span><strong>{formatVND(contract.serviceFee)}</strong></div>
                    </div>
                    {contract.notes && <div className="tenant-contract-note mt-3"><span>Ghi chú hợp đồng</span><p>{contract.notes}</p></div>}
                  </section>

                  <div className="tenant-contract-record mt-3">
                    <i className="bi bi-shield-check"/>
                    <span>Hợp đồng được lưu trên hệ thống. Trạng thái hiện tại được lấy từ hồ sơ hợp đồng.</span>
                  </div>

                  {/* Các nút thao tác Hợp đồng */}
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-auto pt-2 border-top d-print-none">
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm fw-semibold"
                        onClick={() => window.print()}
                      >
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> In
                        / Xuất PDF Hợp Đồng
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm fw-semibold"
                        onClick={() => handleExtendContract(6)}
                      >
                        <i className="bi bi-calendar-plus me-1"></i> Gia hạn +6
                        tháng
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm fw-semibold"
                        onClick={() => setActiveTab("invoices")}
                      >
                        <i className="bi bi-receipt me-1"></i> Xem Hóa đơn (
                        {invoices.length})
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleTerminateMyContract}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i> Kết thúc HĐ
                      / Trả phòng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: DANH SÁCH HÓA ĐƠN & BẢNG KÊ CHI TIẾT TỪNG KHOẢN
      ===================================================================== */}
      {activeTab === "invoices" && (
        <section className="tenant-invoice-list" aria-labelledby="tenant-invoices-title">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div>
              <span className="tenant-section-kicker">TÀI CHÍNH CỦA BẠN</span>
              <h2 id="tenant-invoices-title" className="h3 fw-bold mb-1">Hóa đơn</h2>
              <p className="text-muted mb-0">Theo dõi khoản thu và hạn thanh toán theo từng kỳ.</p>
            </div>
            <div className="tenant-invoice-filters" role="group" aria-label="Lọc hóa đơn">
              {[
                ["all", "Tất cả", invoices.length],
                ["unpaid", "Chưa thanh toán", unpaidInvoices.length],
                ["paid", "Đã thanh toán", invoices.length - unpaidInvoices.length],
              ].map(([value, label, count]) => (
                <button key={value} type="button" className={invoiceFilter === value ? "is-active" : ""} aria-pressed={invoiceFilter === value} onClick={() => setInvoiceFilter(value)}>
                  {label}<span>{count}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="tenant-empty-state">
              <span className="tenant-empty-icon"><i className="bi bi-receipt"/></span>
              <h3>{invoices.length ? "Không có hóa đơn phù hợp" : "Chưa có hóa đơn"}</h3>
              <p>{invoices.length ? "Thử chọn bộ lọc khác." : "Hóa đơn sẽ xuất hiện tại đây sau khi chủ trọ phát hành cho phòng của bạn."}</p>
              {invoiceFilter !== "all" && <button type="button" className="btn btn-outline-primary" onClick={() => setInvoiceFilter("all")}>Xem tất cả hóa đơn</button>}
            </div>
          ) : (
            <div className="tenant-invoice-cards">
              {filteredInvoices.map((inv) => {
                const invId = inv._id || inv.id;
                const isPaid = inv.status === "paid";
                const balance = isPaid ? 0 : Number(inv.totalAmount) || 0;
                return (
                  <article key={invId} className="tenant-invoice-card">
                    <div className="tenant-invoice-card-top">
                      <div className="tenant-invoice-period">
                        <span>KỲ THANH TOÁN</span>
                        <strong>{String(inv.month).padStart(2, "0")}/{inv.year}</strong>
                      </div>
                      <StatusBadge type="invoice" status={inv.status}/>
                    </div>
                    <div className="tenant-invoice-card-main">
                      <div className="tenant-invoice-primary">
                        <h3>{inv.roomId?.roomNumber ? "Phòng " + inv.roomId.roomNumber : (inv.roomId?.title || "Phòng thuê")}</h3>
                        <p>Mã hóa đơn <strong>{inv.invoiceCode || "—"}</strong></p>
                      </div>
                      <div className="tenant-invoice-amount">
                        <span>{isPaid ? "Đã thanh toán" : "Còn phải thanh toán"}</span>
                        <strong className={isPaid ? "is-paid" : ""}>{formatVND(balance)}</strong>
                      </div>
                    </div>
                    <div className="tenant-invoice-card-meta">
                      <span><i className="bi bi-calendar-event"/>{isPaid && inv.paidAt ? "Đã thu " + formatDateVN(inv.paidAt) : "Hạn " + formatDateVN(inv.dueDate)}</span>
                      <span className="tenant-invoice-total">Tổng hóa đơn <strong>{formatVND(inv.totalAmount)}</strong></span>
                    </div>
                    <div className="tenant-invoice-actions">
                      <Link to={"/invoices/" + invId} className="btn btn-outline-primary"><i className="bi bi-eye me-1"/>Xem chi tiết / In</Link>
                      {inv.status === "unpaid" && <button type="button" className="btn btn-primary" onClick={() => openPayment(inv)}><i className="bi bi-credit-card me-1"/>Thanh toán</button>}
                      {inv.status === "pending_confirmation" && <span className="tenant-payment-pending"><i className="bi bi-hourglass-split me-1"/>Đang chờ chủ trọ xác nhận</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          TAB 3: GỬI YÊU CẦU SỬA CHỮA KÈM ẢNH & THEO DÕI TRẠNG THÁI
      ===================================================================== */}
      {activeTab === "repairs" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <div id="tenant-repair-form">
            <RepairRequestForm
              roomId={contract?.roomId?._id}
              onSubmitted={handleCreateRepair}
            />
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-clock-history me-2 text-primary" />
                Theo Dõi Tiến Độ Yêu Cầu Sửa Chữa (Mới → Đang xử lý → Xong)
              </h5>

              {repairs.length === 0 ? (
                <div className="tenant-empty-state my-3">
                  <span className="tenant-empty-icon"><i className="bi bi-tools"/></span>
                  <h3>Chưa có yêu cầu sửa chữa</h3>
                  <p>Gửi mô tả và ảnh nếu có sự cố cần chủ trọ hỗ trợ.</p>
                  <button type="button" className="btn btn-primary" onClick={() => document.getElementById("tenant-repair-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}><i className="bi bi-plus-lg me-1"/>Tạo yêu cầu sửa chữa</button>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {repairs.map((req) => (
                    <div
                      key={req._id}
                      className="tenant-repair-card p-3 rounded-4 border bg-light"
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-bold mb-1">{req.title}</h6>
                          <small className="text-muted">
                            Phòng:{" "}
                            {req.roomId?.title ||
                              roomInfo.title ||
                              "Phòng đang thuê"}{" "}
                            · Ngày gửi: {formatDateVN(req.createdAt)}
                          </small>
                        </div>
                        <StatusBadge type="repair" status={req.status} />
                      </div>

                      <p className="small mb-2">{req.description}</p>

                      {req.images && req.images.length > 0 && (
                        <div className="d-flex gap-2 mb-2">
                          {req.images.map((imgUrl, idx) => (
                            <img
                              key={`${req._id}_img_${idx}`}
                              src={imgUrl}
                              alt="Ảnh sự cố"
                              style={{
                                width: 90,
                                height: 65,
                                objectFit: "cover",
                                borderRadius: 6,
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Thanh tiến trình Mới -> Đang xử lý -> Xong */}
                      <div className="tenant-repair-progress d-flex align-items-center gap-2 mt-2 small">
                        <span
                          className={`badge ${
                            ["new", "in_progress", "resolved"].includes(
                              req.status
                            )
                              ? "bg-primary"
                              : "bg-secondary"
                          }`}
                        >
                          1. Mới tiếp nhận
                        </span>
                        <i className="bi bi-arrow-right text-muted" />
                        <span
                          className={`badge ${
                            ["in_progress", "resolved"].includes(req.status)
                              ? "bg-warning text-dark"
                              : "bg-secondary bg-opacity-25 text-muted"
                          }`}
                        >
                          2. Đang xử lý
                        </span>
                        <i className="bi bi-arrow-right text-muted" />
                        <span
                          className={`badge ${
                            req.status === "resolved"
                              ? "bg-success"
                              : "bg-secondary bg-opacity-25 text-muted"
                          }`}
                        >
                          3. Hoàn thành (Xong)
                        </span>
                      </div>

                      {req.landlordNote && (
                        <div className="mt-2 p-2 rounded bg-white border small">
                          <strong>Phản hồi của Chủ trọ:</strong>{" "}
                          {req.landlordNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <section className="tenant-notifications card border-0 shadow-sm rounded-4 p-3 p-md-4" aria-labelledby="tenant-notifications-title">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
            <div><span className="tenant-section-kicker">CẬP NHẬT TÀI KHOẢN</span><h2 id="tenant-notifications-title" className="h3 fw-bold mb-1">Thông báo</h2><p className="text-muted small mb-0">Tin mới về hợp đồng, hóa đơn và yêu cầu sửa chữa.</p></div>
            {unreadCount > 0 && <button type="button" className="btn btn-outline-primary rounded-pill" onClick={async () => { try { await apiRequest("/notifications/read-all", { method: "PATCH" }); setNotifications((list) => list.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))); setUnreadCount(0); } catch (error) { setToastMsg(error.message || "Không thể cập nhật thông báo."); } }}><i className="bi bi-check2-all me-1"/>Đánh dấu đã đọc</button>}
          </div>
          <div className="tenant-notification-filters" role="group" aria-label="Lọc loại thông báo">
            {[['all', 'Tất cả'], ['invoice', 'Hóa đơn'], ['contract', 'Hợp đồng'], ['repair', 'Sửa chữa'], ['system', 'Hệ thống']].map(([type, label]) => <button key={type} type="button" className={notificationFilter === type ? "is-active" : ""} aria-pressed={notificationFilter === type} onClick={() => setNotificationFilter(type)}>{label}</button>)}
          </div>
          {filteredNotifications.length === 0 ? <div className="tenant-empty-state mt-3"><span className="tenant-empty-icon"><i className="bi bi-bell-slash"/></span><h3>{notifications.length ? "Không có thông báo trong mục này" : "Bạn chưa có thông báo"}</h3><p>{notifications.length ? "Chọn loại khác để xem thông báo." : "Thông báo sẽ xuất hiện khi có cập nhật thật liên quan đến tài khoản của bạn."}</p></div> : <div className="d-flex flex-column gap-2 mt-3">{filteredNotifications.map((item) => <button key={item._id} type="button" className={`tenant-notice-row ${item.readAt ? "is-read" : "is-unread"}`} onClick={async () => { await markNotificationRead(item); if (item.resourceType === "invoice" && item.resourceId) navigate(`/invoices/${item.resourceId}`); else if (item.resourceType === "repair") setActiveTab("repairs"); else if (item.resourceType === "contract") setActiveTab("contract"); }}><span className="tenant-notice-icon"><i className={`bi ${item.type === "invoice" ? "bi-receipt" : item.type === "contract" ? "bi-file-earmark-text" : item.type === "repair" ? "bi-tools" : "bi-info-circle"}`}/></span><span className="tenant-notice-content"><span className="tenant-notice-heading"><strong>{item.title}</strong><small>{formatDateVN(item.createdAt)}</small></span><span className="tenant-notice-message">{item.message}</span><span className={`tenant-notice-type type-${item.type}`}>{item.type === "invoice" ? "Hóa đơn" : item.type === "contract" ? "Hợp đồng" : item.type === "repair" ? "Sửa chữa" : "Hệ thống"}</span></span>{!item.readAt && <span className="tenant-notice-dot" aria-label="Chưa đọc"/>}</button>)}</div>}
        </section>
      )}

      {/* Modal thanh toán qua VietQR; status chỉ đổi sau khi chủ trọ xác nhận */}
      {payingInvoice && (
        <div
          className="modal"
          style={{ display: "flex", backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPayingInvoice(null);
          }}
        >
          <div
            className="modal-content shadow-lg text-center"
            style={{ maxWidth: 460, padding: 28 }}
          >
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
              <h5 className="fw-bold mb-0 text-primary"><i className="bi bi-credit-card me-2"></i>Thanh toán hóa đơn</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setPayingInvoice(null)}
              ></button>
            </div>

            <div className="p-3 rounded-3 bg-light border mb-3 text-start small">
              <div className="d-flex justify-content-between mb-1"><span className="text-muted">Phòng / kỳ:</span><strong>{paymentInstructions?.invoice?.room || payingInvoice.roomId?.roomNumber || payingInvoice.roomId?.title || "—"} · {payingInvoice.month}/{payingInvoice.year}</strong></div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Mã hóa đơn:</span>
                <strong>{payingInvoice.invoiceCode}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Nội dung chuyển khoản:</span><strong className="text-primary">{paymentInstructions?.transferContent || "—"}</strong>
              </div>
              <div className="d-flex justify-content-between border-top pt-2 mt-2">
                <span className="fw-bold">Tổng số tiền:</span>
                <strong className="text-danger fs-5">
                  {formatVND(paymentInstructions?.invoice?.amount ?? payingInvoice.totalAmount)}
                </strong>
              </div>
            </div>

            {paymentLoading ? <div className="py-3"><span className="spinner-border spinner-border-sm me-2"/>Đang tải thông tin thanh toán…</div> : paymentError ? <div className="alert alert-danger">{paymentError}</div> : !paymentInstructions?.configured ? <div className="alert alert-warning text-start small">Chủ trọ chưa cấu hình thông tin nhận chuyển khoản. Vui lòng liên hệ chủ trọ.</div> : <div className="text-start small">
              {qrFailed ? <div className="alert alert-warning">Không tải được hình VietQR. Bạn vẫn có thể chuyển thủ công bằng thông tin bên dưới.</div> : <div className="text-center mb-3"><img src={paymentInstructions.qrUrl} onError={() => setQrFailed(true)} alt="Mã VietQR thanh toán hóa đơn" style={{ width: "min(100%, 320px)", height: "auto", objectFit: "contain" }} /></div>}
              <div className="p-3 rounded-3 bg-light border mb-3"><div><strong>{paymentInstructions.bank.bankName}</strong> · {paymentInstructions.bank.accountName}</div><div>Số tài khoản: <strong>{paymentInstructions.bank.accountNumber}</strong> <button className="btn btn-sm btn-outline-secondary ms-1" onClick={() => navigator.clipboard.writeText(paymentInstructions.bank.accountNumber)}>Sao chép</button></div><div>Nội dung: <strong>{paymentInstructions.transferContent}</strong> <button className="btn btn-sm btn-outline-secondary ms-1" onClick={() => navigator.clipboard.writeText(paymentInstructions.transferContent)}>Sao chép</button></div><div>Số tiền: <strong>{formatVND(paymentInstructions.invoice.amount)}</strong> <button className="btn btn-sm btn-outline-secondary ms-1" onClick={() => navigator.clipboard.writeText(String(paymentInstructions.invoice.amount))}>Sao chép</button></div></div>
              <div className="alert alert-info">Quét mã bằng ứng dụng ngân hàng và kiểm tra thông tin trước khi chuyển. Gửi yêu cầu không tự xác nhận đã nhận tiền; hóa đơn chỉ được đánh dấu đã thanh toán sau khi chủ trọ kiểm tra và xác nhận.</div>
            </div>}

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-50"
                onClick={() => setPayingInvoice(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-success w-50 fw-bold"
                onClick={() => handleConfirmPayInvoice(payingInvoice)}
                disabled={paymentLoading || paymentSubmitting || !paymentInstructions?.configured}
              >
                <i className="bi bi-send me-1"></i> Tôi đã chuyển khoản — Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
