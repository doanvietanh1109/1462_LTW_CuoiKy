import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchMotelBlocks,
  createMotelBlockThunk,
  updateMotelBlockThunk,
  deleteMotelBlockThunk,
} from "../../store/slices/roomSlice";
import { formatVND } from "../../api/apiClient";
import { MotelBlockModal } from "../../components/landlord/MotelBlockModal";

export const LandlordBlocksPage = () => {
  const dispatch = useDispatch();
  const { blocks } = useSelector((state) => state.rooms);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    dispatch(fetchMotelBlocks());
  }, [dispatch]);

  const handleSaveBlock = async (payload) => {
    if (editingBlock) {
      await dispatch(
        updateMotelBlockThunk({ id: editingBlock._id, payload })
      ).unwrap();
      setFeedback({ type: "success", text: "Cập nhật dãy trọ thành công!" });
    } else {
      await dispatch(createMotelBlockThunk(payload)).unwrap();
      setFeedback({ type: "success", text: "Thêm dãy trọ mới thành công!" });
    }
    dispatch(fetchMotelBlocks());
  };

  const handleDeleteBlock = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa dãy trọ này?")) return;
    try {
      await dispatch(deleteMotelBlockThunk(id)).unwrap();
      setFeedback({ type: "success", text: "Đã xóa dãy trọ!" });
    } catch (err) {
      setFeedback({ type: "danger", text: err });
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          <h4 className="fw-bold mb-1">
            <i className="bi bi-buildings me-2 text-primary" />
            Quản Lý Các Dãy Nhà Trọ ({blocks.length} dãy)
          </h4>
          <p className="text-muted small mb-0">
            Quản lý một hoặc nhiều dãy trọ kèm đơn giá điện, nước, dịch vụ mặc định
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary fw-semibold"
          onClick={() => {
            setEditingBlock(null);
            setModalOpen(true);
          }}
        >
          <i className="bi bi-plus-circle me-1" /> Thêm Dãy Trọ Mới
        </button>
      </div>

      {feedback && (
        <div className={`alert alert-${feedback.type} py-2 small`}>
          {feedback.text}
        </div>
      )}

      <div className="row g-4">
        {blocks.map((block) => (
          <div key={block._id} className="col-md-6 col-xl-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="fw-bold text-primary mb-0">{block.name}</h5>
                <span className="badge bg-primary bg-opacity-10 text-primary">
                  {block.totalRooms || 0} phòng
                </span>
              </div>

              <p className="text-muted small mb-2">
                <i className="bi bi-geo-alt-fill text-danger me-1" />
                {block.address}
              </p>

              <p className="small text-secondary mb-3">
                {block.description || "Khu nhà trọ an ninh, sạch đẹp."}
              </p>

              <div className="d-flex gap-2 mb-3">
                <span className="badge bg-success">
                  Trống: {block.availableRooms || 0}
                </span>
                <span className="badge bg-primary">
                  Đang thuê: {block.rentedRooms || 0}
                </span>
                <span className="badge bg-warning text-dark">
                  Đang sửa: {block.maintenanceRooms || 0}
                </span>
              </div>

              <div className="p-2 rounded-3 bg-light small mb-3 mt-auto">
                <div>
                  Điện: <strong>{formatVND(block.defaultElectricityPrice)}/kWh</strong>{" "}
                  · Nước: <strong>{formatVND(block.defaultWaterPrice)}/m³</strong>
                </div>
                <div>
                  Phí dịch vụ: <strong>{formatVND(block.defaultServiceFee)}/tháng</strong>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    setEditingBlock(block);
                    setModalOpen(true);
                  }}
                >
                  <i className="bi bi-pencil me-1" /> Sửa
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteBlock(block._id)}
                >
                  <i className="bi bi-trash me-1" /> Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <MotelBlockModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveBlock}
        editingBlock={editingBlock}
      />
    </div>
  );
};
