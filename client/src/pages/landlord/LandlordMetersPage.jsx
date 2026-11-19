import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchMeterSheet } from "../../store/slices/invoiceSlice";
import { BatchMeterTable } from "../../components/landlord/BatchMeterTable";

export const LandlordMetersPage = () => {
  const dispatch = useDispatch();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    dispatch(fetchMeterSheet({ month, year }));
  }, [dispatch, month, year]);

  return (
    <div className="landlord-meters-page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <h4 className="landlord-page-title fw-bold mb-1">
            Nhập chỉ số điện nước cuối tháng
          </h4>
          <p className="text-muted small mb-0">
            Nhập chỉ số điện nước cho tất cả phòng trên cùng một bảng và phát hành hóa đơn hàng tháng
          </p>
        </div>

        <div className="landlord-meters-period-controls d-flex align-items-center gap-2">
          <label htmlFor="meter-month" className="small fw-semibold">
            Tháng:
          </label>
          <select
            id="meter-month"
            className="form-select form-select-sm"
            style={{ width: "100px" }}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <label htmlFor="meter-year" className="small fw-semibold">
            Năm:
          </label>
          <select
            id="meter-year"
            className="form-select form-select-sm"
            style={{ width: "100px" }}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <BatchMeterTable month={month} year={year} />
    </div>
  );
};
