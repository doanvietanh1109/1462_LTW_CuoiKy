import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchRooms,
  fetchMotelBlocks,
  createRoomThunk,
  updateRoomThunk,
  deleteRoomThunk,
  createContractThunk,
} from "../../store/slices/roomSlice";
import { formatVND } from "../../api/apiClient";
import { StatusBadge } from "../../components/common/StatusBadge";
import { RoomFormModal } from "../../components/landlord/RoomFormModal";
import { ContractModal } from "../../components/landlord/ContractModal";

// Quản lý phòng trọ (giá thuê, diện tích, trạng thái Trống / Đang thuê / Đang sửa)
export const LandlordRoomsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { rooms, blocks, loading } = useSelector((state) => state.rooms);

  const [statusFilter, setStatusFilter] = useState("all");
  const [blockFilter, setBlockFilter] = useState("all");
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedRoomForContract, setSelectedRoomForContract] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadData = () => {
    dispatch(fetchMotelBlocks());
    dispatch(
      fetchRooms({
        status: statusFilter,
        blockId: blockFilter,
      })
    );
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, blockFilter]);

  const handleSaveRoom = async (payload) => {
    if (editingRoom) {
      await dispatch(
        updateRoomThunk({ id: editingRoom._id, payload })
      ).unwrap();
      setFeedback({ type: "success", text: "Cập nhật phòng thành công!" });
    } else {
      await dispatch(createRoomThunk(payload)).unwrap();
      setFeedback({ type: "success", text: "Thêm phòng trọ mới thành công!" });
    }
    loadData();
  };

  const handleQuickStatusChange = async (room, newStatus) => {
    try {
      await dispatch(
        updateRoomThunk({ id: room._id, payload: { status: newStatus } })
      ).unwrap();
      setFeedback({
        type: "info",
        text: `Đã đổi trạng thái phòng "${room.title}" sang ${
          newStatus === "available"
            ? "Trống"
            : newStatus === "rented"
            ? "Đang thuê"
            : "Đang sửa"
        }`,
      });
    } catch (err) {
      setFeedback({ type: "danger", text: err });
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;
    await dispatch(deleteRoomThunk(id)).unwrap();
    setFeedback({ type: "success", text: "Đã xóa phòng thành công!" });
  };

  const handleCreateContract = async (payload) => {
    await dispatch(createContractThunk(payload)).unwrap();
    navigate("/landlord/contracts");
  };

  return (
    <div className="landlord-rooms-page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h4 className="landlord-page-title fw-bold mb-1">
            <i className="bi bi-houses-fill me-2 text-primary" />
            Phòng &amp; trạng thái ({rooms.length} phòng)
          </h4>
          <p className="text-muted small mb-0">
            Quản lý giá thuê, diện tích (m²), đơn giá điện nước và 3 trạng thái: Trống / Đang thuê / Đang sửa
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary fw-semibold"
          onClick={() => {
            setEditingRoom(null);
            setRoomModalOpen(true);
          }}
        >
          <i className="bi bi-plus-circle me-1" /> Thêm phòng mới
        </button>
      </div>

      {/* Bộ lọc trạng thái & dãy trọ */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
        <div className="row g-2 align-items-center">
          <div className="col-md-6">
            <div className="btn-group btn-group-sm flex-wrap">
              {[
                { key: "all", label: "Tất cả" },
                { key: "available", label: "Trống" },
                { key: "rented", label: "Đang thuê" },
                { key: "maintenance", label: "Đang sửa" },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  className={`btn ${
                    statusFilter === st.key
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  aria-pressed={statusFilter === st.key}
                  onClick={() => setStatusFilter(st.key)}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="col-md-6 d-flex justify-content-md-end">
            <select
              className="form-select form-select-sm"
              style={{ maxWidth: "260px" }}
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
            >
              <option value="all">Tất cả dãy trọ</option>
              {blocks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} py-2 small`}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 landlord-rooms-table">
              <thead className="table-light">
                <tr>
                  <th>Mã / Tên phòng</th>
                  <th>Dãy trọ</th>
                  <th className="text-center">Diện tích</th>
                  <th className="text-end">Giá thuê</th>
                  <th>Chỉ số hiện tại</th>
                  <th>Người thuê</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room._id}>
                    <td>
                      <div className="fw-bold text-primary">
                        {room.roomNumber ? `[${room.roomNumber}] ` : ""}
                        {room.title}
                      </div>
                      <small className="text-muted">{room.district}</small>
                    </td>
                    <td>{room.blockId?.name || "Chưa gán dãy"}</td>
                    <td className="text-center fw-semibold">
                      {room.area || 25} m²
                    </td>
                    <td className="text-end fw-bold text-danger">
                      {formatVND(room.price)}
                    </td>
                    <td className="small">
                      Điện: <strong>{room.currentElectricity || 0}</strong> kWh
                      <br />
                      Nước: <strong>{room.currentWater || 0}</strong> m³
                    </td>
                    <td>
                      {room.tenant?.name ? (
                        <div>
                          <div className="fw-semibold">{room.tenant.name}</div>
                          <small className="text-muted">
                            {room.tenant.phone}
                          </small>
                        </div>
                      ) : (
                        <span className="text-muted small">Chưa có</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <StatusBadge type="room" status={room.status} />
                        <select
                          className="form-select form-select-sm py-0"
                          style={{ fontSize: "0.75rem" }}
                          value={room.status}
                          onChange={(e) =>
                            handleQuickStatusChange(room, e.target.value)
                          }
                        >
                          <option value="available">Trống</option>
                          <option value="rented">Đang thuê</option>
                          <option value="maintenance">Đang sửa</option>
                        </select>
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {room.status === "available" && (
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={() => {
                              setSelectedRoomForContract(room);
                              setContractModalOpen(true);
                            }}
                            title="Tạo hợp đồng gán người thuê"
                          >
                            <i className="bi bi-file-earmark-plus" /> Hợp đồng
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => {
                            setEditingRoom(room);
                            setRoomModalOpen(true);
                          }}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleDeleteRoom(room._id)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <RoomFormModal
        show={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        onSave={handleSaveRoom}
        editingRoom={editingRoom}
        blocks={blocks}
      />

      <ContractModal
        show={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        onSave={handleCreateContract}
        rooms={rooms}
        preselectedRoom={selectedRoomForContract}
      />
    </div>
  );
};
