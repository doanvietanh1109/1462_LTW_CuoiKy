import React, { useState, useEffect } from "react";

export const MotelBlockModal = ({ show, onClose, onSave, editingBlock }) => {
  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    defaultElectricityPrice: 3500,
    defaultWaterPrice: 15000,
    defaultServiceFee: 100000,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingBlock) {
      setForm({
        name: editingBlock.name || "",
        address: editingBlock.address || "",
        description: editingBlock.description || "",
        defaultElectricityPrice: editingBlock.defaultElectricityPrice ?? 3500,
        defaultWaterPrice: editingBlock.defaultWaterPrice ?? 15000,
        defaultServiceFee: editingBlock.defaultServiceFee ?? 100000,
      });
    } else {
      setForm({
        name: "",
        address: "",
        description: "",
        defaultElectricityPrice: 3500,
        defaultWaterPrice: 15000,
        defaultServiceFee: 100000,
      });
    }
    setErrors({});
  }, [editingBlock, show]);

  if (!show) return null;

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Tên dãy trọ là bắt buộc";
    if (!form.address.trim()) newErrors.address = "Địa chỉ dãy trọ là bắt buộc";
    if (Number(form.defaultElectricityPrice) < 0)
      newErrors.defaultElectricityPrice = "Đơn giá điện không được âm";
    if (Number(form.defaultWaterPrice) < 0)
      newErrors.defaultWaterPrice = "Đơn giá nước không được âm";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        defaultElectricityPrice: Number(form.defaultElectricityPrice),
        defaultWaterPrice: Number(form.defaultWaterPrice),
        defaultServiceFee: Number(form.defaultServiceFee),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-buildings me-2 text-primary" />
              {editingBlock ? "Cập Nhật Dãy Trọ" : "Thêm Dãy Trọ Mới"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="block-name" className="form-label fw-semibold">
                  Tên dãy trọ *
                </label>
                <input
                  id="block-name"
                  name="name"
                  type="text"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  placeholder="VD: Dãy A - Cơ sở Thủ Đức"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="mb-3">
                <label htmlFor="block-address" className="form-label fw-semibold">
                  Địa chỉ *
                </label>
                <input
                  id="block-address"
                  name="address"
                  type="text"
                  className={`form-control ${errors.address ? "is-invalid" : ""}`}
                  placeholder="VD: Số 12 Võ Văn Ngân, TP. Thủ Đức"
                  value={form.address}
                  onChange={handleChange}
                />
                {errors.address && (
                  <div className="invalid-feedback">{errors.address}</div>
                )}
              </div>

              <div className="row g-2 mb-3">
                <div className="col-4">
                  <label htmlFor="block-elec" className="form-label fw-semibold small">
                    Giá điện (đ/kWh)
                  </label>
                  <input
                    id="block-elec"
                    name="defaultElectricityPrice"
                    type="number"
                    className={`form-control ${
                      errors.defaultElectricityPrice ? "is-invalid" : ""
                    }`}
                    value={form.defaultElectricityPrice}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-4">
                  <label htmlFor="block-water" className="form-label fw-semibold small">
                    Giá nước (đ/m³)
                  </label>
                  <input
                    id="block-water"
                    name="defaultWaterPrice"
                    type="number"
                    className={`form-control ${
                      errors.defaultWaterPrice ? "is-invalid" : ""
                    }`}
                    value={form.defaultWaterPrice}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-4">
                  <label htmlFor="block-service" className="form-label fw-semibold small">
                    Phí dịch vụ (đ)
                  </label>
                  <input
                    id="block-service"
                    name="defaultServiceFee"
                    type="number"
                    className="form-control"
                    value={form.defaultServiceFee}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-2">
                <label htmlFor="block-desc" className="form-label fw-semibold">
                  Mô tả dãy trọ
                </label>
                <textarea
                  id="block-desc"
                  name="description"
                  rows="3"
                  className="form-control"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Ghi chú tiện ích chung, giờ giấc, an ninh..."
                />
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
                {saving ? "Đang lưu..." : "Lưu Dãy Trọ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
