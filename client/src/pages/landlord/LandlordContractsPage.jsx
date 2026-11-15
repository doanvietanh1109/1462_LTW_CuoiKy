import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchContracts,
  fetchRooms,
  createContractThunk,
  terminateContractThunk,
} from "../../store/slices/roomSlice";
import { formatVND, formatDateVN } from "../../api/apiClient";
import { StatusBadge } from "../../components/common/StatusBadge";
import { ContractModal } from "../../components/landlord/ContractModal";

// Quản lý Hợp đồng (Đề 4):
// - Tạo hợp đồng gán người thuê vào phòng (chặn tạo nếu phòng đang có hợp đồng hiệu lực)
// - Kết thúc hợp đồng (trạng thái phòng tự động đổi về Trống)
export const LandlordContractsPage = () => {
  const dispatch = useDispatch();
  const { contracts, rooms, contractsError, contractsLoading } = useSelector((state) => state.rooms);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadData = () => {
    dispatch(fetchContracts({ status: statusFilter }));
    dispatch(fetchRooms({ status: "all" }));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleCreateContract = async (payload) => {
    try {
      await dispatch(createContractThunk(payload)).unwrap();
      setFeedback({
        type: "success",
        text: "Tạo hợp đồng thành công! Trạng thái phòng đã tự động chuyển sang Đang thuê.",
      });
      loadData();
    } catch (err) {
      throw new Error(err);
    }
  };

  const handleTerminate = async (contractId) => {
    if (
      !window.confirm(
        "Kết thúc hợp đồng này? Phòng sẽ tự động chuyển về trạng thái Trống."
      )
    ) {
      return;
    }
    try {
      await dispatch(terminateContractThunk(contractId)).unwrap();
      setFeedback({
        type: "info",
        text: "Đã kết thúc hợp đồng! Trạng thái phòng đã tự động chuyển về Trống.",
      });
      loadData();
    } catch (err) {
      setFeedback({ type: "danger", text: err });
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-file-earmark-text-fill me-2 text-primary" />
            Quản Lý Hợp Đồng Thuê Phòng ({contracts.length})
          </h4>
          <p className="text-muted small mb-0">
            Không cho tạo hợp đồng mới vào phòng đang có hợp đồng hiệu lực; trạng thái phòng tự đổi khi tạo/kết thúc hợp đồng.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary fw-semibold"
          onClick={() => setModalOpen(true)}
        >
          <i className="bi bi-file-earmark-plus me-1" /> Tạo Hợp Đồng Mới
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} py-2 small`}>
          {feedback.text}
        </div>
      )}
      {contractsError && <div className="alert alert-danger py-2 small" role="alert">Không thể tải danh sách hợp đồng: {contractsError}</div>}

      <div className="mb-3">
        <div className="btn-group btn-group-sm">
          {[
            { key: "all", label: "Tất cả hợp đồng" },
            { key: "active", label: "Đang hiệu lực" },
            { key: "terminated", label: "Đã kết thúc" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`btn ${
                statusFilter === item.key
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setStatusFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Mã HĐ</th>
                <th>Phòng</th>
                <th>Người thuê</th>
                <th>Thời hạn</th>
                <th className="text-end">Giá thuê / Cọc</th>
                <th>Trạng thái HĐ</th>
                <th>Trạng thái Phòng</th>
                <th className="text-end">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {contractsLoading ? (
                <tr><td colSpan="8" className="text-center py-4 text-muted">Đang tải danh sách hợp đồng…</td></tr>
              ) : contractsError ? (
                <tr><td colSpan="8" className="text-center py-4 text-danger">Không tải được dữ liệu hợp đồng.</td></tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    Chưa có hợp đồng nào.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c._id}>
                    <td className="fw-bold">{c.contractCode}</td>
                    <td>
                      <div className="fw-bold text-primary">
                        {c.roomId?.roomNumber
                          ? `[${c.roomId.roomNumber}] `
                          : ""}
                        {c.roomId?.title}
                      </div>
                      <small className="text-muted">
                        {c.blockId?.name || c.roomId?.district}
                      </small>
                    </td>
                    <td>
                      <div className="fw-semibold">{c.tenantName}</div>
                      <small className="text-muted">
                        {c.tenantEmail} · {c.tenantPhone}
                      </small>
                    </td>
                    <td className="small">
                      Bắt đầu: {formatDateVN(c.startDate)}
                      <br />
                      Kết thúc:{" "}
                      {c.actualEndDate
                        ? formatDateVN(c.actualEndDate)
                        : formatDateVN(c.endDate)}
                    </td>
                    <td className="text-end">
                      <div className="fw-bold text-danger">
                        {formatVND(c.rentPrice)}
                      </div>
                      <small className="text-muted">
                        Cọc: {formatVND(c.deposit)}
                      </small>
                    </td>
                    <td>
                      <StatusBadge type="contract" status={c.status} />
                    </td>
                    <td>
                      <StatusBadge
                        type="room"
                        status={c.roomId?.status || "available"}
                      />
                    </td>
                    <td className="text-end">
                      {c.status === "active" && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleTerminate(c._id)}
                        >
                          <i className="bi bi-x-circle me-1" />
                          Kết thúc HĐ
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContractModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreateContract}
        rooms={rooms}
      />
    </div>
  );
};
