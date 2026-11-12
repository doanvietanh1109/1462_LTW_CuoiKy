import React from "react";

export const StatCard = ({ icon, title, value, subtitle, variant = "primary" }) => {
  const colorMap = {
    primary: "#2563eb",
    success: "#16a34a",
    danger: "#dc2626",
    warning: "#d97706",
    info: "#0891b2",
  };
  const accent = colorMap[variant] || colorMap.primary;

  return (
    <div
      className="card border-0 shadow-sm h-100"
      style={{ borderLeft: `4px solid ${accent}`, borderRadius: "12px" }}
    >
      <div className="card-body d-flex align-items-center justify-content-between p-3">
        <div>
          <p className="text-muted mb-1 small fw-semibold text-uppercase">{title}</p>
          <h3 className="fw-bold mb-1" style={{ color: accent }}>
            {value}
          </h3>
          {subtitle && <small className="text-secondary">{subtitle}</small>}
        </div>
        <div
          className="d-flex align-items-center justify-content-center rounded-circle"
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: `${accent}18`,
            color: accent,
            fontSize: "1.4rem",
          }}
        >
          <i className={`bi ${icon}`} />
        </div>
      </div>
    </div>
  );
};
