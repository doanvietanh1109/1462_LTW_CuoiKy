import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchRoomsThunk } from "../store/slices/roomSlice";
import { useAuth } from "../contexts/AuthContext";
import { apiRequest } from "../api/apiClient";
import {
  RoomCard,
  getSavedRoomsFromStorage,
} from "../components/rooms/RoomCard";

export const BookmarksPage = () => {
  const dispatch = useDispatch();
  const { items: rooms, loading: roomsLoading } = useSelector(
    (state) => state.rooms
  );
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [bookmarkedRooms, setBookmarkedRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchRoomsThunk({ page: 1, limit: 50 }));
  }, [dispatch]);

  const loadBookmarkedRooms = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!isAuthenticated && !token) {
      setBookmarkedRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("/users/bookmarks/list/all");
      const apiRooms = response?.data?.rooms || [];
      if (apiRooms.length > 0) {
        setBookmarkedRooms(apiRooms);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback to localStorage below
    }

    const savedIds = user?.email
      ? getSavedRoomsFromStorage(user.email).map(String)
      : [];
    const matched = rooms.filter((r) =>
      savedIds.includes(String(r._id || r.id))
    );
    setBookmarkedRooms(matched);
    setLoading(false);
  }, [isAuthenticated, user, rooms]);

  useEffect(() => {
    loadBookmarkedRooms();
    window.addEventListener("bookmarks-updated", loadBookmarkedRooms);
    return () =>
      window.removeEventListener("bookmarks-updated", loadBookmarkedRooms);
  }, [loadBookmarkedRooms]);

  const handleBookmarkChange = (roomId, isNowBookmarked) => {
    if (!isNowBookmarked) {
      setBookmarkedRooms((prev) =>
        prev.filter((r) => String(r._id || r.id) !== String(roomId))
      );
    }
  };

  return (
    <main className="main-container">
      <div className="section-header">
        <h2>
          <i className="bi bi-bookmark-heart-fill"></i> Phòng Đã Lưu
        </h2>
        <p className="text-muted">
          Danh sách các phòng trọ bạn đã đánh dấu yêu thích
        </p>
      </div>

      <div id="bookmarks-content">
        {!isAuthenticated ? (
          <div
            className="empty-bookmarks"
            style={{ textAlign: "center", padding: "60px 20px" }}
          >
            <i
              className="bi bi-bookmark-heart"
              style={{ fontSize: "64px", color: "#ddd" }}
            ></i>
            <h3>Vui lòng đăng nhập để xem phòng đã lưu</h3>
            <p className="text-muted">
              Bạn cần đăng nhập để sử dụng tính năng lưu phòng yêu thích
            </p>
            <button
              type="button"
              onClick={openAuthModal}
              className="btn btn-primary mt-3"
            >
              <i className="bi bi-box-arrow-in-right"></i> Đăng nhập ngay
            </button>
          </div>
        ) : loading || roomsLoading ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p className="text-muted">Đang tải danh sách phòng đã lưu...</p>
          </div>
        ) : bookmarkedRooms.length === 0 ? (
          <div
            className="empty-bookmarks"
            style={{ textAlign: "center", padding: "60px 20px" }}
          >
            <i
              className="bi bi-bookmark-heart"
              style={{ fontSize: "64px", color: "#ddd" }}
            ></i>
            <h3>Chưa có phòng nào được lưu</h3>
            <p className="text-muted">
              Hãy khám phá và lưu các phòng trọ yêu thích của bạn
            </p>
            <Link to="/search" className="btn btn-primary mt-3">
              <i className="bi bi-search"></i> Tìm phòng ngay
            </Link>
          </div>
        ) : (
          <div id="room-grid" className="room-grid">
            {bookmarkedRooms.map((room) => {
              const roomId = String(room._id || room.id);
              return (
                <RoomCard
                  key={roomId}
                  room={room}
                  initialBookmarked={true}
                  onBookmarkChange={handleBookmarkChange}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};
