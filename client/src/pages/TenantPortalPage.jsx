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

export const TenantPortalPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: rooms } = useSelector((state) => state.rooms);

  const [activeTab, setActiveTab] = useState("contract");
  const [contract, setContract] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [securityTestResult, setSecurityTestResult] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  // Invoice filter & expanded breakdown state
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);

  useEffect(() => {
    if (!rooms.length) {
      dispatch(fetchRoomsThunk({ page: 1, limit: 20 }));
    }
  }, [dispatch, rooms.length]);

  const loadTenantData = async () => {
    setLoading(true);
    try {
      const [contractRes, invoicesRes, repairsRes] = await Promise.all([
        apiRequest("/contracts/my-active").then((data) => ({ data })).catch((error) => ({ error })),
        apiRequest("/invoices").then((data) => ({ data })).catch((error) => ({ error })),
        apiRequest("/repair-requests").then((data) => ({ data })).catch((error) => ({ error })),
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
      if (invoiceList.length > 0) {
        setExpandedInvoiceId(invoiceList[0]._id || invoiceList[0].id);
      }
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

  // Thanh toán hóa đơn trực tuyến (QR / Xác nhận)
  const handleConfirmPayInvoice = async (inv) => {
    if (!inv) return;
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
    }
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

  // Kiểm thử yêu cầu kỹ thuật riêng Đề 4:
  // "Người thuê chỉ xem được hóa đơn của phòng mình: kiểm tra ở API, gọi thẳng API hóa đơn phòng khác phải nhận 403."
  const handleTestForbiddenInvoiceApi = async () => {
    setSecurityTestResult(null);
    try {
      const fakeOtherRoomId = "000000000000000000000099";
      await apiRequest(`/invoices?roomId=${fakeOtherRoomId}`);
    } catch (err) {
      setSecurityTestResult({
        status: err.status || 403,
        message:
          err.message ||
          "403 Forbidden: Bạn chỉ được phép xem hóa đơn của phòng mình đang thuê!",
      });
    }
  };

  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === "all") return invoices;
    if (invoiceFilter === "unpaid") return invoices.filter((inv) => inv.status !== "paid");
    return invoices.filter((inv) => inv.status === invoiceFilter);
  }, [invoices, invoiceFilter]);

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
  const amenitiesList =
    Array.isArray(roomInfo.amenities) && roomInfo.amenities.length > 0
      ? roomInfo.amenities
      : ["Wifi", "Điều hòa", "Nóng lạnh", "Chỗ để xe", "An ninh"];

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
              <i className="bi bi-shield-check me-1"></i> Cổng Thông Tin Người Thuê · Đề 4
            </span>
            <h2 className="fw-bold mb-1" style={{ fontSize: "26px" }}>
              <i className="bi bi-buildings me-2"></i>
              Phòng Trọ, Hợp Đồng &amp; Hóa Đơn Của Tôi
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
                onClick={() => handleQuickCreateContract()}
              >
                <i className="bi bi-lightning-charge-fill me-1"></i> Khởi tạo
                Hợp đồng &amp; Hóa đơn mẫu ngay
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
                    ? `${roomInfo.area || 25} m² · ${
                        contract.blockId?.name || "Dãy A"
                      }`
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
        <div>
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
                  Bạn có thể bấm nút{" "}
                  <strong>
                    &quot;Tạo Hợp đồng &amp; Hóa đơn mẫu 1-Click&quot;
                  </strong>{" "}
                  bên dưới để hệ thống tự động lập Hợp đồng điện tử và phát hành
                  bảng kê hóa đơn chi tiết cho tài khoản{" "}
                  <code>{user?.email}</code>, hoặc chọn 1 phòng đang trống bên
                  dưới để ký hợp đồng thuê ngay.
                </p>
                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-primary px-4 py-2 fw-bold"
                    onClick={() => handleQuickCreateContract()}
                  >
                    <i className="bi bi-magic me-2"></i>
                    Tạo Hợp Đồng &amp; Hóa Đơn Mẫu 1-Click
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
                                Còn trống · {r.area || 25} m²
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
                      {roomInfo.title || "Phòng trọ tiện nghi"}
                    </h4>
                    <p className="text-muted small mb-3">
                      <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                      {roomInfo.district || "Hà Đông, Hà Nội"} ·{" "}
                      <strong>
                        {contract.blockId?.name || "Dãy A - Cơ sở chính"}
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
                            {roomInfo.currentElectricity ??
                              contract.initialElectricity ??
                              165}{" "}
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
                            {roomInfo.currentWater ??
                              contract.initialWater ??
                              18}{" "}
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
                        Nội thất &amp; Tiện nghi bàn giao ({roomInfo.area || 28}{" "}
                        m²)
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {amenitiesList.map((am, idx) => (
                          <span
                            key={idx}
                            className="badge bg-light text-dark border px-2 py-1"
                          >
                            <i className="bi bi-check2-circle text-success me-1"></i>
                            {am}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Thông tin chủ trọ */}
                    <div className="p-3 rounded-3 bg-light border d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-muted">
                          Chủ nhà / Quản lý dãy trọ
                        </div>
                        <div className="fw-bold">
                          {contract.landlordId?.name || "Chủ trọ Demo (Anh Minh)"}
                        </div>
                        <div className="small text-primary fw-semibold">
                          <i className="bi bi-telephone-fill me-1"></i>
                          {contract.landlordId?.phone || "0987.654.321"}
                        </div>
                      </div>
                      <div className="d-flex flex-column gap-1">
                        {roomInfo._id &&
                          !String(roomInfo._id).startsWith("room-demo") && (
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
                      HỢP ĐỒNG THUÊ PHÒNG TRỌ ĐIỆN TỬ
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
                              {contract.landlordId?.name ||
                                "Chủ trọ RIPT Rental"}
                            </strong>
                          </div>
                          <div>
                            Số điện thoại:{" "}
                            <strong>
                              {contract.landlordId?.phone || "0987.654.321"}
                            </strong>
                          </div>
                          <div>
                            Cơ sở:{" "}
                            <strong>
                              {contract.blockId?.name || "Dãy A - Hà Nội"}
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
                              {contract.tenantPhone || "0987.654.321"}
                            </strong>{" "}
                            · CCCD:{" "}
                            <strong>
                              {contract.identityCard || "001202034567"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Điều 2: Thời hạn & Biểu phí hợp đồng */}
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-journal-check text-primary me-1"></i>
                    Điều khoản tài chính &amp; Đơn giá cam kết trong hợp đồng
                  </h6>
                  <div className="table-responsive mb-3">
                    <table className="table table-bordered table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Khoản mục hợp đồng</th>
                          <th>Mức phí / Đơn giá</th>
                          <th>Quy định áp dụng</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="fw-semibold">Thời hạn hợp đồng</td>
                          <td className="fw-bold text-primary">
                            {formatDateVN(contract.startDate)} →{" "}
                            {formatDateVN(contract.endDate)}
                          </td>
                          <td className="small text-muted">
                            Có thể gia hạn trực tuyến
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">
                            1. Giá thuê phòng cố định
                          </td>
                          <td className="fw-bold text-danger">
                            {formatVND(contract.rentPrice)} / tháng
                          </td>
                          <td className="small text-muted">
                            Không tăng giá trong kỳ HĐ
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">2. Tiền đặt cọc</td>
                          <td className="fw-bold">
                            {formatVND(contract.deposit)}
                          </td>
                          <td className="small text-muted">
                            Hoàn lại khi thanh lý HĐ
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">3. Đơn giá Điện</td>
                          <td className="fw-bold">
                            {formatVND(contract.electricityPrice)} / kWh
                          </td>
                          <td className="small text-muted">
                            Chốt chỉ số cuối mỗi tháng
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">4. Đơn giá Nước</td>
                          <td className="fw-bold">
                            {formatVND(contract.waterPrice)} / m³
                          </td>
                          <td className="small text-muted">
                            Chốt chỉ số cuối mỗi tháng
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-semibold">
                            5. Phí dịch vụ chung (Wifi, rác, VS)
                          </td>
                          <td className="fw-bold">
                            {formatVND(contract.serviceFee)} / tháng
                          </td>
                          <td className="small text-muted">
                            Cố định hàng tháng
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Chữ ký điện tử xác nhận */}
                  <div className="row text-center py-2 mb-3 border rounded-3 bg-light mx-0">
                    <div className="col-6 border-end">
                      <div className="small fw-bold text-secondary">
                        ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                      </div>
                      <div className="text-success small my-1">
                        <i className="bi bi-patch-check-fill me-1"></i> Đã ký số
                        xác thực
                      </div>
                      <div className="fw-bold small">
                        {contract.landlordId?.name || "Chủ trọ RIPT Rental"}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="small fw-bold text-secondary">
                        ĐẠI DIỆN BÊN THUÊ (BÊN B)
                      </div>
                      <div className="text-success small my-1">
                        <i className="bi bi-patch-check-fill me-1"></i> Đã xác
                        nhận trực tuyến
                      </div>
                      <div className="fw-bold small">
                        {contract.tenantName || user?.name}
                      </div>
                    </div>
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
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 border-bottom pb-3">
            <div>
              <h5 className="fw-bold mb-1">
                <i className="bi bi-receipt-cutoff text-primary me-2"></i>
                Danh Sách Hóa Đơn &amp; Bảng Kê Chi Tiết Từng Khoản
              </h5>
              <p className="text-muted small mb-0">
                Mỗi hóa đơn hiển thị đầy đủ 4 khoản: Tiền thuê phòng, Tiền điện
                (chỉ số cũ → mới), Tiền nước (chỉ số cũ → mới) và Phí dịch vụ
              </p>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${
                    invoiceFilter === "all"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setInvoiceFilter("all")}
                >
                  Tất cả ({invoices.length})
                </button>
                <button
                  type="button"
                  className={`btn ${
                    invoiceFilter === "unpaid"
                      ? "btn-danger"
                      : "btn-outline-danger"
                  }`}
                  onClick={() => setInvoiceFilter("unpaid")}
                >
                  Chưa thanh toán ({unpaidInvoices.length})
                </button>
                <button
                  type="button"
                  className={`btn ${
                    invoiceFilter === "paid"
                      ? "btn-success"
                      : "btn-outline-success"
                  }`}
                  onClick={() => setInvoiceFilter("paid")}
                >
                  Đã thanh toán ({invoices.length - unpaidInvoices.length})
                </button>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleTestForbiddenInvoiceApi}
                title="Kiểm tra ràng buộc bảo mật Đề 4: Gọi API hóa đơn phòng khác phải nhận 403"
              >
                <i className="bi bi-shield-lock me-1" />
                Test bảo mật 403
              </button>
            </div>
          </div>

          {securityTestResult && (
            <div className="alert alert-warning d-flex align-items-center justify-content-between py-2 mb-3">
              <div>
                <strong>Kết quả kiểm tra bảo mật API (Đề 4):</strong> Khi gọi
                thẳng API hóa đơn của phòng khác, Server trả về{" "}
                <span className="badge bg-danger">
                  HTTP {securityTestResult.status}
                </span>{" "}
                — <em>{securityTestResult.message}</em>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSecurityTestResult(null)}
              />
            </div>
          )}

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt text-muted display-4 d-block mb-2"></i>
              <h5 className="fw-bold">Chưa có hóa đơn nào trong mục này</h5>
              <p className="text-muted small mb-3">
                Nếu bạn vừa tạo tài khoản mới, hãy bấm nút bên dưới để tạo mẫu
                Hợp đồng &amp; Bảng kê hóa đơn.
              </p>
              {!contract && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm fw-semibold"
                  onClick={() => handleQuickCreateContract()}
                >
                  <i className="bi bi-magic me-1"></i> Tạo Hợp đồng &amp; Hóa
                  đơn mẫu ngay
                </button>
              )}
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredInvoices.map((inv) => {
                const invId = inv._id || inv.id;
                const isExpanded =
                  String(expandedInvoiceId) === String(invId);
                const isUnpaid = inv.status !== "paid";
                const eUsage =
                  inv.electricityUsage ??
                  Math.max(0, (inv.newElectricity || 0) - (inv.oldElectricity || 0));
                const wUsage =
                  inv.waterUsage ??
                  Math.max(0, (inv.newWater || 0) - (inv.oldWater || 0));

                return (
                  <div
                    key={invId}
                    className="rounded-4 border overflow-hidden shadow-sm"
                    style={{
                      borderColor: isUnpaid ? "#fecaca" : "#e2e8f0",
                      background: "#ffffff",
                    }}
                  >
                    {/* Header của từng Hóa đơn */}
                    <div
                      className="p-3 p-md-4 d-flex flex-wrap justify-content-between align-items-center gap-3"
                      style={{
                        background: isUnpaid ? "#fff5f5" : "#f8fafc",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setExpandedInvoiceId(isExpanded ? null : invId)
                      }
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-3 d-flex flex-column align-items-center justify-content-center fw-bold"
                          style={{
                            width: 58,
                            height: 58,
                            background: isUnpaid ? "#dc2626" : "#0284c7",
                            color: "#fff",
                          }}
                        >
                          <span style={{ fontSize: 11, opacity: 0.9 }}>
                            THÁNG
                          </span>
                          <span style={{ fontSize: 18 }}>
                            {inv.month}/{String(inv.year).slice(-2)}
                          </span>
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="fw-bold fs-5 text-dark">
                              Hóa đơn Tháng {inv.month}/{inv.year}
                            </span>
                            <span className="badge bg-secondary-subtle text-secondary">
                              {inv.invoiceCode}
                            </span>
                            <StatusBadge type="invoice" status={inv.status} />
                          </div>
                          <div className="small text-muted mt-1">
                            Phòng:{" "}
                            <strong>
                              {inv.roomId?.title ||
                                roomInfo.title ||
                                "Phòng thuê"}
                            </strong>{" "}
                            · Hạn thanh toán:{" "}
                            <strong>
                              {formatDateVN(
                                inv.dueDate ||
                                  new Date(inv.year, inv.month - 1, 10)
                              )}
                            </strong>
                            {inv.paidAt && (
                              <span className="text-success ms-2">
                                (Đã thu ngày {formatDateVN(inv.paidAt)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="d-flex align-items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="text-end">
                          <div className="small text-muted">
                            Tổng cộng hóa đơn
                          </div>
                          <div className="fw-bold fs-4 text-danger">
                            {formatVND(inv.totalAmount)}
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                              setExpandedInvoiceId(isExpanded ? null : invId)
                            }
                          >
                            <i
                              className={`bi ${
                                isExpanded ? "bi-chevron-up" : "bi-chevron-down"
                              } me-1`}
                            ></i>
                            {isExpanded ? "Thu gọn" : "Chi tiết 4 khoản"}
                          </button>

                          {inv.status === "unpaid" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success fw-semibold"
                              onClick={() => setPayingInvoice(inv)}
                            >
                              <i className="bi bi-qr-code-scan me-1"></i>
                              Thanh toán
                            </button>
                          )}
                          {inv.status === "pending_confirmation" && (
                            <span className="badge bg-warning text-dark align-self-center">Chờ chủ trọ xác nhận</span>
                          )}

                          <Link
                            to={`/invoices/${invId}`}
                            className="btn btn-sm btn-primary"
                          >
                            <i className="bi bi-file-earmark-pdf me-1"></i>
                            Phiếu PDF
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* BẢNG BÓC TÁCH CHI TIẾT TỪNG KHOẢN (Mở rộng ngay bên dưới hóa đơn) */}
                    {isExpanded && (
                      <div className="p-3 p-md-4 border-top bg-white">
                        <div className="row g-3 mb-3">
                          <div className="col-sm-6 col-lg-3">
                            <div className="p-3 rounded-3 border bg-light h-100">
                              <div className="small text-muted">
                                1. Tiền phòng cố định
                              </div>
                              <div className="fw-bold fs-5 text-dark mt-1">
                                {formatVND(inv.roomPrice)}
                              </div>
                              <small className="text-secondary">
                                Theo hợp đồng (1 tháng)
                              </small>
                            </div>
                          </div>

                          <div className="col-sm-6 col-lg-3">
                            <div className="p-3 rounded-3 border bg-light h-100">
                              <div className="small text-muted">
                                2. Tiền điện ({eUsage} kWh)
                              </div>
                              <div className="fw-bold fs-5 text-warning-emphasis mt-1">
                                {formatVND(inv.electricityCost)}
                              </div>
                              <small className="text-secondary">
                                Chỉ số: {inv.oldElectricity} →{" "}
                                {inv.newElectricity} kWh (×
                                {formatVND(inv.electricityPrice)})
                              </small>
                            </div>
                          </div>

                          <div className="col-sm-6 col-lg-3">
                            <div className="p-3 rounded-3 border bg-light h-100">
                              <div className="small text-muted">
                                3. Tiền nước ({wUsage} m³)
                              </div>
                              <div className="fw-bold fs-5 text-primary mt-1">
                                {formatVND(inv.waterCost)}
                              </div>
                              <small className="text-secondary">
                                Chỉ số: {inv.oldWater} → {inv.newWater} m³ (×
                                {formatVND(inv.waterPrice)})
                              </small>
                            </div>
                          </div>

                          <div className="col-sm-6 col-lg-3">
                            <div className="p-3 rounded-3 border bg-light h-100">
                              <div className="small text-muted">
                                4. Phí dịch vụ chung
                              </div>
                              <div className="fw-bold fs-5 text-success mt-1">
                                {formatVND(inv.serviceFee)}
                              </div>
                              <small className="text-secondary">
                                Wifi, vệ sinh, rác, an ninh
                              </small>
                            </div>
                          </div>
                        </div>

                        <div className="table-responsive">
                          <table className="table table-bordered table-sm align-middle mb-2">
                            <thead className="table-light">
                              <tr>
                                <th>Khoản mục thanh toán</th>
                                <th className="text-center">Chỉ số cũ</th>
                                <th className="text-center">Chỉ số mới</th>
                                <th className="text-center">Sử dụng</th>
                                <th className="text-end">Đơn giá</th>
                                <th className="text-end">Thành tiền</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="fw-semibold">
                                  1. Tiền thuê phòng cố định
                                </td>
                                <td className="text-center">—</td>
                                <td className="text-center">—</td>
                                <td className="text-center">01 tháng</td>
                                <td className="text-end">
                                  {formatVND(inv.roomPrice)}
                                </td>
                                <td className="text-end fw-bold">
                                  {formatVND(inv.roomPrice)}
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-semibold">
                                  2. Tiền điện sinh hoạt
                                </td>
                                <td className="text-center">
                                  {inv.oldElectricity}
                                </td>
                                <td className="text-center">
                                  {inv.newElectricity}
                                </td>
                                <td className="text-center">{eUsage} kWh</td>
                                <td className="text-end">
                                  {formatVND(inv.electricityPrice)}/kWh
                                </td>
                                <td className="text-end fw-bold">
                                  {formatVND(inv.electricityCost)}
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-semibold">
                                  3. Tiền nước sinh hoạt
                                </td>
                                <td className="text-center">{inv.oldWater}</td>
                                <td className="text-center">{inv.newWater}</td>
                                <td className="text-center">{wUsage} m³</td>
                                <td className="text-end">
                                  {formatVND(inv.waterPrice)}/m³
                                </td>
                                <td className="text-end fw-bold">
                                  {formatVND(inv.waterCost)}
                                </td>
                              </tr>
                              <tr>
                                <td className="fw-semibold">
                                  4. Phí dịch vụ (Wifi, rác, vệ sinh chung)
                                </td>
                                <td className="text-center">—</td>
                                <td className="text-center">—</td>
                                <td className="text-center">Trọn gói</td>
                                <td className="text-end">
                                  {formatVND(inv.serviceFee)}
                                </td>
                                <td className="text-end fw-bold">
                                  {formatVND(inv.serviceFee)}
                                </td>
                              </tr>
                            </tbody>
                            <tfoot className="table-light">
                              <tr>
                                <td colSpan="5" className="text-end fw-bold">
                                  TỔNG CỘNG PHẢI THANH TOÁN:
                                </td>
                                <td className="text-end fw-bold fs-5 text-danger">
                                  {formatVND(inv.totalAmount)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        <div className="small text-secondary bg-light p-2 rounded-3">
                          <i className="bi bi-calculator me-1 text-primary"></i>
                          <strong>Công thức tính tự động tại Server:</strong>{" "}
                          {formatVND(inv.roomPrice)} + ({inv.newElectricity} -{" "}
                          {inv.oldElectricity}) ×{" "}
                          {formatVND(inv.electricityPrice)} + ({inv.newWater} -{" "}
                          {inv.oldWater}) × {formatVND(inv.waterPrice)} +{" "}
                          {formatVND(inv.serviceFee)} ={" "}
                          <strong className="text-danger">
                            {formatVND(inv.totalAmount)}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: GỬI YÊU CẦU SỬA CHỮA KÈM ẢNH & THEO DÕI TRẠNG THÁI
      ===================================================================== */}
      {activeTab === "repairs" && (
        <div className="row g-4">
          <div className="col-lg-5">
            <RepairRequestForm
              roomId={contract?.roomId?._id}
              onSubmitted={handleCreateRepair}
            />
          </div>

          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-clock-history me-2 text-primary" />
                Theo Dõi Tiến Độ Yêu Cầu Sửa Chữa (Mới → Đang xử lý → Xong)
              </h5>

              {repairs.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-tools display-5 d-block mb-2 opacity-50"></i>
                  <p className="mb-0">
                    Bạn chưa gửi yêu cầu sửa chữa nào. Hãy điền form bên trái
                    nếu thiết bị trong phòng gặp sự cố.
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {repairs.map((req) => (
                    <div
                      key={req._id}
                      className="p-3 rounded-4 border bg-light"
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
                      <div className="d-flex align-items-center gap-2 mt-2 small">
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

      {/* Modal Thanh Toán Hóa Đơn QR / Chuyển Khoản */}
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
              <h5 className="fw-bold mb-0 text-primary">
                <i className="bi bi-qr-code-scan me-2"></i>
                Thanh Toán Hóa Đơn Tháng {payingInvoice.month}/
                {payingInvoice.year}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setPayingInvoice(null)}
              ></button>
            </div>

            <div className="p-3 rounded-3 bg-light border mb-3 text-start small">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Mã hóa đơn:</span>
                <strong>{payingInvoice.invoiceCode}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Nội dung CK:</span>
                <strong className="text-primary">
                  TT {payingInvoice.invoiceCode}
                </strong>
              </div>
              <div className="d-flex justify-content-between border-top pt-2 mt-2">
                <span className="fw-bold">Tổng số tiền:</span>
                <strong className="text-danger fs-5">
                  {formatVND(payingInvoice.totalAmount)}
                </strong>
              </div>
            </div>

            <div className="p-3 border rounded-4 mb-3 bg-white d-inline-block mx-auto">
              <img
                src={`https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${
                  payingInvoice.totalAmount
                }&addInfo=${encodeURIComponent(
                  `TT ${payingInvoice.invoiceCode}`
                )}`}
                alt="VietQR Thanh toán"
                style={{ width: 210, height: 210, objectFit: "contain" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="small text-muted mt-1">
                Quét mã VietQR, sau đó gửi yêu cầu để chủ trọ xác nhận khoản tiền đã nhận
              </div>
            </div>

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
              >
                <i className="bi bi-send me-1"></i> Gửi yêu cầu xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
