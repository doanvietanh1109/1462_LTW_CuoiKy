import React from "react";

const STATUS_MAP = {
  // Room statuses (Trống / Đang thuê / Đang sửa)
  room: {
    available: { label: "Trống", className: "bg-success text-white", icon: "bi-check-circle-fill" },
    rented: { label: "Đang thuê", className: "bg-primary text-white", icon: "bi-person-check-fill" },
    maintenance: { label: "Đang sửa", className: "bg-warning text-dark", icon: "bi-tools" },
    hidden: { label: "Đã ẩn", className: "bg-secondary text-white", icon: "bi-eye-slash" },
  },
  // Invoice statuses
  invoice: {
    paid: { label: "Đã thu tiền", className: "bg-success text-white", icon: "bi-check2-all" },
    unpaid: { label: "Chưa thu (Nợ)", className: "bg-danger text-white", icon: "bi-exclamation-triangle-fill" },
    pending_confirmation: { label: "Chờ chủ trọ xác nhận", className: "bg-warning text-dark", icon: "bi-hourglass-split" },
  },
  // Repair statuses (Mới -> Đang xử lý -> Xong)
  repair: {
    new: { label: "Mới", className: "bg-info text-dark", icon: "bi-stars" },
    in_progress: { label: "Đang xử lý", className: "bg-warning text-dark", icon: "bi-gear-wide-connected" },
    resolved: { label: "Xong", className: "bg-success text-white", icon: "bi-check-circle-fill" },
  },
  // Contract statuses
  contract: {
    active: { label: "Đang hiệu lực", className: "bg-success text-white", icon: "bi-file-earmark-check" },
    terminated: { label: "Đã kết thúc", className: "bg-secondary text-white", icon: "bi-file-earmark-x" },
  },
};

export const StatusBadge = ({ type = "room", status }) => {
  const group = STATUS_MAP[type] || STATUS_MAP.room;
  const config = group[status] || {
    label: status || "Chưa xác định",
    className: "bg-secondary text-white",
    icon: "bi-info-circle",
  };

  return (
    <span className={`badge ${config.className} d-inline-flex align-items-center gap-1 px-2 py-1`}>
      <i className={`bi ${config.icon}`} />
      <span>{config.label}</span>
    </span>
  );
};
