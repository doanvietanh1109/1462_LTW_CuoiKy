import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest, formatVND, formatDateVN } from "../api/apiClient";
import { StatusBadge } from "../components/common/StatusBadge";

// Trang chi tiết hóa đơn (/invoices/:id) dùng useParams + hỗ trợ Xuất/In PDF (Tính năng nâng cao)
export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiRequest(`/invoices/${id}`)
      .then((res) => {
        if (isMounted) {
          setInvoice(res.data.invoice);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setErrorStatus(err.status);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <p className="mt-2 text-muted">Đang tải chi tiết hóa đơn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="card border-danger shadow-sm rounded-4 p-4 text-center">
          <i className="bi bi-shield-lock-fill text-danger display-4 mb-2" />
          <h4 className="fw-bold text-danger">
            {errorStatus === 403 ? "403 Forbidden - Từ Chối Truy Cập" : "Lỗi Tải Hóa Đơn"}
          </h4>
          <p className="text-secondary">{error}</p>
          <div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-1" /> Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="container py-4" style={{ maxWidth: "820px" }}>
      <div className="d-flex justify-content-between align-items-center mb-3 d-print-none">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left me-1" /> Quay lại
        </button>

        <button
          type="button"
          className="btn btn-primary fw-semibold"
          onClick={() => window.print()}
        >
          <i className="bi bi-file-earmark-pdf-fill me-1" />
          Xuất PDF / In Hóa Đơn
        </button>
      </div>

      <div className="card border-0 shadow rounded-4 p-4 p-md-5">
        <div className="d-flex flex-wrap justify-content-between align-items-start border-bottom pb-3 mb-4">
          <div>
            <h3 className="fw-bold text-primary mb-1">
              PHIẾU BÁO TIỀN TRỌ HÀNG THÁNG
            </h3>
            <div className="text-muted small">
              Mã hóa đơn: <strong>{invoice.invoiceCode}</strong> | Kỳ thanh toán:{" "}
              <strong>
                Tháng {invoice.month}/{invoice.year}
              </strong>
            </div>
          </div>
          <div className="text-end">
            <StatusBadge type="invoice" status={invoice.status} />
            {invoice.paidAt && (
              <div className="small text-success mt-1">
                Ngày thu: {formatDateVN(invoice.paidAt)}
              </div>
            )}
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="p-3 rounded-3 bg-light h-100">
              <div className="small text-muted text-uppercase fw-semibold">
                Thông tin phòng
              </div>
              <div className="fw-bold fs-5 mt-1">
                {invoice.roomId?.roomNumber
                  ? `[${invoice.roomId.roomNumber}] `
                  : ""}
                {invoice.roomId?.title}
              </div>
              <div className="small text-secondary">
                Khu vực: {invoice.roomId?.district}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="p-3 rounded-3 bg-light h-100">
              <div className="small text-muted text-uppercase fw-semibold">
                Người thuê đại diện
              </div>
              <div className="fw-bold fs-5 mt-1">
                {invoice.tenantId?.name ||
                  invoice.contractId?.tenantName ||
                  "Người thuê"}
              </div>
              <div className="small text-secondary">
                Email:{" "}
                {invoice.tenantId?.email || invoice.contractId?.tenantEmail}
              </div>
            </div>
          </div>
        </div>

        <h6 className="fw-bold text-uppercase text-secondary mb-2">
          Chi tiết từng khoản thanh toán
        </h6>
        <div className="table-responsive mb-4">
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Khoản mục</th>
                <th className="text-center">Chỉ số cũ</th>
                <th className="text-center">Chỉ số mới</th>
                <th className="text-center">Sử dụng</th>
                <th className="text-end">Đơn giá</th>
                <th className="text-end">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-semibold">1. Tiền thuê phòng cố định</td>
                <td className="text-center">-</td>
                <td className="text-center">-</td>
                <td className="text-center">1 tháng</td>
                <td className="text-end">{formatVND(invoice.roomPrice)}</td>
                <td className="text-end fw-bold">{formatVND(invoice.roomPrice)}</td>
              </tr>
              <tr>
                <td className="fw-semibold">
                  2. Tiền điện{" "}
                  {invoice.useTieredElectricity && (
                    <span className="badge bg-info text-dark ms-1">
                      Giá bậc thang
                    </span>
                  )}
                </td>
                <td className="text-center">{invoice.oldElectricity}</td>
                <td className="text-center">{invoice.newElectricity}</td>
                <td className="text-center">{invoice.electricityUsage} kWh</td>
                <td className="text-end">
                  {invoice.useTieredElectricity
                    ? "Bậc thang"
                    : `${formatVND(invoice.electricityPrice)}/kWh`}
                </td>
                <td className="text-end fw-bold">
                  {formatVND(invoice.electricityCost)}
                </td>
              </tr>
              <tr>
                <td className="fw-semibold">3. Tiền nước sinh hoạt</td>
                <td className="text-center">{invoice.oldWater}</td>
                <td className="text-center">{invoice.newWater}</td>
                <td className="text-center">{invoice.waterUsage} m³</td>
                <td className="text-end">{formatVND(invoice.waterPrice)}/m³</td>
                <td className="text-end fw-bold">{formatVND(invoice.waterCost)}</td>
              </tr>
              <tr>
                <td className="fw-semibold">
                  4. Phí dịch vụ (Rác, Wifi, Vệ sinh chung)
                </td>
                <td className="text-center">-</td>
                <td className="text-center">-</td>
                <td className="text-center">1 tháng</td>
                <td className="text-end">{formatVND(invoice.serviceFee)}</td>
                <td className="text-end fw-bold">{formatVND(invoice.serviceFee)}</td>
              </tr>
            </tbody>
            <tfoot className="table-light">
              <tr>
                <td colSpan="5" className="text-end fw-bold fs-5">
                  TỔNG CỘNG PHẢI THANH TOÁN:
                </td>
                <td className="text-end fw-bold fs-5 text-danger">
                  {formatVND(invoice.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-3 rounded-3 bg-light small text-secondary">
          <strong>Công thức tính tại Server:</strong> Tiền phòng (
          {formatVND(invoice.roomPrice)}) + Điện ({invoice.newElectricity} -{" "}
          {invoice.oldElectricity}) × {formatVND(invoice.electricityPrice)} + Nước (
          {invoice.newWater} - {invoice.oldWater}) ×{" "}
          {formatVND(invoice.waterPrice)} + Phí dịch vụ (
          {formatVND(invoice.serviceFee)}) ={" "}
          <strong className="text-danger">{formatVND(invoice.totalAmount)}</strong>
        </div>
      </div>
    </div>
  );
};
