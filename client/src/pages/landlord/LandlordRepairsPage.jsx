import React, { useEffect, useState } from "react";
import { apiRequest, formatDateVN } from "../../api/apiClient";
import { StatusBadge } from "../../components/common/StatusBadge";

export const LandlordRepairsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesById, setNotesById] = useState({});
  const [feedback, setFeedback] = useState("");

  const loadRepairs = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/repair-requests");
      setRequests(res.data?.requests || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
  }, []);

  const handleUpdateStatus = async (reqItem, newStatus, updateRoomStatus = false) => {
    const res = await apiRequest(`/repair-requests/${reqItem._id}/status`, {
      method: "PATCH",
      body: {
        status: newStatus,
        landlordNote:
          notesById[reqItem._id] !== undefined
            ? notesById[reqItem._id]
            : reqItem.landlordNote,
        updateRoomStatus,
      },
    });
    setFeedback(res.message || "Đã cập nhật trạng thái sửa chữa!");
    setRequests((prev) =>
      prev.map((item) => (item._id === reqItem._id ? res.data.request : item))
    );
  };

  return (
    <div>
      <div className="mb-3">
        <h4 className="landlord-page-title fw-bold mb-1">
          <i className="bi bi-tools me-2 text-primary" />
          Yêu cầu sửa chữa ({requests.length})
        </h4>
        <p className="text-muted small mb-0">
          Cập nhật tiến độ xử lý sự cố: Mới → Đang xử lý → Xong
        </p>
      </div>

      {feedback && (
        <div className="alert alert-success alert-dismissible fade show py-2 small">
          {feedback}
          <button
            type="button"
            className="btn-close"
            onClick={() => setFeedback("")}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="row g-3">
          {requests.map((reqItem) => (
            <div key={reqItem._id} className="col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold mb-1">{reqItem.title}</h5>
                    <small className="text-muted">
                      Phòng: <strong>{reqItem.roomId?.title}</strong> · Người gửi:{" "}
                      <strong>{reqItem.tenantId?.name}</strong> (
                      {formatDateVN(reqItem.createdAt)})
                    </small>
                  </div>
                  <StatusBadge type="repair" status={reqItem.status} />
                </div>

                <p className="small text-secondary mb-2">{reqItem.description}</p>

                {reqItem.images && reqItem.images.length > 0 && (
                  <div className="d-flex gap-2 mb-3">
                    {reqItem.images.map((url, idx) => (
                      <img
                        key={`${reqItem._id}_${idx}`}
                        src={url}
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

                <div className="mb-3">
                  <label
                    htmlFor={`note_${reqItem._id}`}
                    className="form-label small fw-semibold mb-1"
                  >
                    Ghi chú phản hồi cho người thuê:
                  </label>
                  <input
                    id={`note_${reqItem._id}`}
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="VD: Đã hẹn thợ điện lạnh 14h chiều nay..."
                    value={
                      notesById[reqItem._id] !== undefined
                        ? notesById[reqItem._id]
                        : reqItem.landlordNote || ""
                    }
                    onChange={(e) =>
                      setNotesById((prev) => ({
                        ...prev,
                        [reqItem._id]: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="d-flex flex-wrap gap-2 mt-auto">
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      reqItem.status === "new"
                        ? "btn-info"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => handleUpdateStatus(reqItem, "new")}
                  >
                    1. Mới
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      reqItem.status === "in_progress"
                        ? "btn-warning text-dark"
                        : "btn-outline-warning text-dark"
                    }`}
                    onClick={() =>
                      handleUpdateStatus(reqItem, "in_progress", true)
                    }
                  >
                    2. Đang xử lý
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${
                      reqItem.status === "resolved"
                        ? "btn-success"
                        : "btn-outline-success"
                    }`}
                    onClick={() => handleUpdateStatus(reqItem, "resolved", true)}
                  >
                    3. Xong (Hoàn tất)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
