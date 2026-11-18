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
import { useDebounce } from "../../hooks/useDebounce";
import { apiRequest } from "../../api/apiClient";
import { useAuth } from "../../contexts/AuthContext";
import { validateBankAccount } from "../../utils/bankAccountValidation";

const SUGGESTED_ACB_ACCOUNT = {
  bankBin: "970416",
  bankName: "ACB",
  accountNumber: "20129811",
  accountName: "Đoàn Việt Anh",
};

export const LandlordInvoicesPage = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { invoices, loading, pagination } = useSelector((state) => state.invoices);
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [searchText, setSearchText] = useState("");
  const search = useDebounce(searchText, 300);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const [bankOptions, setBankOptions] = useState([]);
  const [bankForm, setBankForm] = useState({ bankBin: "", bankName: "", accountNumber: "", accountName: "" });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankFieldErrors, setBankFieldErrors] = useState({});

  useEffect(() => {
    Promise.all([apiRequest("/users/bank-options"), apiRequest("/users/me/bank-account")]).then(([banks, account]) => {
      setBankOptions(banks?.data?.banks || []);
      if (account?.data?.bankAccount) setBankForm(account.data.bankAccount);
      else if (user?.name?.trim().toLocaleLowerCase("vi") === SUGGESTED_ACB_ACCOUNT.accountName.toLocaleLowerCase("vi")) setBankForm(SUGGESTED_ACB_ACCOUNT);
    }).catch(() => setNotice("Không tải được cấu hình ngân hàng. Hãy thử tải lại trang."));
  }, [user?.name]);

  const saveBankAccount = async (event) => {
    event.preventDefault();
    const fieldErrors = validateBankAccount(bankForm);
    setBankFieldErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) {
      setNotice("Vui lòng kiểm tra các trường được đánh dấu trong biểu mẫu.");
      return;
    }
    setBankSaving(true);
    try { await apiRequest("/users/me/bank-account", { method: "PATCH", body: bankForm }); setNotice("Đã lưu tài khoản nhận tiền."); }
    catch (error) {
      const serverFieldErrors = error.details?.fieldErrors;
      if (serverFieldErrors) setBankFieldErrors(serverFieldErrors);
      setNotice(error.message || "Không lưu được tài khoản ngân hàng.");
    }
    finally { setBankSaving(false); }
  };

  const updateBankField = (field, value, extra = {}) => {
    const nextForm = { ...bankForm, ...extra, [field]: value };
    setBankForm(nextForm);
    setBankFieldErrors((current) => ({ ...current, [field]: undefined, ...(field === "bankBin" ? { bankName: undefined } : {}) }));
    setNotice("");
  };

  const reviewPayment = async (id, approve) => {
    const body = {};
    if (approve && !window.confirm("Tôi xác nhận đã kiểm tra tài khoản ngân hàng và thực sự nhận được số tiền thanh toán cho hóa đơn này.")) return;
    if (!approve) {
      const reason = window.prompt("Lý do từ chối yêu cầu (không bắt buộc):", "");
      if (reason === null) return;
      body.reason = reason;
    }
    try { await apiRequest(`/invoices/${id}/${approve ? "pay" : "payment-reject"}`, { method: "PATCH", ...(Object.keys(body).length ? { body } : {}) }); setNotice(approve ? "Đã xác nhận đã nhận tiền." : "Đã từ chối yêu cầu; hóa đơn trở lại trạng thái chưa thanh toán."); loadInvoices(); }
    catch (error) { setNotice(error.message || "Không xử lý được yêu cầu."); }
  };

  const loadInvoices = () => {
    dispatch(
      fetchInvoices({
        status: statusFilter,
        month: monthFilter || undefined,
        year: yearFilter || undefined,
        search: search || undefined,
        page,
        limit: 20,
      })
    );
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, monthFilter, yearFilter, search, page]);

  const handleMarkPaid = async (id) => {
    if (!window.confirm("Tôi xác nhận đã thực sự nhận đủ khoản tiền mặt cho hóa đơn này.")) return;
    try { await dispatch(markInvoicePaidThunk(id)).unwrap(); setNotice("Đã ghi nhận thanh toán tiền mặt."); }
    catch (error) { setNotice(`Không ghi nhận được thanh toán: ${error}`); }
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
            Quản Lý Hóa Đơn Hàng Tháng ({pagination.total})
          </h4>
          <p className="text-muted small mb-0">
            Mỗi phòng chỉ có 1 hóa đơn mỗi tháng. Theo dõi thanh toán và công nợ; email nhắc nợ chưa được cấu hình.
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

      <form className="card border-0 shadow-sm rounded-4 p-3 mb-3" noValidate onSubmit={saveBankAccount}>
        <h6 className="fw-bold">Tài khoản nhận tiền VietQR</h6>
        <p className="small text-muted mb-2">Thông tin này chỉ dùng cho hóa đơn thuộc chủ trọ của bạn.</p>
        <div className="row g-2 align-items-end">
          <div className="col-md-3"><label className="form-label small" htmlFor="bank-account-bank">Ngân hàng</label><select id="bank-account-bank" className={`form-select ${bankFieldErrors.bankBin ? "is-invalid" : ""}`} value={bankForm.bankBin} aria-invalid={Boolean(bankFieldErrors.bankBin)} aria-describedby={bankFieldErrors.bankBin ? "bank-account-bank-error" : undefined} onChange={(e) => { const bank = bankOptions.find((item) => item.bin === e.target.value); updateBankField("bankBin", e.target.value, { bankName: bank?.shortName || bank?.name || "" }); }}><option value="">Chọn ngân hàng</option>{bankOptions.map((bank) => <option key={bank.bin} value={bank.bin}>{bank.shortName || bank.name}</option>)}</select>{bankFieldErrors.bankBin && <div id="bank-account-bank-error" className="invalid-feedback d-block">{bankFieldErrors.bankBin}</div>}</div>
          <div className="col-md-3"><label className="form-label small" htmlFor="bank-account-number">Số tài khoản</label><input id="bank-account-number" type="text" inputMode="text" autoComplete="off" maxLength={19} className={`form-control ${bankFieldErrors.accountNumber ? "is-invalid" : ""}`} value={bankForm.accountNumber} aria-invalid={Boolean(bankFieldErrors.accountNumber)} aria-describedby={bankFieldErrors.accountNumber ? "bank-account-number-error" : undefined} onChange={(e) => updateBankField("accountNumber", e.target.value)}/>{bankFieldErrors.accountNumber && <div id="bank-account-number-error" className="invalid-feedback d-block">{bankFieldErrors.accountNumber}</div>}</div>
          <div className="col-md-4"><label className="form-label small" htmlFor="bank-account-name">Tên chủ tài khoản</label><input id="bank-account-name" type="text" autoComplete="name" maxLength={50} className={`form-control ${bankFieldErrors.accountName ? "is-invalid" : ""}`} value={bankForm.accountName} aria-invalid={Boolean(bankFieldErrors.accountName)} aria-describedby={bankFieldErrors.accountName ? "bank-account-name-error" : undefined} onChange={(e) => updateBankField("accountName", e.target.value)}/>{bankFieldErrors.accountName && <div id="bank-account-name-error" className="invalid-feedback d-block">{bankFieldErrors.accountName}</div>}</div>
          <div className="col-md-2"><button className="btn btn-primary w-100" disabled={bankSaving || bankOptions.length === 0}>{bankSaving ? "Đang lưu…" : "Lưu tài khoản"}</button></div>
        </div>
      </form>

      <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="btn-group btn-group-sm">
            {[
              { key: "all", label: "Tất cả" },
              { key: "unpaid", label: "Chưa thu (Nợ tiền)" },
              { key: "pending_confirmation", label: "Chờ xác nhận" },
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
                onClick={() => { setStatusFilter(st.key); setPage(1); }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <select
            className="form-select form-select-sm"
            style={{ width: "160px" }}
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả các tháng</option>
            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}/{yearFilter}
              </option>
            ))}
          </select>
          <select className="form-select form-select-sm" style={{ width: "120px" }} value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setPage(1); }} aria-label="Lọc theo năm">
            {Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index).map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
          <input className="form-control form-control-sm" style={{ width: "220px" }} type="search" value={searchText} onChange={(e) => { setSearchText(e.target.value); setPage(1); }} placeholder="Tìm mã hóa đơn" aria-label="Tìm mã hóa đơn" />
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
                        {(inv.paymentConfirmationStatus === "pending" || inv.status === "pending_confirmation") && <small className="d-block text-warning-emphasis mt-1">Chờ xác nhận · {inv.paymentSubmittedAt ? new Date(inv.paymentSubmittedAt).toLocaleString("vi-VN") : ""}</small>}
                        {inv.paymentConfirmationStatus === "rejected" && <small className="d-block text-danger mt-1">Yêu cầu bị từ chối</small>}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {inv.status !== "paid" && inv.paymentConfirmationStatus !== "pending" && inv.status !== "pending_confirmation" && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => handleMarkPaid(inv._id)}
                                title="Xác nhận đã nhận tiền"
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
                          {(inv.paymentConfirmationStatus === "pending" || inv.status === "pending_confirmation") && <><button type="button" className="btn btn-success" onClick={() => reviewPayment(inv._id, true)} title="Xác nhận tiền đã thực nhận"><i className="bi bi-check2-circle"/> Xác nhận</button><button type="button" className="btn btn-outline-danger" onClick={() => reviewPayment(inv._id, false)} title="Từ chối yêu cầu"><i className="bi bi-x-circle"/> Từ chối</button></>}
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
      {!loading && pagination.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="small text-muted">Trang {pagination.page}/{pagination.totalPages} · {pagination.total} hóa đơn</span>
          <div className="btn-group btn-group-sm">
            <button type="button" className="btn btn-outline-primary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Trước</button>
            <button type="button" className="btn btn-outline-primary" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Sau</button>
          </div>
        </div>
      )}
    </div>
  );
};
