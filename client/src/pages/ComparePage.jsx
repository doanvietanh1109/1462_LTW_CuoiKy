import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchRoomsThunk } from "../store/slices/roomSlice";
import { RoomImage } from "../components/rooms/RoomImage";
import { getRoomCoverImage } from "../utils/roomImages";

const formatVND = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(amount) || 0
  );

export const ComparePage = () => {
  const dispatch = useDispatch();
  const { items: rooms } = useSelector((state) => state.rooms);

  const [selectedRooms, setSelectedRooms] = useState({ 1: null, 2: null });
  const [activeSlot, setActiveSlot] = useState(null);
  const [modalSearch, setModalSearch] = useState("");

  useEffect(() => {
    dispatch(fetchRoomsThunk({ page: 1, limit: 50 }));
  }, [dispatch]);

  const openRoomSelector = (slot) => {
    setActiveSlot(slot);
    setModalSearch("");
  };

  const closeRoomSelector = () => {
    setActiveSlot(null);
    setModalSearch("");
  };

  const selectRoom = (room) => {
    if (!activeSlot) return;
    setSelectedRooms((prev) => ({ ...prev, [activeSlot]: room }));
    closeRoomSelector();
  };

  const removeRoom = (slot) => {
    setSelectedRooms((prev) => ({ ...prev, [slot]: null }));
  };

  const modalFilteredRooms = useMemo(() => {
    const kw = modalSearch.trim().toLowerCase();
    if (!kw) return rooms;
    return rooms.filter(
      (r) =>
        (r.title || "").toLowerCase().includes(kw) ||
        (r.district || "").toLowerCase().includes(kw)
    );
  }, [rooms, modalSearch]);

  const renderSlot = (slot) => {
    const room = selectedRooms[slot];
    const otherSlot = slot === 1 ? 2 : 1;
    const otherRoom = selectedRooms[otherSlot];

    if (!room) {
      return (
        <div className="room-placeholder" id={`placeholder-${slot}`}>
          <div className="placeholder-icon">
            <i className="bi bi-plus-circle"></i>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openRoomSelector(slot)}
          >
            <i className="bi bi-plus-lg"></i> Add Room
          </button>
        </div>
      );
    }

    const roomId = String(room._id || room.id);
    const imagePath = getRoomCoverImage(room);
    const priceFormatted = formatVND(room.price);
    const area = Number(room.area) || 25;
    const bedrooms = Number(room.bedrooms) || 1;
    const bathrooms = Number(room.bathrooms) || 1;
    const pricePerM2 = Math.round((Number(room.price) || 0) / area);
    const pricePerM2Formatted = formatVND(pricePerM2);
    const amenities = Array.isArray(room.amenities) ? room.amenities : [];

    // Highlight comparisons (matching js/pages/compare.js)
    let priceHighlight = "";
    let areaHighlight = "";
    let pricePerM2Highlight = "";

    if (otherRoom) {
      const rPrice = Number(room.price) || 0;
      const oPrice = Number(otherRoom.price) || 0;
      if (rPrice < oPrice) priceHighlight = "better";
      else if (rPrice > oPrice) priceHighlight = "worse";

      const oArea = Number(otherRoom.area) || 25;
      if (area > oArea) areaHighlight = "better";
      else if (area < oArea) areaHighlight = "worse";

      const otherPricePerM2 = Math.round(oPrice / oArea);
      if (pricePerM2 < otherPricePerM2) pricePerM2Highlight = "better";
      else if (pricePerM2 > otherPricePerM2) pricePerM2Highlight = "worse";
    }

    return (
      <div
        className="room-content"
        id={`room-${slot}`}
        style={{ display: "block" }}
      >
        <div className="room-header">
          <RoomImage
            room={room}
            src={imagePath}
            alt={room.title}
            className="room-image"
            loading="lazy"
            decoding="async"
          />
          <button
            type="button"
            className="room-remove-btn"
            onClick={() => removeRoom(slot)}
            title="Xóa phòng"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        <div className="room-body">
          <h2 className="room-title">{room.title}</h2>
          <div className="room-location">
            <i className="bi bi-geo-alt-fill"></i>
            {room.district}
          </div>
          <div className={`room-price ${priceHighlight}`}>{priceFormatted}</div>

          <div className="compare-table">
            <div className="compare-row">
              <div className="compare-label">
                <i className="bi bi-cash-coin"></i>
                Giá thuê
              </div>
              <div className={`compare-value ${priceHighlight}`}>
                {priceFormatted}/tháng
              </div>
            </div>

            <div className="compare-row">
              <div className="compare-label">
                <i className="bi bi-calculator"></i>
                Giá/m²
              </div>
              <div className={`compare-value ${pricePerM2Highlight}`}>
                {pricePerM2Formatted}/m²
              </div>
            </div>

            <div className="compare-row">
              <div className="compare-label">
                <i className="bi bi-door-closed"></i>
                Phòng ngủ
              </div>
              <div className="compare-value">{bedrooms} PN</div>
            </div>

            <div className="compare-row">
              <div className="compare-label">
                <i className="bi bi-droplet"></i>
                Phòng tắm
              </div>
              <div className="compare-value">{bathrooms} WC</div>
            </div>

            <div className="compare-row">
              <div className="compare-label">
                <i className="bi bi-arrows-angle-expand"></i>
                Diện tích
              </div>
              <div className={`compare-value ${areaHighlight}`}>{area} m²</div>
            </div>

            <div className="compare-row">
              <div className="compare-label">
                <i className="bi bi-house-door"></i>
                Loại phòng
              </div>
              <div className="compare-value">
                {room.category || room.type || "Phòng trọ"}
              </div>
            </div>

            <div
              className="compare-row"
              style={{ flexDirection: "column", alignItems: "flex-start" }}
            >
              <div className="compare-label" style={{ marginBottom: "8px" }}>
                <i className="bi bi-grid-3x3-gap"></i>
                Tiện ích ({amenities.length})
              </div>
              <div className="amenities-list">
                {amenities.length > 0 ? (
                  amenities.map((a, idx) => (
                    <span key={idx} className="amenity-badge">
                      <i className="bi bi-check2"></i> {a}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#999" }}>Chưa cập nhật</span>
                )}
              </div>
            </div>
          </div>

          <Link
            to={`/rooms/${roomId}`}
            className="btn btn-primary room-action-btn"
          >
            <i className="bi bi-eye"></i> Xem Chi Tiết
          </Link>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="container compare-container">
        <div className="compare-header">
          <h1>
            <i className="bi bi-arrow-left-right"></i> So Sánh Phòng Trọ
          </h1>
          <p>
            Chọn 2 phòng để so sánh chi tiết và tìm ra lựa chọn phù hợp nhất
          </p>
        </div>

        <div className="compare-grid">
          <div className="compare-column" id="slot-1">
            {renderSlot(1)}
          </div>
          <div className="compare-column" id="slot-2">
            {renderSlot(2)}
          </div>
        </div>
      </div>

      {/* Room Selection Modal (matching compare.html 100%) */}
      <div
        id="room-selector-modal"
        className={`modal-overlay ${activeSlot ? "show" : ""}`}
        onClick={(e) => {
          if (e.target.id === "room-selector-modal") closeRoomSelector();
        }}
      >
        <div className="modal-content-wrapper">
          <div className="modal-header">
            <h3>
              <i className="bi bi-search"></i> Chọn Phòng Để So Sánh
            </h3>
            <button
              type="button"
              className="modal-close"
              onClick={closeRoomSelector}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="modal-search">
            <input
              type="text"
              id="modal-search-input"
              className="form-control"
              placeholder="Tìm kiếm phòng theo tên, địa chỉ..."
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
            />
          </div>
          <div id="room-list" className="room-list">
            {modalFilteredRooms.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#999",
                  padding: "40px",
                }}
              >
                Không tìm thấy phòng nào
              </p>
            ) : (
              modalFilteredRooms.map((r) => {
                const rId = String(r._id || r.id);
                const imagePath = getRoomCoverImage(r);
                const priceFormatted = formatVND(r.price);
                return (
                  <div
                    key={rId}
                    className="room-list-item"
                    onClick={() => selectRoom(r)}
                  >
                    <RoomImage
                      room={r}
                      src={imagePath}
                      alt={r.title}
                      className="room-list-item-image"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="room-list-item-info">
                      <div className="room-list-item-title">{r.title}</div>
                      <div className="room-list-item-location">
                        <i className="bi bi-geo-alt-fill"></i> {r.district}
                      </div>
                      <div className="room-list-item-price">
                        {priceFormatted}/tháng
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};
