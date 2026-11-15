import React, { useState, useEffect } from "react";

const AMENITY_OPTIONS = [
  "Wifi",
  "Máy lạnh",
  "Tủ lạnh",
  "Máy giặt",
  "Chỗ để xe",
  "Bảo vệ 24/7",
  "WC riêng",
  "Bếp",
];

export const RoomFormModal = ({
  show,
  onClose,
  onSave,
  editingRoom,
  blocks = [],
}) => {
  const [form, setForm] = useState({
    title: "",
    roomNumber: "",
    blockId: "",
    category: "Phòng trọ",
    price: 2500000,
    area: 25,
    district: "Thủ Đức",
    status: "available",
    electricityPrice: 3500,
    waterPrice: 15000,
    serviceFee: 100000,
    currentElectricity: 0,
    currentWater: 0,
    image: "",
    description: "",
    amenities: ["Wifi", "Máy lạnh"],
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [imageError, setImageError] = useState("");
  const [previews, setPreviews] = useState([]);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setImageFiles([]);
    setRemovedImages([]);
    setImageError("");
    setSaveError("");
    if (editingRoom) {
      const currentImages = [...new Set([editingRoom.image, ...(editingRoom.images || [])].filter(Boolean))];
      setExistingImages(currentImages);
      setMainImage(currentImages[0] || "");
      setMainImageIndex(0);
      setForm({
        title: editingRoom.title || "",
        roomNumber: editingRoom.roomNumber || "",
        blockId: editingRoom.blockId?._id || editingRoom.blockId || "",
        category: editingRoom.category || "Phòng trọ",
        price: editingRoom.price ?? 2500000,
        area: editingRoom.area ?? 25,
        district: editingRoom.district || "",
        status: editingRoom.status || "available",
        electricityPrice: editingRoom.electricityPrice ?? 3500,
        waterPrice: editingRoom.waterPrice ?? 15000,
        serviceFee: editingRoom.serviceFee ?? 100000,
        currentElectricity: editingRoom.currentElectricity ?? 0,
        currentWater: editingRoom.currentWater ?? 0,
        image: "",
        description: editingRoom.description || "",
        amenities: editingRoom.amenities || [],
      });
    } else {
      setExistingImages([]);
      setMainImage("");
      setMainImageIndex(0);
      const defaultBlock = blocks[0];
      setForm({
        title: "",
        roomNumber: "",
        blockId: defaultBlock?._id || "",
        category: "Phòng trọ",
        price: 2500000,
        area: 25,
        district: defaultBlock?.address || "Thủ Đức, TP.HCM",
        status: "available",
        electricityPrice: defaultBlock?.defaultElectricityPrice ?? 3500,
        waterPrice: defaultBlock?.defaultWaterPrice ?? 15000,
        serviceFee: defaultBlock?.defaultServiceFee ?? 100000,
        currentElectricity: 0,
        currentWater: 0,
        image: "",
        description: "",
        amenities: ["Wifi", "Máy lạnh", "Chỗ để xe"],
      });
    }
    setErrors({});
  }, [editingRoom, blocks, show]);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  if (!show) return null;

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Vui lòng nhập tiêu đề / tên phòng";
    if (!form.district.trim()) errs.district = "Vui lòng nhập khu vực / địa chỉ";
    if (!form.price || Number(form.price) <= 0)
      errs.price = "Giá thuê phải lớn hơn 0";
    if (!form.area || Number(form.area) <= 0)
      errs.area = "Diện tích phải lớn hơn 0 m²";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageSelection = (event) => {
    const selected = Array.from(event.target.files || []);
    const accepted = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (selected.some((file) => !accepted.has(file.type) || file.size > 5 * 1024 * 1024)) {
      setImageError("Chỉ nhận ảnh JPG, PNG, WebP tối đa 5 MB mỗi ảnh.");
      event.target.value = "";
      return;
    }
    if (existingImages.length + imageFiles.length + selected.length > 8) {
      setImageError("Mỗi phòng được lưu tối đa 8 ảnh.");
      event.target.value = "";
      return;
    }
    setImageFiles((prev) => [...prev, ...selected]);
    setImageError("");
    event.target.value = "";
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave({
        ...form,
        price: Number(form.price),
        area: Number(form.area),
        electricityPrice: Number(form.electricityPrice),
        waterPrice: Number(form.waterPrice),
        serviceFee: Number(form.serviceFee),
        currentElectricity: Number(form.currentElectricity),
        currentWater: Number(form.currentWater),
        imageFiles,
        removeImages: removedImages,
        mainImage,
        mainImageIndex,
      });
      onClose();
    } catch (error) {
      setSaveError(error.message || "Không thể lưu phòng. Vui lòng thử lại.");
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
              <i className="bi bi-houses me-2 text-primary" />
              {editingRoom ? "Cập Nhật Thông Tin Phòng" : "Thêm Phòng Trọ Mới"}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {saveError && <div className="alert alert-danger py-2 small" role="alert">{saveError}</div>}
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="rm-number" className="form-label fw-semibold">
                    Mã / Số phòng
                  </label>
                  <input
                    id="rm-number"
                    name="roomNumber"
                    type="text"
                    className="form-control"
                    placeholder="VD: P.101"
                    value={form.roomNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-8">
                  <label htmlFor="rm-title" className="form-label fw-semibold">
                    Tên / Tiêu đề phòng *
                  </label>
                  <input
                    id="rm-title"
                    name="title"
                    type="text"
                    className={`form-control ${errors.title ? "is-invalid" : ""}`}
                    placeholder="VD: Phòng P.101 - Căn hộ dịch vụ Thủ Đức"
                    value={form.title}
                    onChange={handleChange}
                  />
                  {errors.title && (
                    <div className="invalid-feedback">{errors.title}</div>
                  )}
                </div>

                <div className="col-md-4">
                  <label htmlFor="rm-block" className="form-label fw-semibold">
                    Thuộc Dãy trọ
                  </label>
                  <select
                    id="rm-block"
                    name="blockId"
                    className="form-select"
                    value={form.blockId}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn dãy trọ --</option>
                    {blocks.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <input type="hidden" name="category" value="Phòng trọ" readOnly />

                <div className="col-md-4">
                  <label htmlFor="rm-status" className="form-label fw-semibold">
                    Trạng thái phòng *
                  </label>
                  <select
                    id="rm-status"
                    name="status"
                    className="form-select"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="available">Trống (Available)</option>
                    <option value="rented">Đang thuê (Rented)</option>
                    <option value="maintenance">Đang sửa (Maintenance)</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="rm-price" className="form-label fw-semibold">
                    Giá thuê / tháng (VNĐ) *
                  </label>
                  <input
                    id="rm-price"
                    name="price"
                    type="number"
                    className={`form-control ${errors.price ? "is-invalid" : ""}`}
                    value={form.price}
                    onChange={handleChange}
                  />
                  {errors.price && (
                    <div className="invalid-feedback">{errors.price}</div>
                  )}
                </div>

                <div className="col-md-4">
                  <label htmlFor="rm-area" className="form-label fw-semibold">
                    Diện tích (m²) *
                  </label>
                  <input
                    id="rm-area"
                    name="area"
                    type="number"
                    className={`form-control ${errors.area ? "is-invalid" : ""}`}
                    value={form.area}
                    onChange={handleChange}
                  />
                  {errors.area && (
                    <div className="invalid-feedback">{errors.area}</div>
                  )}
                </div>

                <div className="col-md-4">
                  <label htmlFor="rm-district" className="form-label fw-semibold">
                    Khu vực / Địa chỉ *
                  </label>
                  <input
                    id="rm-district"
                    name="district"
                    type="text"
                    className={`form-control ${
                      errors.district ? "is-invalid" : ""
                    }`}
                    value={form.district}
                    onChange={handleChange}
                  />
                  {errors.district && (
                    <div className="invalid-feedback">{errors.district}</div>
                  )}
                </div>

                <div className="col-md-4">
                  <label htmlFor="rm-elec" className="form-label fw-semibold small">
                    Đơn giá điện (đ/kWh)
                  </label>
                  <input
                    id="rm-elec"
                    name="electricityPrice"
                    type="number"
                    className="form-control"
                    value={form.electricityPrice}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="rm-water" className="form-label fw-semibold small">
                    Đơn giá nước (đ/m³)
                  </label>
                  <input
                    id="rm-water"
                    name="waterPrice"
                    type="number"
                    className="form-control"
                    value={form.waterPrice}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="rm-service" className="form-label fw-semibold small">
                    Phí dịch vụ (đ/tháng)
                  </label>
                  <input
                    id="rm-service"
                    name="serviceFee"
                    type="number"
                    className="form-control"
                    value={form.serviceFee}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Tiện nghi phòng</label>
                  <div className="d-flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map((am) => (
                      <button
                        key={am}
                        type="button"
                        onClick={() => toggleAmenity(am)}
                        className={`btn btn-sm ${
                          form.amenities.includes(am)
                            ? "btn-primary"
                            : "btn-outline-secondary"
                        }`}
                      >
                        {form.amenities.includes(am) && (
                          <i className="bi bi-check2 me-1" />
                        )}
                        {am}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-12">
                  <label htmlFor="rm-image" className="form-label fw-semibold">Ảnh phòng (tối đa 8 ảnh)</label>
                  <input id="rm-image" type="file" className="form-control" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={handleImageSelection} />
                  <div className="form-text">JPG, PNG hoặc WebP; tối đa 5 MB mỗi ảnh. Ảnh được tải lên khi lưu phòng.</div>
                  {imageError && <div className="text-danger small mt-1" role="alert">{imageError}</div>}
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {existingImages.map((url, index) => (
                      <div key={`saved_${url}`} className="position-relative border rounded p-1">
                        <img src={url} alt={`Ảnh phòng đã lưu ${index + 1}`} style={{ width: 88, height: 66, objectFit: "cover" }} />
                        <div className="form-check small"><input className="form-check-input" type="radio" name="roomCover" checked={mainImage === url} onChange={() => { setMainImage(url); setMainImageIndex(-1); }} /><label className="form-check-label">Ảnh bìa</label></div>
                        <button type="button" aria-label="Xóa ảnh đã lưu" className="btn btn-sm btn-danger position-absolute top-0 end-0 py-0 px-1" onClick={() => { setExistingImages((prev) => prev.filter((item) => item !== url)); setRemovedImages((prev) => [...prev, url]); if (mainImage === url) setMainImage(""); }}>×</button>
                      </div>
                    ))}
                    {previews.map((url, index) => (
                      <div key={`new_${index}`} className="position-relative border rounded p-1">
                        <img src={url} alt={`Ảnh mới ${index + 1}`} style={{ width: 88, height: 66, objectFit: "cover" }} />
                        <div className="form-check small"><input className="form-check-input" type="radio" name="roomCover" checked={mainImageIndex === index} onChange={() => { setMainImage(""); setMainImageIndex(index); }} /><label className="form-check-label">Ảnh bìa</label></div>
                        <button type="button" aria-label="Bỏ ảnh mới" className="btn btn-sm btn-danger position-absolute top-0 end-0 py-0 px-1" onClick={() => { setImageFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index)); if (mainImageIndex === index) setMainImageIndex(0); }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-12">
                  <label htmlFor="rm-desc" className="form-label fw-semibold">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    id="rm-desc"
                    name="description"
                    rows="2"
                    className="form-control"
                    value={form.description}
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
                {saving ? "Đang lưu..." : "Lưu Phòng Trọ"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
