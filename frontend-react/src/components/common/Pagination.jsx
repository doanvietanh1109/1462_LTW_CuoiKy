import React from "react";

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, idx) => idx + 1);

  return (
    <nav aria-label="Phân trang danh sách" className="my-4 d-flex justify-content-center">
      <ul className="pagination mb-0">
        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <i className="bi bi-chevron-left" /> Trước
          </button>
        </li>
        {pages.map((p) => (
          <li key={`page_${p}`} className={`page-item ${p === page ? "active" : ""}`}>
            <button
              type="button"
              className="page-link"
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          </li>
        ))}
        <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Sau <i className="bi bi-chevron-right" />
          </button>
        </li>
      </ul>
    </nav>
  );
};
