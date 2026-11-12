import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  fetchInvoices,
  markInvoicePaidThunk,
  sendReminderThunk,
} from "../../store/slices/invoiceSlice";
import { formatVND } from "../../api/apiClient";
import { StatusBadge } from "../../components/common/StatusBadge";

export const LandlordInvoicesPage = () => {
  const dispatch = useDispatch();
  const { invoices, loading } = useSelector((state) => state.invoices);
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [notice, setNotice] = useState("");

  const loadInvoices = () => {
    dispatch(
      fetchInvoices({
        status: statusFilter,
        month: monthFilter || undefined,
      })
    );
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, monthFilter]);

  const handleMarkPaid = async (id) => {
    await dispatch(markInvoicePaidThunk(id)).unwrap();
    setNotice("Đã đánh dấu thu tiền hóa đơn!");
  };

  const handleRemind = async (id) => {
    try {
      const res = await dispatch(sendReminderThunk(id)).unwrap();
      setNotice(res.message);
    } catch (err) {
      setNotice(`Lỗi: ${err}`);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-receipt-cutoff me-2 text-primary" />
            Quản Lý Hóa Đơn Hàng Tháng ({invoices.length})
          </h4>
          <p className="text-muted small mb-0">
            Mỗi phòng chỉ có 1 hóa đơn mỗi tháng. Hỗ trợ đánh dấu đã thu tiền, gửi email nhắc nợ và xuất PDF.
          </p>
        </div>

        <Link to="/landlord/meters" className="btn btn-primary fw-semibold">
          <i className="bi bi-plus-circle me-1" /> Phát Hành Từ Bảng Điện Nước
        </Link>
      </div>

      {notice && (
        <div className="alert alert-info alert-dismissible fade show py-2 small">
          {notice}
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotice("")}
          />
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="btn-group btn-group-sm">
            {[
              { key: "all", label: "Tất cả" },
              { key: "unpaid", label: "Chưa thu (Nợ tiền)" },
              { key: "paid", label: "Đã thu tiền" },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                className={`btn ${
                  statusFilter === st.key
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() => setStatusFilter(st.key)}
              >
                {st.label}
              </button>
            ))}
          </div>

          <select
            className="form-select form-select-sm"
            style={{ width: "160px" }}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="">Tất cả các tháng</option>
            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}/2026
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Mã HĐ</th>
                  <th>Phòng</th>
                  <th>Kỳ</th>
                  <th className="text-end">Tiền phòng</th>
                  <th className="text-end">Điện</th>
                  <th className="text-end">Nước</th>
                  <th className="text-end">Dịch vụ</th>
                  <th className="text-end">Tổng cộng</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-muted">
                      Không có hóa đơn nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="fw-bold">{inv.invoiceCode}</td>
                      <td>
                        <div className="fw-semibold">
                          {inv.roomId?.roomNumber
                            ? `[${inv.roomId.roomNumber}] `
                            : ""}
                          {inv.roomId?.title}
                        </div>
                        <small className="text-muted">
                          {inv.tenantId?.name || inv.contractId?.tenantName}
                        </small>
                      </td>
                      <td>
                        T{inv.month}/{inv.year}
                      </td>
                      <td className="text-end">{formatVND(inv.roomPrice)}</td>
                      <td className="text-end">
                        {formatVND(inv.electricityCost)}
                        <small className="d-block text-muted">
                          {inv.electricityUsage} kWh
                        </small>
                      </td>
                      <td className="text-end">
                        {formatVND(inv.waterCost)}
                        <small className="d-block text-muted">
                          {inv.waterUsage} m³
                        </small>
                      </td>
                      <td className="text-end">{formatVND(inv.serviceFee)}</td>
                      <td className="text-end fw-bold text-danger">
                        {formatVND(inv.totalAmount)}
                      </td>
                      <td>
                        <StatusBadge type="invoice" status={inv.status} />
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {inv.status === "unpaid" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => handleMarkPaid(inv._id)}
                                title="Đánh dấu đã thu tiền"
                              >
                                <i className="bi bi-check2-circle" /> Thu tiền
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-warning text-dark"
                                onClick={() => handleRemind(inv._id)}
                                title="Gửi email nhắc nợ"
                              >
                                <i className="bi bi-envelope" />
                              </button>
                            </>
                          )}
                          <Link
                            to={`/invoices/${inv._id}`}
                            className="btn btn-outline-primary"
                            title="Xem chi tiết & Xuất PDF"
                          >
                            <i className="bi bi-file-earmark-pdf" /> PDF
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
