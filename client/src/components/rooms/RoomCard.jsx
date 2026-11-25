import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { apiRequest } from "../../api/apiClient";
import { RoomImage } from "./RoomImage";
import { getRoomGalleryImages } from "../../utils/roomImages";

export { resolveRoomImageUrl } from "../../utils/roomImages";

const formatVND = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(amount) || 0
  );

export const getSavedRoomsFromStorage = (userEmail) => {
  if (!userEmail) return [];
  try {
    const raw = localStorage.getItem(`savedRooms_${userEmail}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setSavedRoomsToStorage = (userEmail, list) => {
  if (!userEmail) return;
  localStorage.setItem(`savedRooms_${userEmail}`, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("bookmarks-updated"));
};

export const RoomCard = ({
  room,
  initialBookmarked,
  onBookmarkChange,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const roomId = String(room._id || room.id);

  const images = getRoomGalleryImages(room);

  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const [isBookmarked, setIsBookmarked] = useState(() => {
    if (typeof initialBookmarked === "boolean") return initialBookmarked;
    const savedList = getSavedRoomsFromStorage(user?.email);
    return savedList.map(String).includes(roomId);
  });

  useEffect(() => {
    if (typeof initialBookmarked === "boolean") {
      setIsBookmarked(initialBookmarked);
    }
  }, [initialBookmarked]);

  const area = room.area || 25;
  const bedrooms = room.bedrooms || 1;
  const bathrooms = room.bathrooms || 1;
  const priceFormatted = formatVND(room.price);
  const pricePerM2 = area ? Math.round((Number(room.price) || 0) / area) : null;
  const pricePerM2Formatted = pricePerM2 ? formatVND(pricePerM2) : "";
  const daysPosted =
    room.daysPosted || ((parseInt(roomId.slice(-1), 16) % 5) + 1 || 2);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
    }
  };

  const handleToggleBookmark = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("authToken");
    if (!isAuthenticated && !token) {
      openAuthModal();
      return;
    }

    let nextState = !isBookmarked;
    try {
      const response = await apiRequest(`/users/bookmarks/${roomId}`, {
        method: "POST",
      });
      if (typeof response?.data?.bookmarked === "boolean") {
        nextState = response.data.bookmarked;
      }
    } catch {
      // Fallback to localStorage
    }

    if (user?.email) {
      const currentSaved = getSavedRoomsFromStorage(user.email).map(String);
      const nextSaved = nextState
        ? Array.from(new Set([...currentSaved, roomId]))
        : currentSaved.filter((id) => id !== roomId);
      setSavedRoomsToStorage(user.email, nextSaved);
    }

    setIsBookmarked(nextState);
    if (typeof onBookmarkChange === "function") {
      onBookmarkChange(roomId, nextState);
    }
  };

  return (
    <div className="room-card">
      <div className="room-card-image-wrapper">
        <div className="room-card-badge">
          <i className="bi bi-patch-check-fill"></i>
          Tin đáng chất lượng
        </div>
        <RoomImage
          room={room}
          src={images[currentImageIdx]}
          alt={room.title}
          className="room-card-image"
          loading="lazy"
          decoding="async"
          onClick={() => navigate(`/rooms/${roomId}`)}
        />
        <div className="room-card-image-counter">
          <i className="bi bi-camera-fill"></i>
          {currentImageIdx + 1}/{images.length}
        </div>
        <button
          type="button"
          className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
          onClick={handleToggleBookmark}
          title={isBookmarked ? "Bỏ lưu" : "Lưu phòng"}
        >
          <i
            className={`bi ${
              isBookmarked ? "bi-bookmark-heart-fill" : "bi-bookmark-heart"
            }`}
          ></i>
        </button>
        <button
          type="button"
          className="room-card-nav room-card-nav-prev"
          onClick={handlePrevImage}
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        <button
          type="button"
          className="room-card-nav room-card-nav-next"
          onClick={handleNextImage}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      <div
        className="room-card-body"
        onClick={() => navigate(`/rooms/${roomId}`)}
      >
        <div className="room-card-price-row">
          <div>
            <span className="room-card-price">{priceFormatted}</span>
            {pricePerM2 ? (
              <span className="room-card-price-unit">
                {" "}
                · {pricePerM2Formatted}/m²
              </span>
            ) : null}
          </div>
          <div className="room-card-posted">đăng {daysPosted} ngày trước</div>
        </div>
        <h3 className="room-card-title">{room.title}</h3>
        <div className="room-card-location">
          <i className="bi bi-geo-alt-fill"></i>
          {room.district}
        </div>
        <div className="room-card-specs">
          <div className="room-card-spec">
            <i className="bi bi-door-closed"></i>
            {bedrooms} PN
          </div>
          <div className="room-card-spec">
            <i className="bi bi-droplet"></i>
            {bathrooms}
          </div>
          <div className="room-card-spec">
            <i className="bi bi-arrows-angle-expand"></i>
            {area} m²
          </div>
        </div>
      </div>
    </div>
  );
};
