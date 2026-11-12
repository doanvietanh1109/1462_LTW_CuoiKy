import React, { useState, useEffect } from "react";
import { apiRequest, formatVND } from "../../api/apiClient";

export const ContractModal = ({
  show,
  onClose,
  onSave,
  rooms = [],
  preselectedRoom = null,
}) => {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    roomId: "",
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    identityCard: "",
    startDate: today,
    endDate: "",
    rentPrice: 2500000,
    deposit: 2500000,
    electricityPrice: 3500,
    waterPrice: 15000,
    serviceFee: 100000,
    initialElectricity: 0,
    initialWater: 0,
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchingUser, setSearchingUser] = useState(false);

  useEffect(() => {
    const targetRoom =
      preselectedRoom || rooms.find((r) => r.status === "available") || rooms[0];

    if (targetRoom) {
      setForm((prev) => ({
        ...prev,
        roomId: targetRoom._id,
        rentPrice: targetRoom.price || 2500000,
        deposit: targetRoom.price || 2500000,
        electricityPrice: targetRoom.electricityPrice || 3500,
        waterPrice: targetRoom.waterPrice || 15000,
        serviceFee: targetRoom.serviceFee || 100000,
        initialElectricity: targetRoom.currentElectricity || 0,
        initialWater: targetRoom.currentWater || 0,
      }));
    }
    setErrors({});
    setServerError("");
  }, [preselectedRoom, rooms, show]);

  if (!show) return null;

  const handleRoomSelect = (roomId) => {
    const room = rooms.find((r) => r._id === roomId);
    setForm((prev) => ({
      ...prev,
      roomId,
      rentPrice: room ? room.price : prev.rentPrice,
      deposit: room ? room.price : prev.deposit,
      electricityPrice: room?.electricityPrice ?? 3500,
      waterPrice: room?.waterPrice ?? 15000,
      serviceFee: room?.serviceFee ?? 100000,
      initialElectricity: room?.currentElectricity ?? 0,
      initialWater: room?.currentWater ?? 0,
    }));
  };

  const handleLookupByEmail = async () => {
    if (!form.tenantEmail.trim()) return;
    setSearchingUser(true);
    try {
      const res = await apiRequest(
        `/users/search/email?email=${encodeURIComponent(form.tenantEmail.trim())}`
      );
      if (res.data?.user) {
        setForm((prev) => ({
          ...prev,
          tenantName: res.data.user.name || prev.tenantName,
          tenantPhone: res.data.user.phone || prev.tenantPhone || "0912345678",
        }));
      }
    } catch {
      // Nếu chưa có tài khoản, hệ thống sẽ tự tạo tài khoản mới khi lưu hợp đồng
    } finally {
      setSearchingUser(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.roomId) errs.roomId = "Vui lòng chọn phòng";
    if (!form.tenantName.trim()) errs.tenantName = "Họ tên người thuê là bắt buộc";
    if (!form.tenantEmail.trim()) {
      errs.tenantEmail = "Email người thuê là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.tenantEmail.trim())) {
      errs.tenantEmail = "Email không hợp lệ";
    }
    if (!form.tenantPhone.trim())
      errs.tenantPhone = "Số điện thoại người thuê là bắt buộc";
    if (!form.startDate) errs.startDate = "Ngày bắt đầu hợp đồng là bắt buộc";
    if (form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      errs.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError("");
    try {
      await onSave({
        ...form,
        rentPrice: Number(form.rentPrice),
        deposit: Number(form.deposit),
        electricityPrice: Number(form.electricityPrice),
        waterPrice: Number(form.waterPrice),
        serviceFee: Number(form.serviceFee),
        initialElectricity: Number(form.initialElectricity),
        initialWater: Number(form.initialWater),
      });
      onClose();
    } catch (err) {
      setServerError(err.message || "Không thể tạo hợp đồng");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-file-earmark-plus me-2 text-primary" />
              Tạo Hợp Đồng Thuê Phòng Mới
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {serverError && (
                <div className="alert alert-danger py-2 small">
                  <i className="bi bi-exclamation-octagon-fill me-1" />
                  {serverError}
                </div>
              )}

              <div className="row g-3">
                <div className="col-12">
                  <label htmlFor="ct-room" className="form-label fw-semibold">
                    Chọn phòng gán hợp đồng *
                  </label>
                  <select
                    id="ct-room"
                    name="roomId"
                    className={`form-select ${errors.roomId ? "is-invalid" : ""}`}
                    value={form.roomId}
                    onChange={(e) => handleRoomSelect(e.target.value)}
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.roomNumber ? `[${r.roomNumber}] ` : ""}
                        {r.title} - {formatVND(r.price)} (
                        {r.status === "available"
                          ? "Trống"
                          : r.status === "rented"
                          ? "Đang thuê - Có HĐ hiệu lực"
                          : "Đang sửa"}
                        )
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Lưu ý Đề 4: Nếu chọn phòng đang có hợp đồng hiệu lực, hệ thống
                    Server sẽ từ chối tạo hợp đồng mới.
                  </div>
                  {errors.roomId && (
                    <div className="invalid-feedback">{errors.roomId}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-email" className="form-label fw-semibold">
                    Email người thuê *
                  </label>
                  <div className="input-group">
                    <input
                      id="ct-email"
                      name="tenantEmail"
                      type="email"
                      className={`form-control ${
                        errors.tenantEmail ? "is-invalid" : ""
                      }`}
                      placeholder="VD: user@example.com"
                      value={form.tenantEmail}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleLookupByEmail}
                      disabled={searchingUser}
                    >
                      <i className="bi bi-search" /> Tìm TK
                    </button>
                  </div>
                  {errors.tenantEmail && (
                    <div className="text-danger small mt-1">
                      {errors.tenantEmail}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-name" className="form-label fw-semibold">
                    Họ và tên người thuê *
                  </label>
                  <input
                    id="ct-name"
                    name="tenantName"
                    type="text"
                    className={`form-control ${
                      errors.tenantName ? "is-invalid" : ""
                    }`}
                    placeholder="VD: Nguyễn Văn An"
                    value={form.tenantName}
                    onChange={handleChange}
                  />
                  {errors.tenantName && (
                    <div className="invalid-feedback">{errors.tenantName}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-phone" className="form-label fw-semibold">
                    Số điện thoại *
                  </label>
                  <input
                    id="ct-phone"
                    name="tenantPhone"
                    type="tel"
                    className={`form-control ${
                      errors.tenantPhone ? "is-invalid" : ""
                    }`}
                    placeholder="VD: 0912345678"
                    value={form.tenantPhone}
                    onChange={handleChange}
                  />
                  {errors.tenantPhone && (
                    <div className="invalid-feedback">{errors.tenantPhone}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-cccd" className="form-label fw-semibold">
                    Số CCCD / CMND
                  </label>
                  <input
                    id="ct-cccd"
                    name="identityCard"
                    type="text"
                    className="form-control"
                    placeholder="VD: 079203001234"
                    value={form.identityCard}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-start" className="form-label fw-semibold">
                    Ngày bắt đầu thuê *
                  </label>
                  <input
                    id="ct-start"
                    name="startDate"
                    type="date"
                    className={`form-control ${
                      errors.startDate ? "is-invalid" : ""
                    }`}
                    value={form.startDate}
                    onChange={handleChange}
                  />
                  {errors.startDate && (
                    <div className="invalid-feedback">{errors.startDate}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-end" className="form-label fw-semibold">
                    Ngày kết thúc dự kiến
                  </label>
                  <input
                    id="ct-end"
                    name="endDate"
                    type="date"
                    className={`form-control ${errors.endDate ? "is-invalid" : ""}`}
                    value={form.endDate}
                    onChange={handleChange}
                  />
                  {errors.endDate && (
                    <div className="invalid-feedback">{errors.endDate}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-rent" className="form-label fw-semibold">
                    Giá thuê hàng tháng (VNĐ)
                  </label>
                  <input
                    id="ct-rent"
                    name="rentPrice"
                    type="number"
                    className="form-control"
                    value={form.rentPrice}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-deposit" className="form-label fw-semibold">
                    Tiền đặt cọc (VNĐ)
                  </label>
                  <input
                    id="ct-deposit"
                    name="deposit"
                    type="number"
                    className="form-control"
                    value={form.deposit}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-init-elec" className="form-label fw-semibold small">
                    Chỉ số điện bàn giao đầu kỳ (kWh)
                  </label>
                  <input
                    id="ct-init-elec"
                    name="initialElectricity"
                    type="number"
                    className="form-control"
                    value={form.initialElectricity}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="ct-init-water" className="form-label fw-semibold small">
                    Chỉ số nước bàn giao đầu kỳ (m³)
                  </label>
                  <input
                    id="ct-init-water"
                    name="initialWater"
                    type="number"
                    className="form-control"
                    value={form.initialWater}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
              >
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Đang tạo hợp đồng..." : "Tạo Hợp Đồng & Gán Phòng"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
