import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomsThunk } from "../store/slices/roomSlice";
import { RoomCard } from "../components/rooms/RoomCard";
import { apiRequest } from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";

const AMENITY_OPTIONS = [
  { value: "Giường", icon: "bi-lamp-fill", label: "Giường" },
  { value: "Tủ quần áo", icon: "bi-Archive-fill", label: "Tủ quần áo" },
  { value: "Bàn làm việc", icon: "bi-laptop", label: "Bàn làm việc" },
  { value: "Điều hòa", icon: "bi-snow", label: "Điều hòa" },
  { value: "Quạt điện", icon: "bi-fan", label: "Quạt điện" },
  { value: "Máy giặt", icon: "bi-droplet-fill", label: "Máy giặt" },
  { value: "Tủ lạnh", icon: "bi-box-seam", label: "Tủ lạnh" },
  { value: "Bếp", icon: "bi-fire", label: "Bếp" },
  { value: "WC riêng", icon: "bi-droplet", label: "WC riêng" },
  { value: "Nóng lạnh", icon: "bi-thermometer-half", label: "Nóng lạnh" },
  { value: "Wifi", icon: "bi-wifi", label: "Wifi" },
  { value: "Cửa sổ", icon: "bi-window", label: "Cửa sổ" },
  { value: "Gương", icon: "bi-square", label: "Gương" },
];

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

