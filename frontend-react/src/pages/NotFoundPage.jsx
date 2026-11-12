import React from "react";
import { Link } from "react-router-dom";

// Trang 404 theo yêu cầu Rubric #5 (Routing SPA)
export const NotFoundPage = () => {
  return (
    <div className="container py-5 text-center">
      <div className="py-5">
        <h1 className="display-1 fw-bold text-primary">404</h1>
        <h3 className="fw-bold mb-2">Không Tìm Thấy Trang Yêu Cầu</h3>
        <p className="text-muted mb-4">
          Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/" className="btn btn-primary px-4">
            <i className="bi bi-house-door me-1" /> Về Trang Chủ
          </Link>
          <Link to="/landlord/dashboard" className="btn btn-outline-primary px-4">
            <i className="bi bi-speedometer2 me-1" /> Dashboard Chủ Trọ
          </Link>
        </div>
      </div>
    </div>
  );
};
