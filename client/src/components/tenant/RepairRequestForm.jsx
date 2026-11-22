import React, { useEffect, useState, useRef } from "react";

// Form controlled gửi yêu cầu sửa chữa kèm ảnh cho Người thuê
export const RepairRequestForm = ({ roomId, onSubmitted }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewImages(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [imageFiles]);

  const validate = () => {
    const errs = {};
    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      errs.title = "Vui lòng nhập tiêu đề sự cố cần sửa chữa";
    } else if (title.length < 3 || title.length > 120) {
      errs.title = "Tiêu đề phải từ 3 đến 120 ký tự";
    }

    if (!description) {
      errs.description = "Vui lòng mô tả chi tiết tình trạng hư hỏng";
    } else if (description.length < 5 || description.length > 3000) {
      errs.description = "Mô tả chi tiết phải từ 5 đến 3000 ký tự";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    const invalid = selected.find((file) => !allowed.has(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      setSubmitError("Chỉ nhận ảnh JPG, PNG, WebP tối đa 5 MB mỗi ảnh.");
      e.target.value = "";
      return;
    }
    if (imageFiles.length + selected.length > 3) {
      setSubmitError("Mỗi yêu cầu được đính kèm tối đa 3 ảnh.");
      e.target.value = "";
      return;
    }
    setSubmitError("");
    setImageFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validate()) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmitted({
        roomId,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        images: imageFiles,
      });
      setForm({ title: "", description: "", priority: "medium" });
      setImageFiles([]);
    } catch (error) {
      setSubmitError(error.message || "Không thể gửi yêu cầu sửa chữa.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card border-0 shadow-sm rounded-4 p-4"
      noValidate
    >
      <h5 className="fw-bold mb-3">
        <i className="bi bi-wrench-adjustable-circle me-2 text-primary" />
        Gửi Yêu Cầu Sửa Chữa Mới
      </h5>

      <div className="row g-3">
        <div className="col-md-8">
          <label htmlFor="rep-title" className="form-label fw-semibold">
            Tiêu đề sự cố *
          </label>
          <input
            id="rep-title"
            type="text"
            className={`form-control ${errors.title ? "is-invalid" : ""}`}
            placeholder="VD: Hỏng vòi nước, máy lạnh không lạnh..."
            value={form.title}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        <div className="col-md-4">
          <label htmlFor="rep-priority" className="form-label fw-semibold">
            Mức độ ưu tiên
          </label>
          <select
            id="rep-priority"
            className="form-select"
            value={form.priority}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, priority: e.target.value }))
            }
          >
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Khẩn cấp</option>
          </select>
        </div>

        <div className="col-12">
          <label htmlFor="rep-desc" className="form-label fw-semibold">
            Mô tả chi tiết tình trạng *
          </label>
          <textarea
            id="rep-desc"
            rows="3"
            className={`form-control ${errors.description ? "is-invalid" : ""}`}
            placeholder="Mô tả rõ vị trí hỏng và thời gian chủ trọ có thể cử thợ qua sửa..."
            value={form.description}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, description: e.target.value }));
              if (errors.description)
                setErrors((prev) => ({ ...prev, description: "" }));
            }}
          />
          {errors.description && (
            <div className="invalid-feedback">{errors.description}</div>
          )}
        </div>

        <div className="col-12">
          <label htmlFor="rep-img" className="form-label fw-semibold">
            Đính kèm hình ảnh sự cố
          </label>
          <div className="d-flex flex-wrap gap-2 mb-2">
            <input
              id="rep-img"
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              className="d-none"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="bi bi-camera me-1" /> Chọn ảnh từ máy
            </button>
          </div>

          {submitError && <div className="text-danger small mt-2" role="alert">{submitError}</div>}
          {previewImages.length > 0 && (
            <div className="d-flex gap-2 flex-wrap mt-2">
              {previewImages.map((img, idx) => (
                <div
                  key={`preview_${img.slice(0, 25)}_${idx}`}
                  className="position-relative"
                >
                  <img
                    src={img}
                    alt="Ảnh đính kèm"
                    style={{
                      width: 85,
                      height: 65,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0 px-1"
                    onClick={() => setImageFiles((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-12 text-end">
          <button
            type="submit"
            className="btn btn-primary fw-semibold px-4"
            disabled={submitting}
          >
            <i className="bi bi-send-fill me-1" />
            {submitting ? "Đang gửi..." : "Gửi Yêu Cầu Sửa Chữa"}
          </button>
        </div>
      </div>
    </form>
  );
};
