import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest, formatVND, formatDateVN } from "../api/apiClient";
import { StatusBadge } from "../components/common/StatusBadge";
import "../styles/tenant.css";

const InvoiceItem = ({ number, title, detail, quantity, unit, amount }) => (
  <tr>
    <td className="invoice-item-name"><span className="invoice-item-index">{number}</span><span><strong>{title}</strong>{detail && <small className="d-block text-muted mt-1">{detail}</small>}</span></td>
    <td className="text-center text-nowrap" data-label="Số lượng">{quantity}</td>
    <td className="text-end text-nowrap" data-label="Đơn giá">{unit}</td>
    <td className="text-end text-nowrap fw-semibold" data-label="Thành tiền">{formatVND(amount)}</td>
  </tr>
);

export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    apiRequest(`/invoices/${id}`)
      .then((res) => { if (isMounted) { setInvoice(res.data.invoice); setError(null); } })
      .catch((err) => { if (isMounted) { setError(err.message); setErrorStatus(err.status); } })
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-primary" role="status" /><p className="mt-2 text-muted">Đang tải hóa đơn…</p></div>;
  if (error) return <div className="container py-5"><div className="card border-danger shadow-sm rounded-4 p-4 text-center"><i className="bi bi-receipt-cutoff text-danger display-4 mb-2"/><h4 className="fw-bold">{errorStatus === 403 ? "Bạn không có quyền xem hóa đơn này" : "Không thể tải hóa đơn"}</h4><p className="text-secondary">{error}</p><button type="button" className="btn btn-primary align-self-center" onClick={() => navigate(-1)}><i className="bi bi-arrow-left me-1"/>Quay lại</button></div></div>;
  if (!invoice) return null;

  const isPaid = invoice.status === "paid";
  const paidAmount = isPaid ? Number(invoice.totalAmount) || 0 : 0;
  const remainingAmount = Math.max(0, (Number(invoice.totalAmount) || 0) - paidAmount);
  const room = invoice.roomId || {};
  const tenant = invoice.tenantId || invoice.contractId || {};
  const landlord = invoice.landlordId || {};

  return (
    <main className="container py-4 invoice-page">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3 d-print-none">
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}><i className="bi bi-arrow-left me-1"/>Quay lại</button>
        <div className="d-flex flex-wrap gap-2">
          {user?.role === "user" && invoice.status === "unpaid" && invoice.paymentConfirmationStatus !== "pending" && <button type="button" className="btn btn-success fw-semibold" onClick={() => navigate(`/tenant/my-room?pay=${encodeURIComponent(invoice._id || id)}`)}><i className="bi bi-credit-card me-1"/>Thanh toán ngay</button>}
          {user?.role === "user" && (invoice.paymentConfirmationStatus === "pending" || invoice.status === "pending_confirmation") && <span className="btn btn-outline-warning disabled">Đang chờ chủ trọ xác nhận</span>}
          <button type="button" className="btn btn-primary fw-semibold" onClick={() => window.print()}><i className="bi bi-printer me-1"/>In / Lưu PDF</button>
        </div>
      </div>

      <article className="invoice-receipt card border-0 shadow-sm rounded-4">
        <div className="invoice-heading">
          <div><span className="invoice-eyebrow">RIPT RENTAL · CHỨNG TỪ THANH TOÁN</span><h1>Phiếu báo tiền trọ hàng tháng</h1><p>Mã hóa đơn <strong>{invoice.invoiceCode || "—"}</strong></p></div>
          <div className="invoice-period"><span>Kỳ thanh toán</span><strong>{String(invoice.month).padStart(2, "0")}/{invoice.year}</strong><StatusBadge type="invoice" status={invoice.status}/></div>
        </div>

        <section className="invoice-parties" aria-label="Thông tin hóa đơn">
          <div><span className="invoice-label">NGƯỜI CHO THUÊ</span><strong>{landlord.name || "Chưa cập nhật"}</strong><span>{landlord.phone || landlord.email || ""}</span><span>{room.blockId?.address || room.district || ""}</span></div>
          <div><span className="invoice-label">NGƯỜI THUÊ</span><strong>{tenant.name || tenant.tenantName || "Chưa cập nhật"}</strong><span>{tenant.email || tenant.tenantEmail || ""}</span><span>{room.roomNumber ? `Phòng ${room.roomNumber}` : room.title || "Phòng thuê"}</span></div>
          <div className="invoice-dates"><span>Ngày phát hành <strong>{formatDateVN(invoice.createdAt)}</strong></span><span>Hạn thanh toán <strong>{formatDateVN(invoice.dueDate)}</strong></span></div>
        </section>

        <section className="invoice-total-panel" aria-label="Tình trạng thanh toán">
          <div><span>Tổng tiền hóa đơn</span><strong>{formatVND(invoice.totalAmount)}</strong></div>
          <div><span>Đã xác nhận thanh toán</span><strong>{formatVND(paidAmount)}</strong></div>
          <div><span>Còn phải thanh toán</span><strong className={remainingAmount ? "invoice-balance" : "text-success"}>{formatVND(remainingAmount)}</strong></div>
        </section>

        <section className="invoice-lines">
          <h2>Chi tiết khoản thu</h2>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <colgroup><col className="invoice-col-item"/><col className="invoice-col-qty"/><col className="invoice-col-unit"/><col className="invoice-col-total"/></colgroup>
              <thead><tr><th>Khoản thu</th><th className="text-center">Số lượng</th><th className="text-end">Đơn giá</th><th className="text-end">Thành tiền</th></tr></thead>
              <tbody>
                <InvoiceItem number="01" title="Tiền thuê phòng" quantity="1 tháng" unit={formatVND(invoice.roomPrice)} amount={invoice.roomPrice}/>
                <InvoiceItem number="02" title="Điện" detail={`Chỉ số ${invoice.oldElectricity} → ${invoice.newElectricity} kWh`} quantity={`${invoice.electricityUsage ?? Math.max(0, invoice.newElectricity - invoice.oldElectricity)} kWh`} unit={invoice.useTieredElectricity ? "Theo bậc thang" : `${formatVND(invoice.electricityPrice)}/kWh`} amount={invoice.electricityCost}/>
                <InvoiceItem number="03" title="Nước" detail={`Chỉ số ${invoice.oldWater} → ${invoice.newWater} m³`} quantity={`${invoice.waterUsage ?? Math.max(0, invoice.newWater - invoice.oldWater)} m³`} unit={`${formatVND(invoice.waterPrice)}/m³`} amount={invoice.waterCost}/>
                <InvoiceItem number="04" title="Phí dịch vụ" quantity="1 kỳ" unit={formatVND(invoice.serviceFee)} amount={invoice.serviceFee}/>
              </tbody>
              <tfoot><tr><th colSpan="3" className="text-end">Tổng cộng</th><th className="text-end invoice-grand-total">{formatVND(invoice.totalAmount)}</th></tr></tfoot>
            </table>
          </div>
        </section>

        <section className="invoice-footer" aria-label="Ghi chú và trạng thái">
          <div><strong>Trạng thái:</strong> <StatusBadge type="invoice" status={invoice.status}/>{invoice.paidAt && <span className="ms-2 text-muted">Xác nhận ngày {formatDateVN(invoice.paidAt)}</span>}</div>
          {invoice.paymentConfirmationStatus === "pending" && <div className="alert alert-warning mt-3 mb-0"><i className="bi bi-hourglass-split me-2"/>Đã gửi yêu cầu xác nhận chuyển khoản. Hóa đơn vẫn chưa được thanh toán cho đến khi chủ trọ xác nhận.</div>}
          {invoice.paymentConfirmationStatus === "rejected" && <div className="alert alert-danger mt-3 mb-0">Yêu cầu xác nhận chưa được chấp thuận.{invoice.paymentRejectionReason ? ` Lý do: ${invoice.paymentRejectionReason}` : " Vui lòng kiểm tra giao dịch hoặc liên hệ chủ trọ."}</div>}
          {invoice.note && <p><strong>Ghi chú:</strong> {invoice.note}</p>}
          <p>Số liệu và khoản thu được lấy từ hóa đơn đã phát hành trên hệ thống.</p>
        </section>
      </article>
    </main>
  );
};
