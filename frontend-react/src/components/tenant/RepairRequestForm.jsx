import React, { useState, useRef } from "react";

// Form controlled gửi yêu cầu sửa chữa kèm ảnh cho Người thuê
export const RepairRequestForm = ({ roomId, onSubmitted }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    imageUrl: "",
  });
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Vui lòng nhập tiêu đề sự cố cần sửa chữa";
    if (!form.description.trim())
      errs.description = "Vui lòng mô tả chi tiết tình trạng hư hỏng";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 3).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPreviewImages((prev) => [...prev.slice(0, 2), ev.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (!form.imageUrl.trim()) return;
    setPreviewImages((prev) => [...prev, form.imageUrl.trim()]);
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmitted({
        roomId,
        title: form.title,
        description: form.description,
        priority: form.priority,
        images:
          previewImages.length > 0
            ? previewImages
            : ["https://picsum.photos/seed/repairnew/600/400"],
      });
      setForm({ title: "", description: "", priority: "medium", imageUrl: "" });
      setPreviewImages([]);
    } finally {
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
              ref={fileInputRef}
              type="file"
              accept="image/*"
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

            <div className="input-group input-group-sm" style={{ maxWidth: "360px" }}>
              <input
                id="rep-img"
                type="text"
                className="form-control"
                placeholder="Hoặc dán link ảnh URL..."
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleAddImageUrl}
              >
                Thêm ảnh
              </button>
            </div>
          </div>

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
                    onClick={() =>
                      setPreviewImages((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
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
