import React, { useMemo, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  updateMeterRowField,
  saveBatchMetersThunk,
  fetchMeterSheet,
} from "../../store/slices/invoiceSlice";
import { MeterRowItem } from "./MeterRowItem";
import { formatVND } from "../../api/apiClient";

// Yêu cầu kỹ thuật riêng Đề 4:
// Form nhập chỉ số điện nước cho tất cả phòng trên một bảng, kiểm tra từng dòng và hiển thị lỗi ngay tại dòng sai
export const BatchMeterTable = ({ month, year }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { meterSheet, loading, serverRowErrors } = useSelector(
    (state) => state.invoices
  );
  const [useTieredElectricity, setUseTieredElectricity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const rows = meterSheet.rows || [];

  // useCallback giữ tham chiếu hàm ổn định khi truyền xuống từng dòng MeterRowItem
  const handleFieldChange = useCallback(
    (roomId, field, value) => {
      dispatch(updateMeterRowField({ roomId, field, value }));
    },
    [dispatch]
  );

  // useMemo kiểm tra dữ liệu từng dòng ngay lập tức (từ chối chỉ số mới < chỉ số cũ)
  const validationSummary = useMemo(() => {
    const errorsByRoom = { ...serverRowErrors };
    let totalEstimated = 0;

    rows.forEach((row) => {
      const oldE = Number(row.oldElectricity);
      const newE = Number(row.newElectricity);
      const oldW = Number(row.oldWater);
      const newW = Number(row.newWater);

      if (row.oldElectricity === "" || row.newElectricity === "" || row.oldWater === "" || row.newWater === "") {
        errorsByRoom[row.roomId] = "Vui lòng nhập đầy đủ chỉ số điện và nước";
      } else if (Number.isNaN(oldE) || Number.isNaN(newE) || Number.isNaN(oldW) || Number.isNaN(newW)) {
        errorsByRoom[row.roomId] = "Chỉ số điện nước phải là số";
      } else if (oldE < 0 || newE < 0 || oldW < 0 || newW < 0) {
        errorsByRoom[row.roomId] = "Chỉ số điện nước không được âm";
      } else if (newE < oldE) {
        errorsByRoom[row.roomId] = `Chỉ số điện mới (${newE}) nhỏ hơn chỉ số điện cũ (${oldE})`;
      } else if (newW < oldW) {
        errorsByRoom[row.roomId] = `Chỉ số nước mới (${newW}) nhỏ hơn chỉ số nước cũ (${oldW})`;
      } else {
        const elecCost = (newE - oldE) * (row.electricityPrice ?? 3500);
        const waterCost = (newW - oldW) * (row.waterPrice ?? 15000);
        totalEstimated +=
          (row.roomPrice || 0) + elecCost + waterCost + (row.serviceFee || 0);
      }
    });

    return {
      errorsByRoom,
      errorCount: Object.keys(errorsByRoom).length,
      totalEstimated,
    };
  }, [rows, serverRowErrors]);

  const handleSaveBatch = async (issueInvoices) => {
    setFeedback(null);
    if (validationSummary.errorCount > 0) {
      setFeedback({
        type: "danger",
        text: `Phát hiện ${validationSummary.errorCount} dòng có lỗi! Vui lòng sửa các dòng màu đỏ trước khi lưu.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const actionResult = await dispatch(
        saveBatchMetersThunk({
          month,
          year,
          rows,
          issueInvoices,
          useTieredElectricity,
        })
      ).unwrap();

      setFeedback({
        type: "success",
        text: actionResult.message || "Lưu chỉ số điện nước thành công!",
      });

      await dispatch(fetchMeterSheet({ month, year }));

      // useNavigate sau khi lưu & phát hành hóa đơn (Rubric #5)
      if (issueInvoices) {
        setTimeout(() => {
          navigate("/landlord/invoices");
        }, 900);
      }
    } catch (err) {
      setFeedback({
        type: "danger",
        text: err.message || "Có lỗi khi lưu bảng chỉ số điện nước",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
        <p className="mt-2 text-muted">Đang tải bảng chỉ số điện nước...</p>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm rounded-4 p-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <h5 className="fw-bold mb-1">
            Bảng Nhập Chỉ Số Điện Nước Hàng Loạt - Tháng {month}/{year}
          </h5>
          <p className="text-muted small mb-0">
            Nhập trực tiếp chỉ số mới cho tất cả các phòng đang thuê. Hệ thống kiểm tra từng dòng và báo lỗi ngay nếu chỉ số mới nhỏ hơn chỉ số cũ.
          </p>
        </div>

        <div className="form-check form-switch">
          <input
            id="tiered-switch"
            className="form-check-input"
            type="checkbox"
            checked={useTieredElectricity}
            onChange={(e) => setUseTieredElectricity(e.target.checked)}
          />
          <label htmlFor="tiered-switch" className="form-check-label fw-semibold small">
            Tính giá điện bậc thang (Nâng cao)
          </label>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} py-2 small`}>
          {feedback.text}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Phòng / Dãy trọ</th>
              <th>Người thuê</th>
              <th className="text-end">Tiền phòng</th>
              <th className="text-end">Điện cũ</th>
              <th className="text-end">Điện mới *</th>
              <th className="text-end">Nước cũ</th>
              <th className="text-end">Nước mới *</th>
              <th className="text-end">Tạm tính</th>
              <th>Trạng thái dòng</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-4 text-muted">
                  Hiện chưa có phòng nào đang ở trạng thái Đang thuê.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <MeterRowItem
                  key={row.roomId}
                  row={row}
                  rowError={validationSummary.errorsByRoom[row.roomId]}
                  useTieredElectricity={useTieredElectricity}
                  onFieldChange={handleFieldChange}
                />
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="table-light">
              <tr>
                <td colSpan="7" className="text-end fw-bold">
                  Tổng doanh thu dự kiến tháng {month}/{year}:
                </td>
                <td className="text-end fw-bold text-danger fs-6">
                  {formatVND(validationSummary.totalEstimated)}
                </td>
                <td>
                  {validationSummary.errorCount > 0 ? (
                    <span className="text-danger fw-bold small">
                      {validationSummary.errorCount} dòng lỗi
                    </span>
                  ) : (
                    <span className="text-success fw-bold small">
                      Tất cả dòng hợp lệ
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {rows.length > 0 && (
        <div className="d-flex flex-wrap justify-content-end gap-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-primary fw-semibold"
            disabled={submitting || validationSummary.errorCount > 0}
            onClick={() => handleSaveBatch(false)}
          >
            <i className="bi bi-floppy me-1" />
            Chỉ Lưu Chỉ Số Điện Nước
          </button>
          <button
            type="button"
            className="btn btn-success fw-semibold"
            disabled={submitting || validationSummary.errorCount > 0}
            onClick={() => handleSaveBatch(true)}
          >
            <i className="bi bi-receipt-cutoff me-1" />
            {submitting
              ? "Đang xử lý..."
              : `Lưu Chỉ Số & Phát Hành Hóa Đơn Tháng ${month}/${year}`}
          </button>
        </div>
      )}
    </div>
  );
};
