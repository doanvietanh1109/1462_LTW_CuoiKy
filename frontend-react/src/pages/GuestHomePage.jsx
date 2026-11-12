import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomsThunk } from "../store/slices/roomSlice";
import { useDebounce } from "../hooks/useDebounce";
import { RoomCard } from "../components/rooms/RoomCard";
import { apiRequest } from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";

const highlightSegments = (text = "", query = "") => {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return String(text)
    .split(regex)
    .map((part, idx) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={idx} className="search-suggestion-highlight">
          {part}
        </span>
      ) : (
        <React.Fragment key={idx}>{part}</React.Fragment>
      )
    );
};

export const GuestHomePage = () => {
  const dispatch = useDispatch();
  const { items: rooms, loading } = useSelector((state) => state.rooms);
  const { isAuthenticated } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [priceRange, setPriceRange] = useState("all");
  const [roomType, setRoomType] = useState("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const searchWrapperRef = useRef(null);

  // Sử dụng custom hook useDebounce (Tiêu chí 4)
  const debouncedKeyword = useDebounce(searchInput, 250);

  useEffect(() => {
    dispatch(fetchRoomsThunk({ page: 1, limit: 50 }));
  }, [dispatch]);

  useEffect(() => {
    const loadBookmarks = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setBookmarkedIds([]);
        return;
      }
      try {
        const res = await apiRequest("/users/bookmarks/list/all");
        const ids = (res?.data?.rooms || []).map((r) => String(r._id || r.id));
        setBookmarkedIds(ids);
      } catch {
        // fallback handled inside RoomCard
      }
    };
    loadBookmarks();
  }, [isAuthenticated]);

  // Đóng hộp gợi ý khi click ra ngoài (useEffect có cleanup listener - Tiêu chí 4)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Lọc danh sách phòng đúng 100% logic filterRooms() của rooms.js gốc
  const filteredRooms = useMemo(() => {
    const searchText = debouncedKeyword.trim().toLowerCase();
    return rooms.filter((room) => {
      if (room.status === "rented" || room.status === "maintenance") {
        return false;
      }

      const matchText =
        !searchText ||
        (room.title || "").toLowerCase().includes(searchText) ||
        (room.district || "").toLowerCase().includes(searchText);

      const categoryVal = room.category || room.type || "";
      const matchType =
        roomType === "all" ||
        categoryVal === roomType ||
        (roomType === "Trọ" && categoryVal === "Phòng trọ");

      let matchPrice = true;
      const price = Number(room.price) || 0;
      if (priceRange === "under2") matchPrice = price < 2000000;
      else if (priceRange === "2to3")
        matchPrice = price >= 2000000 && price <= 3000000;
      else if (priceRange === "above3") matchPrice = price > 3000000;

      return matchText && matchType && matchPrice;
    });
  }, [rooms, debouncedKeyword, priceRange, roomType]);

  // Gợi ý tìm kiếm giống hệt js/pages/index.js gốc
  const suggestions = useMemo(() => {
    const searchText = searchInput.trim();
    if (!searchText || searchText.length < 2) return [];
    const searchTextLower = searchText.toLowerCase();
    const list = [];
    const seen = new Set();

    rooms.forEach((room) => {
      if (
        (room.title || "").toLowerCase().includes(searchTextLower) &&
        !seen.has(room.title)
      ) {
        list.push({
          type: "room",
          text: room.title,
          subtitle: room.district,
          icon: "house-door",
        });
        seen.add(room.title);
      }

      if (
        (room.district || "").toLowerCase().includes(searchTextLower) &&
        !seen.has(room.district)
      ) {
        list.push({
          type: "location",
          text: room.district,
          subtitle: "Khu vực",
          icon: "geo-alt",
        });
        seen.add(room.district);
      }
    });

    return list.slice(0, 5);
  }, [rooms, searchInput]);

  return (
    <>
      <section className="hero">
        <video autoPlay muted loop playsInline className="hero-video">
          <source src="/video/videodemo.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h2>Tìm chỗ ở phù hợp cho sinh viên</h2>
          <p>
            Hơn +1000 phòng trọ, căn hộ dịch vụ giá rẻ, an ninh, tiện nghi đang
            chờ bạn.
          </p>
          <a href="#room-grid" className="btn btn-warning">
            <i className="bi bi-search"></i> Xem phòng mới nhất
          </a>
        </div>
      </section>

      <main className="main-container">
        <div className="section-header">
          <h2>
            <i className="bi bi-house-door"></i> Phòng mới và nổi bật
          </h2>
        </div>

        <div className="filter-bar row g-3 align-items-center">
          <div className="col-12 col-lg">
            <div className="search-autocomplete-wrapper" ref={searchWrapperRef}>
              <input
                type="text"
                id="search"
                className="form-control"
                placeholder="Nhập tên phòng hoặc khu vực..."
                autoComplete="off"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (searchInput.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
              />
              <div
                id="search-suggestions"
                className={`search-suggestions ${
                  showSuggestions && searchInput.trim().length >= 2
                    ? "show"
                    : ""
                }`}
              >
                {suggestions.length === 0 ? (
                  <div className="search-no-results">
                    Không tìm thấy kết quả
                  </div>
                ) : (
                  suggestions.map((suggestion, idx) => (
                    <div
                      key={`${suggestion.type}-${idx}`}
                      className="search-suggestion-item"
                      onMouseDown={() => {
                        setSearchInput(suggestion.text);
                        setShowSuggestions(false);
                      }}
                    >
                      <i className={`bi bi-${suggestion.icon}`}></i>
                      <div className="search-suggestion-text">
                        <div className="search-suggestion-title">
                          {highlightSegments(
                            suggestion.text,
                            searchInput.trim()
                          )}
                        </div>
                        <div className="search-suggestion-subtitle">
                          {suggestion.subtitle}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <select
              id="priceRange"
              className="form-select"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="all">Tất cả mức giá</option>
              <option value="under2">Dưới 2.000.000</option>
              <option value="2to3">2.000.000 - 3.000.000</option>
              <option value="above3">Trên 3.000.000</option>
            </select>
          </div>

          <div className="col-12 col-md-6 col-lg-3">
            <select
              id="type"
              className="form-select"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
            >
              <option value="all">Tất cả loại hình</option>
              <option value="Trọ">Phòng trọ</option>
              <option value="Căn hộ">Căn hộ dịch vụ</option>
            </select>
          </div>
        </div>

        <div id="room-grid" className="room-grid">
          {loading ? (
            <p className="empty-message">
              <i className="bi bi-hourglass-split"></i> Đang tải danh sách
              phòng...
            </p>
          ) : filteredRooms.length === 0 ? (
            <p className="empty-message">
              <i className="bi bi-search"></i> Không tìm thấy phòng nào phù hợp
              với yêu cầu của bạn.
            </p>
          ) : (
            filteredRooms.map((room) => {
              const roomId = String(room._id || room.id);
              return (
                <RoomCard
                  key={roomId}
                  room={room}
                  initialBookmarked={
                    bookmarkedIds.length > 0
                      ? bookmarkedIds.includes(roomId)
                      : undefined
                  }
                />
              );
            })
          )}
        </div>
      </main>
    </>
  );
};
