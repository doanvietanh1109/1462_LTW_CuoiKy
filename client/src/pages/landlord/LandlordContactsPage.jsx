import React, { useEffect, useState } from "react";
import { apiRequest, formatDateVN } from "../../api/apiClient";

export const LandlordContactsPage = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("/contacts");
      setInquiries(res.data?.inquiries || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const toggleStatus = async (item) => {
    const nextStatus = item.status === "contacted" ? "new" : "contacted";
    const res = await apiRequest(`/contacts/${item._id}/status`, {
      method: "PATCH",
      body: { status: nextStatus },
    });
    setInquiries((prev) =>
      prev.map((inq) => (inq._id === item._id ? res.data.inquiry : inq))
    );
  };

  return (
    <div>
      <div className="mb-3">
        <h4 className="fw-bold mb-1">
          <i className="bi bi-person-lines-fill me-2 text-primary" />
          Danh Sách Khách Để Lại Thông Tin Liên Hệ ({inquiries.length})
        </h4>
        <p className="text-muted small mb-0">
          Thông tin khách vãng lai (không đăng nhập) gửi từ trang Chi tiết phòng trống
        </p>
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
                  <th>Ngày gửi</th>
                  <th>Khách liên hệ</th>
                  <th>Số điện thoại / Email</th>
                  <th>Phòng quan tâm</th>
                  <th>Lời nhắn</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      Chưa có khách nào để lại thông tin liên hệ.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((item) => (
                    <tr key={item._id}>
                      <td className="small">{formatDateVN(item.createdAt)}</td>
                      <td className="fw-bold">{item.name}</td>
                      <td>
                        <div className="fw-semibold text-primary">
                          {item.phone}
                        </div>
                        <small className="text-muted">{item.email}</small>
                      </td>
                      <td>
                        <div className="fw-semibold">{item.roomId?.title}</div>
                        <small className="text-muted">
                          {item.roomId?.district}
                        </small>
                      </td>
                      <td className="small">{item.message}</td>
                      <td>
                        {item.status === "contacted" ? (
                          <span className="badge bg-success">Đã liên hệ</span>
                        ) : (
                          <span className="badge bg-warning text-dark">
                            Chờ liên hệ
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => toggleStatus(item)}
                        >
                          {item.status === "contacted"
                            ? "Đánh dấu chưa gọi"
                            : "Đánh dấu đã gọi"}
                        </button>
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