export const SearchPage = () => {
  const dispatch = useDispatch();
  const { items: rooms, loading } = useSelector((state) => state.rooms);
  const { isAuthenticated } = useAuth();

  const [searchText, setSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [areaMin, setAreaMin] = useState(0);
  const [areaMax, setAreaMax] = useState(100);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(6000000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState("default");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const searchWrapperRef = useRef(null);

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

  const toggleAmenity = (value) => {
    setSelectedAmenities((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const resetFilters = () => {
    setSearchText("");
    setAreaMin(0);
    setAreaMax(100);
    setPriceMin(0);
    setPriceMax(6000000);
    setSelectedAmenities([]);
    setSortBy("default");
  };

  const suggestions = useMemo(() => {
    const kw = searchText.trim();
    if (!kw || kw.length < 2) return [];
    const kwLower = kw.toLowerCase();
    const list = [];
    const seen = new Set();

    rooms.forEach((room) => {
      if (
        (room.title || "").toLowerCase().includes(kwLower) &&
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
        (room.district || "").toLowerCase().includes(kwLower) &&
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
  }, [rooms, searchText]);

  const filteredAndSortedRooms = useMemo(() => {
    const kw = searchText.trim().toLowerCase();

    const filtered = rooms.filter((room) => {
      if (room.status === "rented" || room.status === "maintenance") {
        return false;
      }

      const matchText =
        !kw ||
        (room.title || "").toLowerCase().includes(kw) ||
        (room.district || "").toLowerCase().includes(kw) ||
        (room.description || room.desc || "").toLowerCase().includes(kw);

      const roomArea = Number(room.area) || 25;
      const matchArea = roomArea >= areaMin && roomArea <= areaMax;

      const roomPrice = Number(room.price) || 0;
      const matchPrice = roomPrice >= priceMin && roomPrice <= priceMax;

      let matchAmenities = true;
      if (selectedAmenities.length > 0) {
        const roomAmenities = room.amenities || [];
        matchAmenities = selectedAmenities.every((amenity) =>
          roomAmenities.includes(amenity)
        );
      }

      return matchText && matchArea && matchPrice && matchAmenities;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "price-asc":
        sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case "price-desc":
        sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case "area-asc":
        sorted.sort(
          (a, b) => (Number(a.area) || 25) - (Number(b.area) || 25)
        );
        break;
      case "area-desc":
        sorted.sort(
          (a, b) => (Number(b.area) || 25) - (Number(a.area) || 25)
        );
        break;
      default:
        break;
    }

    return sorted;
  }, [
    rooms,
    searchText,
    areaMin,
    areaMax,
    priceMin,
    priceMax,
    selectedAmenities,
    sortBy,
  ]);

  return (
    <div className="search-page">
      {/* Left Sidebar - Filters (matching search.html 100%) */}
      <aside className={`search-sidebar ${sidebarOpen ? "show" : ""}`}>
        <div className="sidebar-header">
          <h3>
            <i className="bi bi-funnel"></i> Bộ lọc tìm kiếm
          </h3>
          <button type="button" onClick={resetFilters} className="btn-reset">
            <i className="bi bi-arrow-clockwise"></i> Đặt lại
          </button>
        </div>

        <div className="sidebar-content">
          {/* Search Input with Autocomplete */}
          <div className="filter-section">
            <label className="filter-label">
              <i className="bi bi-search"></i> Tìm kiếm
            </label>
            <div className="search-autocomplete-wrapper" ref={searchWrapperRef}>
              <input
                type="text"
                id="search-input"
                className="form-control"
                placeholder="Tên phòng, địa chỉ..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (searchText.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                autoComplete="off"
              />
              <div
                id="search-suggestions-sidebar"
                className={`search-suggestions ${
                  showSuggestions && searchText.trim().length >= 2
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
                        setSearchText(suggestion.text);
                        setShowSuggestions(false);
                      }}
                    >
                      <i className={`bi bi-${suggestion.icon}`}></i>
                      <div className="search-suggestion-text">
                        <div className="search-suggestion-title">
                          {highlightSegments(
                            suggestion.text,
                            searchText.trim()
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

          {/* Area Range Filter */}
          <div className="filter-section">
            <label className="filter-label">
              <i className="bi bi-arrows-angle-expand"></i> Lọc theo diện tích
            </label>
            <div className="range-values">
              <span>
                <strong id="area-min-value">{areaMin}</strong> m²
              </span>
              <span>
                <strong id="area-max-value">{areaMax}</strong> m²
              </span>
            </div>
            <div
              className="range-slider-wrapper"
              style={{
                "--range-left": `${(areaMin / 100) * 100}%`,
                "--range-width": `${((areaMax - areaMin) / 100) * 100}%`,
              }}
            >
              <input
                type="range"
                id="area-min"
                min="0"
                max="100"
                value={areaMin}
                step="5"
                className="range-slider"
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), areaMax);
                  setAreaMin(val);
                }}
              />
              <input
                type="range"
                id="area-max"
                min="0"
                max="100"
                value={areaMax}
                step="5"
                className="range-slider"
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), areaMin);
                  setAreaMax(val);
                }}
              />
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-section">
            <label className="filter-label">
              <i className="bi bi-currency-dollar"></i> Lọc theo giá
            </label>
            <div className="range-values">
              <span>
                <strong id="price-min-value">
                  {priceMin.toLocaleString("vi-VN")}
                </strong>{" "}
                đ
              </span>
              <span>
                <strong id="price-max-value">
                  {priceMax.toLocaleString("vi-VN")}
                </strong>{" "}
                đ
              </span>
            </div>
            <div
              className="range-slider-wrapper"
              style={{
                "--range-left": `${(priceMin / 6000000) * 100}%`,
                "--range-width": `${((priceMax - priceMin) / 6000000) * 100}%`,
              }}
            >
              <input
                type="range"
                id="price-min"
                min="0"
                max="6000000"
                value={priceMin}
                step="100000"
                className="range-slider"
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), priceMax);
                  setPriceMin(val);
                }}
              />
              <input
                type="range"
                id="price-max"
                min="0"
                max="6000000"
                value={priceMax}
                step="100000"
                className="range-slider"
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), priceMin);
                  setPriceMax(val);
                }}
              />
            </div>
          </div>

          {/* Amenities Filter */}
          <div className="filter-section">
            <label className="filter-label">
              <i className="bi bi-grid-3x3-gap"></i> Lọc theo tiện nghi
            </label>
            <div className="amenities-checkboxes">
              {AMENITY_OPTIONS.map((am) => (
                <label className="checkbox-label" key={am.value}>
                  <input
                    type="checkbox"
                    value={am.value}
                    checked={selectedAmenities.includes(am.value)}
                    onChange={() => toggleAmenity(am.value)}
                  />
                  <span>
                    <i className={`bi ${am.icon}`}></i> {am.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="filter-section">
            <label className="filter-label">
              <i className="bi bi-sort-down"></i> Sắp xếp
            </label>
            <select
              id="sort-by"
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="area-asc">Diện tích: Nhỏ đến lớn</option>
              <option value="area-desc">Diện tích: Lớn đến nhỏ</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="search-main">
        <div className="search-header">
          <h2 id="results-count">
            Tìm thấy {filteredAndSortedRooms.length} phòng trọ
          </h2>
          <button
            type="button"
            className="btn-toggle-sidebar"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <i className="bi bi-funnel"></i> Bộ lọc
          </button>
        </div>

        <div id="room-grid" className="room-grid">
          {loading ? (
            <p className="empty-message">
              <i className="bi bi-hourglass-split"></i> Đang tải danh sách
              phòng...
            </p>
          ) : filteredAndSortedRooms.length === 0 ? (
            <p className="empty-message">
              <i className="bi bi-search"></i> Không tìm thấy phòng nào phù hợp
              với yêu cầu của bạn.
            </p>
          ) : (
            filteredAndSortedRooms.map((room) => {
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
    </div>
  );
};
