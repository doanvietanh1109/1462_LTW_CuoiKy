import React from "react";
import { formatVND } from "../../api/apiClient";

// Component dòng nhập chỉ số điện nước cho từng phòng, kiểm tra và hiển thị lỗi ngay tại dòng sai
export const MeterRowItem = React.memo(
  ({
    row,
    rowError,
    useTieredElectricity,
    onFieldChange,
  }) => {
    const oldE = Number(row.oldElectricity) || 0;
    const newE = Number(row.newElectricity) || 0;
    const oldW = Number(row.oldWater) || 0;
    const newW = Number(row.newWater) || 0;

    const elecDiff = Math.max(0, newE - oldE);
    const waterDiff = Math.max(0, newW - oldW);

    const elecCost = elecDiff * (row.electricityPrice || 3500);
    const waterCost = waterDiff * (row.waterPrice || 15000);
    const previewTotal =
      (row.roomPrice || 0) + elecCost + waterCost + (row.serviceFee || 0);

    const hasError = Boolean(rowError);

    return (
      <>
        <tr className={hasError ? "table-danger" : ""}>
          <td>
            <div className="fw-bold text-primary">
              {row.roomNumber ? `[${row.roomNumber}] ` : ""}
              {row.roomTitle}
            </div>
            <small className="text-muted">{row.blockName}</small>
          </td>
          <td>
            <div className="fw-semibold">{row.tenantName}</div>
            <small className="text-muted">{row.tenantEmail}</small>
          </td>
          <td className="text-end fw-semibold">{formatVND(row.roomPrice)}</td>

          {/* Chỉ số điện cũ */}
          <td style={{ width: "110px" }}>
            <input
              type="number"
              className="form-control form-control-sm text-end"
              value={row.oldElectricity}
              onChange={(e) =>
                onFieldChange(row.roomId, "oldElectricity", e.target.value)
              }
              aria-label={`Điện cũ ${row.roomTitle}`}
            />
          </td>

          {/* Chỉ số điện mới */}
          <td style={{ width: "120px" }}>
            <input
              type="number"
              className={`form-control form-control-sm text-end fw-bold ${
                Number(row.newElectricity) < Number(row.oldElectricity)
                  ? "is-invalid border-danger"
                  : ""
              }`}
              value={row.newElectricity}
              onChange={(e) =>
                onFieldChange(row.roomId, "newElectricity", e.target.value)
              }
              aria-label={`Điện mới ${row.roomTitle}`}
            />
            <small className="text-muted d-block text-end">
              Tiêu thụ: {elecDiff} kWh
            </small>
          </td>

          {/* Chỉ số nước cũ */}
          <td style={{ width: "110px" }}>
            <input
              type="number"
              className="form-control form-control-sm text-end"
              value={row.oldWater}
              onChange={(e) =>
                onFieldChange(row.roomId, "oldWater", e.target.value)
              }
              aria-label={`Nước cũ ${row.roomTitle}`}
            />
          </td>

          {/* Chỉ số nước mới */}
          <td style={{ width: "120px" }}>
            <input
              type="number"
              className={`form-control form-control-sm text-end fw-bold ${
                Number(row.newWater) < Number(row.oldWater)
                  ? "is-invalid border-danger"
                  : ""
              }`}
              value={row.newWater}
              onChange={(e) =>
                onFieldChange(row.roomId, "newWater", e.target.value)
              }
              aria-label={`Nước mới ${row.roomTitle}`}
            />
            <small className="text-muted d-block text-end">
              Tiêu thụ: {waterDiff} m³
            </small>
          </td>

          <td className="text-end">
            <div className="fw-bold text-danger">
              {hasError ? "---" : formatVND(previewTotal)}
            </div>
            <small className="text-muted">
              DV: {formatVND(row.serviceFee)}
              {useTieredElectricity ? " (Bậc thang)" : ""}
            </small>
          </td>

          <td>
            {hasError ? (
              <span className="badge bg-danger text-wrap text-start">
                <i className="bi bi-exclamation-triangle-fill me-1" />
                {rowError}
              </span>
            ) : row.hasInvoice ? (
              <span className="badge bg-success">
                <i className="bi bi-check-circle me-1" />
                Đã phát hành ({row.invoiceCode})
              </span>
            ) : (
              <span className="badge bg-info text-dark">
                <i className="bi bi-check2 me-1" />
                Hợp lệ - Sẵn sàng
              </span>
            )}
          </td>
        </tr>
        {hasError && (
          <tr className="table-danger">
            <td colSpan="9" className="py-1 px-3 small text-danger fw-semibold">
              <i className="bi bi-x-octagon-fill me-1" />
              Lỗi tại dòng [{row.roomNumber || row.roomTitle}]: {rowError}
            </td>
          </tr>
        )}
      </>
    );
  }
);
