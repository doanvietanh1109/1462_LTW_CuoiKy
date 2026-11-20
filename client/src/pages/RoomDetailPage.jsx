import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoomsThunk } from "../store/slices/roomSlice";
import { apiRequest } from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";
import { createContractFromBooking } from "../utils/tenantContractHelper";
import { GuestContactForm } from "../components/rooms/GuestContactForm";

const formatVND = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(amount) || 0
  );

const resolveImageUrl = (src) => {
  if (!src) return "/images/room1.jpg";
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("/")
  ) {
    return src;
  }
  if (!src.startsWith("images/")) {
    return `/images/${src}`;
  }
  return `/${src}`;
};

const getAmenityIcon = (amenity = "") => {
  const iconMap = {
    "Giường": "bi-lamp-fill",
    "Tủ quần áo": "bi-Archive-fill",
    "Bàn làm việc": "bi-laptop",
    "Điều hòa": "bi-snow",
    "Quạt điện": "bi-fan",
    "Máy giặt": "bi-droplet-fill",
    "Tủ lạnh": "bi-box-seam",
    "Bếp": "bi-fire",
    "WC riêng": "bi-droplet",
    "Nóng lạnh": "bi-thermometer-half",
    "Wifi": "bi-wifi",
    "Cửa sổ": "bi-window",
    "Gương": "bi-square",
    "Chỗ để xe": "bi-car-front",
    "An ninh": "bi-shield-check",
  };
  return iconMap[amenity] || "bi-check-circle-fill";
};

export const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: rooms } = useSelector((state) => state.rooms);
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Reviews state (matching js/features/reviews.js)
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");

  // Edit Review Modal (#editReviewModal)
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);
  const [editComment, setEditComment] = useState("");

  // Payment Modal (#payModal - Thanh Toán Giữ Chỗ)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState(null);
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [contractDuration, setContractDuration] = useState(6);
  const [isContractPreviewOpen, setIsContractPreviewOpen] = useState(false);

  useEffect(() => {
    if (!rooms.length) {
      dispatch(fetchRoomsThunk({ page: 1, limit: 50 }));
    }
  }, [dispatch, rooms.length]);

  useEffect(() => {
    let isMounted = true;
    const loadDetail = async () => {
      try {
        setLoading(true);
        const res = await apiRequest(`/rooms/${id}`);
        if (isMounted && res?.data?.room) {
          setRoom(res.data.room);
          setCurrentImageIdx(0);
        }
      } catch {
        const fallback = rooms.find(
          (r) => String(r._id || r.id) === String(id)
        );
        if (isMounted && fallback) {
          setRoom(fallback);
          setCurrentImageIdx(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const loadReviews = async () => {
      try {
        const res = await apiRequest(`/reviews/room/${id}`);
        if (isMounted && res?.data?.reviews) {
          setReviews(res.data.reviews);
        }
      } catch {
        try {
          const allLocal = JSON.parse(
            localStorage.getItem("APP_REVIEWS") || "[]"
          );
          if (isMounted) {
            setReviews(
              allLocal.filter((r) => String(r.roomId) === String(id))
            );
          }
        } catch {
          if (isMounted) setReviews([]);
        }
      }
    };

    const checkBookmarkStatus = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsBookmarked(false);
        return;
      }
      try {
        const res = await apiRequest("/users/bookmarks/list/all");
        const bookmarkedIds = (res?.data?.rooms || []).map((r) =>
          String(r._id || r.id)
        );
        if (isMounted) {
          setIsBookmarked(bookmarkedIds.includes(String(id)));
        }
      } catch {
        // ignore
      }
    };

    loadDetail();
    loadReviews();
    checkBookmarkStatus();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => {
      isMounted = false;
    };
  }, [id, rooms, isAuthenticated]);

  const images = useMemo(() => {
    if (!room) return ["/images/room1.jpg"];
    if (Array.isArray(room.images) && room.images.length > 0) {
      return room.images.map(resolveImageUrl);
    }
    const primary = room.image || room.img;
    return [resolveImageUrl(primary)];
  }, [room]);

  const toggleBookmarkDetail = async () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    const roomId = room?._id || room?.id || id;
    try {
      const response = await apiRequest(`/users/bookmarks/${roomId}`, {
        method: "POST",
      });
      setIsBookmarked(Boolean(response?.data?.bookmarked));
    } catch {
      setIsBookmarked((prev) => !prev);
    }
  };

  const previousImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    if (images.length <= 1) return;
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  // Mở/đóng Modal Thanh Toán Giữ Chỗ (matching js/features/booking.js)
  const openModal = () => {
    setDiscountedPrice(null);
    setCouponInput("");
    setCouponMsg(null);
    setIsPayModalOpen(true);
  };

  const closeModal = () => {
    setIsPayModalOpen(false);
  };

  // Áp dụng mã giảm giá (matching js/features/coupons.js)
  const applyCoupon = () => {
    if (!room) return;
    const roomPrice = Number(room.price) || 0;
    const code = couponInput.trim().toUpperCase();

    if (!code) {
      setCouponMsg({
        type: "error",
        text: "Vui lòng nhập mã giảm giá!",
      });
      return;
    }

    const percent = Math.floor(Math.random() * 26) + 5;
    const discount = Math.round((roomPrice * percent) / 100);
    const finalPrice = Math.max(roomPrice - discount, 0);

    setDiscountedPrice(finalPrice);
    setCouponMsg({
      type: "success",
      text: `Áp dụng mã ${code}: Giảm ${percent}% (${formatVND(discount)})`,
    });
  };

  // Xác nhận đặt phòng & tự động khởi tạo Hợp đồng + Hóa đơn tháng (matching js/features/booking.js + Đề 4)
  const confirmBooking = async () => {
    if (!isAuthenticated || !user) {
      alert("Vui lòng đăng nhập để đặt phòng!");
      closeModal();
      openAuthModal();
      return;
    }

    const roomId = room._id || room.id;
    const finalPrice =
      discountedPrice !== null ? discountedPrice : Number(room.price) || 0;

    // Tự động tạo Hợp đồng điện tử & Bảng kê hóa đơn cho người thuê
    try {
      await createContractFromBooking({
        room,
        user,
        durationMonths: contractDuration,
        finalPrice,
        couponCode: couponInput.trim().toUpperCase(),
      });
    } catch (error) {
      alert(error.message || "Không thể tạo yêu cầu thuê phòng. Vui lòng thử lại.");
      return;
    }

    closeModal();
    setIsContractPreviewOpen(false);
    const goPortal = window.confirm(
      "🎉 Đặt phòng & Khởi tạo Hợp đồng thuê thành công!\n\nBạn có muốn chuyển đến trang 'Phòng & Hóa đơn của tôi' để xem Hợp đồng điện tử và Bảng kê hóa đơn chi tiết ngay bây giờ không?"
    );
    if (goPortal) {
      navigate("/tenant/my-room");
    }
  };

  // Gửi đánh giá (matching js/features/reviews.js)
  const submitReview = async () => {
    if (!isAuthenticated || !user) {
      alert("Bạn cần đăng nhập để gửi đánh giá!");
      return;
    }
    if (!commentText.trim()) {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }
    if (rating === 0) {
      alert("Vui lòng chọn số sao đánh giá!");
      return;
    }

    const roomId = room._id || room.id;
    try {
      const res = await apiRequest("/reviews", {
        method: "POST",
        body: JSON.stringify({
          room: roomId,
          rating,
          comment: commentText.trim(),
        }),
      });
      const created = res?.data?.review || {
        _id: `local-${Date.now()}`,
        roomId,
        user: user._id || user.id,
        userEmail: user.email,
        userName: user.name,
        rating,
        comment: commentText.trim(),
        createdAt: new Date().toISOString(),
      };
      setReviews((prev) => [created, ...prev]);
    } catch {
      const fallbackReview = {
        id: Date.now(),
        roomId,
        userEmail: user.email,
        userName: user.name,
        rating,
        comment: commentText.trim(),
        date: new Date().toLocaleDateString("vi-VN"),
      };
      const allReviews = JSON.parse(
        localStorage.getItem("APP_REVIEWS") || "[]"
      );
      allReviews.push(fallbackReview);
      localStorage.setItem("APP_REVIEWS", JSON.stringify(allReviews));
      setReviews((prev) => [fallbackReview, ...prev]);
    }

    setCommentText("");
    setRating(0);
    setHoverRating(0);
  };

  const openEditReviewModal = (rev) => {
    setEditingReview(rev);
    setEditRating(Number(rev.rating) || 5);
    setEditHoverRating(0);
    setEditComment(rev.comment || "");
  };

  const closeEditReviewModal = () => {
    setEditingReview(null);
  };

  const saveEditedReview = async () => {
    if (!editingReview) return;
    if (!editComment.trim()) {
      alert("Vui lòng nhập nội dung đánh giá!");
      return;
    }
    if (editRating === 0) {
      alert("Vui lòng chọn số sao đánh giá!");
      return;
    }
    const revId = editingReview._id || editingReview.id;
    try {
      await apiRequest(`/reviews/${revId}`, {
        method: "PATCH",
        body: JSON.stringify({
          rating: editRating,
          comment: editComment.trim(),
        }),
      });
    } catch {
      // fallback local update
    }
    setReviews((prev) =>
      prev.map((r) =>
        String(r._id || r.id) === String(revId)
          ? { ...r, rating: editRating, comment: editComment.trim() }
          : r
      )
    );
    closeEditReviewModal();
  };

  const confirmDeleteReview = async (rev) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa đánh giá này?")) return;
    const revId = rev._id || rev.id;
    try {
      await apiRequest(`/reviews/${revId}`, {
        method: "DELETE",
      });
    } catch {
      // fallback local delete
    }
    setReviews((prev) =>
      prev.filter((r) => String(r._id || r.id) !== String(revId))
    );
  };

  if (loading) {
    return (
      <div className="container">
        <a
          href="/#"
          className="back-btn btn btn-outline-primary btn-sm"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <i className="bi bi-arrow-left"></i> Quay lại danh sách
        </a>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p className="text-muted">Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container">
        <a
          href="/#"
          className="back-btn btn btn-outline-primary btn-sm"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <i className="bi bi-arrow-left"></i> Quay lại danh sách
        </a>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Không tìm thấy thông tin phòng trọ này!</h2>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="btn-confirm"
            style={{ width: "200px", marginTop: "20px" }}
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  const amenities =
    Array.isArray(room.amenities) && room.amenities.length > 0
      ? room.amenities
      : ["Wifi", "Chỗ để xe", "An ninh"];

  const mapAddress = `${room.district || "Hà Nội"}, Việt Nam`;
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapAddress
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <>
      <div className="container">
        <a
          href="/#"
          className="back-btn btn btn-outline-primary btn-sm"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <i className="bi bi-arrow-left"></i> Quay lại danh sách
        </a>

        <div className="detail-grid" id="detail-content">
          <div className="main-info">
            <div className="image-gallery-wrapper">
              <img
                id="room-img"
                src={images[currentImageIdx]}
                className="main-img img-fluid"
                alt={room.title}
                onError={(e) => {
                  e.currentTarget.src = "/images/room1.jpg";
                }}
              />
              <div className="image-counter">
                <i className="bi bi-camera-fill"></i>
                <span id="current-image">{currentImageIdx + 1}</span>/
                <span id="total-images">{images.length}</span>
              </div>
              <button
                type="button"
                className={`bookmark-btn ${isBookmarked ? "bookmarked" : ""}`}
                id="bookmark-btn"
                onClick={toggleBookmarkDetail}
                title={isBookmarked ? "Bỏ lưu" : "Lưu phòng"}
              >
                <i
                  className={`bi ${
                    isBookmarked
                      ? "bi-bookmark-heart-fill"
                      : "bi-bookmark-heart"
                  }`}
                ></i>
              </button>
              <button
                type="button"
                className="image-nav image-nav-prev"
                id="prev-image-btn"
                onClick={previousImage}
                style={{ display: images.length <= 1 ? "none" : "flex" }}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button
                type="button"
                className="image-nav image-nav-next"
                id="next-image-btn"
                onClick={nextImage}
                style={{ display: images.length <= 1 ? "none" : "flex" }}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
              <div
                className="image-thumbnails"
                id="image-thumbnails"
                style={{ display: images.length <= 1 ? "none" : "flex" }}
              >
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumbnail-item ${
                      idx === currentImageIdx ? "active" : ""
                    }`}
                    onClick={() => setCurrentImageIdx(idx)}
                  >
                    <img
                      src={img}
                      alt={`Ảnh ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.src = "/images/room1.jpg";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="info-content">
              <span
                id="room-category"
                className="category-tag badge text-bg-warning"
              >
                {room.category || room.type || "Phòng trọ"}
              </span>
              <h1 id="room-title" className="title">
                {room.title}
              </h1>
              <p id="room-address" className="text-muted">
                <i className="bi bi-geo-alt"></i> {room.district}
              </p>

              <h3 className="section-title">Nội thất &amp; Tiện ích</h3>
              <ul id="amenities-list" className="amenities-list">
                {amenities.map((item, idx) => (
                  <li key={idx}>
                    <i className={`bi ${getAmenityIcon(item)}`}></i> {item}
                  </li>
                ))}
              </ul>

              <h3 className="section-title">Mô tả căn hộ</h3>
              <p id="room-description" className="text-secondary">
                {room.description ||
                  room.desc ||
                  "Không gian thoáng sáng, an ninh, thuận tiện đi học. Liên hệ chủ trọ để xem phòng."}
              </p>

              <h3 className="section-title">Vị trí trên bản đồ</h3>
              <div id="map-container" className="map-container mb-4">
                <iframe
                  id="google-map"
                  width="100%"
                  height="400"
                  style={{ border: 0, borderRadius: "8px" }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapUrl}
                  title="Vị trí phòng trọ"
                ></iframe>
              </div>

              <section className="reviews-section">
                <h3 className="review-title">
                  <i className="bi bi-star-fill"></i> Đánh giá từ người thuê
                </h3>

                <div className="review-form-card">
                  {!isAuthenticated ? (
                    <div style={{ textAlign: "center", padding: "30px 20px" }}>
                      <i
                        className="bi bi-lock-fill"
                        style={{
                          fontSize: "48px",
                          color: "#0077b6",
                          marginBottom: "15px",
                          display: "block",
                        }}
                      ></i>
                      <h4
                        style={{
                          color: "#2d3436",
                          marginBottom: "10px",
                          fontSize: "18px",
                        }}
                      >
                        Đăng nhập để viết đánh giá
                      </h4>
                      <p
                        style={{
                          color: "#636e72",
                          marginBottom: "20px",
                          fontSize: "14px",
                        }}
                      >
                        Bạn cần đăng nhập để chia sẻ trải nghiệm của mình về
                        phòng trọ này
                      </p>
                      <button
                        type="button"
                        onClick={openAuthModal}
                        className="review-submit-btn"
                        style={{ width: "auto", padding: "12px 30px" }}
                      >
                        <i className="bi bi-box-arrow-in-right"></i> Đăng nhập
                        ngay
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="review-form-title">
                        Viết đánh giá của bạn
                      </h4>

                      <div className="review-stars-input">
                        <label className="stars-label">Đánh giá:</label>
                        <div className="star-rating-input">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const activeVal = hoverRating || rating;
                            return (
                              <i
                                key={val}
                                className={`bi ${
                                  val <= activeVal
                                    ? "bi-star-fill active"
                                    : "bi-star"
                                } star-icon`}
                                data-rating={val}
                                onMouseEnter={() => setHoverRating(val)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(val)}
                              ></i>
                            );
                          })}
                        </div>
                      </div>

                      <textarea
                        id="review-content"
                        rows="3"
                        className="review-textarea"
                        placeholder="Chia sẻ trải nghiệm của bạn về phòng trọ này..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      ></textarea>
                      <button
                        type="button"
                        onClick={submitReview}
                        className="review-submit-btn"
                      >
                        <i className="bi bi-send-fill"></i> Gửi đánh giá
                      </button>
                    </>
                  )}
                </div>

                <div id="reviews-list" className="reviews-list">
                  {reviews.length === 0 ? (
                    <p className="no-reviews">
                      Chưa có đánh giá nào cho phòng này. Hãy là người đầu tiên!
                    </p>
                  ) : (
                    reviews.map((rev, idx) => {
                      const revId = rev._id || rev.id || idx;
                      const currentUserId = user?._id || user?.id;
                      const reviewUserId = rev.user?._id || rev.user;
                      const isOwner =
                        user &&
                        ((currentUserId &&
                          reviewUserId &&
                          String(currentUserId) === String(reviewUserId)) ||
                          (user.email && rev.userEmail === user.email));
                      const displayDate =
                        rev.date ||
                        (rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString("vi-VN")
                          : "");
                      const starCount = Number(rev.rating) || 5;

                      return (
                        <div key={revId} className="review-item">
                          <div className="review-header">
                            <div>
                              <span className="review-author">
                                {rev.userName ||
                                  rev.user?.name ||
                                  "Người thuê"}
                              </span>
                              <span className="review-stars">
                                {Array.from({ length: starCount }).map(
                                  (_, sIdx) => (
                                    <i
                                      key={`f-${sIdx}`}
                                      className="bi bi-star-fill"
                                    ></i>
                                  )
                                )}
                                {Array.from({
                                  length: Math.max(0, 5 - starCount),
                                }).map((_, sIdx) => (
                                  <i
                                    key={`e-${sIdx}`}
                                    className="bi bi-star"
                                  ></i>
                                ))}
                              </span>
                            </div>
                            {isOwner && (
                              <div className="review-actions">
                                <button
                                  type="button"
                                  className="btn-edit-review"
                                  onClick={() => openEditReviewModal(rev)}
                                  title="Chỉnh sửa"
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn-delete-review"
                                  onClick={() => confirmDeleteReview(rev)}
                                  title="Xóa"
                                >
                                  <i className="bi bi-trash-fill"></i>
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="review-text">{rev.comment}</p>
                          <small className="review-date">{displayDate}</small>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </div>
          </div>

          <div className="sidebar">
            <div className="price-box">
              <div className="price-badge">
                <i className="bi bi-lightning-charge-fill"></i> Giá tốt
              </div>
              <div className="price-header">
                <i className="bi bi-house-door-fill"></i>
                <span>Giá thuê</span>
              </div>
              <div id="room-price" className="price">
                {formatVND(room.price)} <span>/tháng</span>
              </div>
              <p className="price-note">Đã bao gồm phí quản lý</p>
            </div>

            <div className="contact-box">
              <div className="contact-header">
                <i className="bi bi-person-circle"></i>
                <h3 className="contact-title">Thông tin chủ nhà</h3>
              </div>
              <div className="owner-info">
                <div className="info-row">
                  <i className="bi bi-person-badge"></i>
                  <span id="owner-name">
                    {room.ownerName || "Chủ trọ Demo"}
                  </span>
                </div>
                <div className="info-row">
                  <i className="bi bi-telephone-fill"></i>
                  <span id="owner-phone">
                    {room.ownerPhone || "0987.654.321"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={openModal}
                className="btn-book btn btn-success w-100"
              >
                <i className="bi bi-calendar-check"></i> Đặt phòng ngay
              </button>
              <button
                type="button"
                onClick={() => setIsContractPreviewOpen(true)}
                className="btn btn-outline-primary w-100 mt-2 fw-semibold"
                style={{ borderRadius: "10px", padding: "10px 14px" }}
              >
                <i className="bi bi-file-earmark-text me-1"></i> Xem mẫu Hợp đồng &amp; Bảng phí
              </button>
            </div>

            {!isAuthenticated && room.status === "available" && (
              <div className="room-guest-contact">
                <GuestContactForm
                  roomId={room._id || room.id || id}
                  roomTitle={room.title}
                />
              </div>
            )}

            <div className="features-box">
              <h4 className="features-title">
                <i className="bi bi-shield-check"></i> Cam kết của chúng tôi
              </h4>
              <ul className="features-list">
                <li>
                  <i className="bi bi-check-circle-fill"></i> Thông tin chính
                  xác 100%
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i> Hỗ trợ xem phòng
                  miễn phí
                </li>
                <li
                  style={{ cursor: "pointer" }}
                  onClick={() => setIsContractPreviewOpen(true)}
                  title="Bấm để xem mẫu hợp đồng pháp lý"
                >
                  <i className="bi bi-check-circle-fill"></i> Tư vấn pháp lý hợp
                  đồng <span className="badge bg-primary ms-1">Xem mẫu</span>
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i> Bảo mật thông tin
                  khách hàng
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thanh Toán Giữ Chỗ (#payModal - giống hệt detail.html + tùy chọn kỳ hạn hợp đồng) */}
      <div
        id="payModal"
        className="modal"
        style={{ display: isPayModalOpen ? "flex" : "none" }}
        onClick={(e) => {
          if (e.target.id === "payModal") closeModal();
        }}
      >
        <div className="modal-content shadow-lg">
          <h2 className="modal-title">Thanh Toán Giữ Chỗ</h2>
          <p className="modal-price-wrapper">
            <span>Số tiền giữ chỗ</span>{" "}
            <strong id="modal-price" className="modal-price-val">
              {discountedPrice !== null ? (
                <>
                  <span className="old-price">{formatVND(room.price)}</span>{" "}
                  <br /> {formatVND(discountedPrice)}
                </>
              ) : (
                formatVND(room.price)
              )}
            </strong>
          </p>
          <p className="text-muted">
            Bạn sẽ thanh toán tiền khi đến xem phòng trực tiếp. Hệ thống sẽ tự động khởi tạo <strong>Hợp đồng điện tử &amp; Bảng kê hóa đơn</strong> cho tài khoản của bạn.
          </p>

          <div className="mb-3 text-start">
            <label className="form-label fw-semibold small text-secondary mb-1">
              <i className="bi bi-calendar-range me-1 text-primary"></i>
              Thời hạn hợp đồng dự kiến:
            </label>
            <select
              className="form-select form-select-sm"
              value={contractDuration}
              onChange={(e) => setContractDuration(Number(e.target.value))}
            >
              <option value={6}>6 tháng (Tiêu chuẩn sinh viên / người đi làm)</option>
              <option value={12}>12 tháng (Ưu đãi ổn định giá thuê 1 năm)</option>
              <option value={3}>3 tháng (Ngắn hạn)</option>
            </select>
          </div>

          <div className="coupon-panel">
            <p className="coupon-label">Mã giảm giá (Coupon):</p>
            <div className="coupon-input-group">
              <input
                type="text"
                id="coupon-input"
                placeholder="Nhập mã tại đây..."
                className="coupon-input form-control"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="btn-apply btn btn-primary"
              >
                Áp dụng
              </button>
            </div>
            <p
              id="coupon-msg"
              className={
                couponMsg
                  ? couponMsg.type === "error"
                    ? "coupon-msg-error"
                    : "coupon-msg-success"
                  : "coupon-msg"
              }
            >
              {couponMsg && (
                <>
                  <i
                    className={`bi ${
                      couponMsg.type === "error"
                        ? "bi-exclamation-circle"
                        : "bi-check-circle"
                    }`}
                  ></i>{" "}
                  {couponMsg.text}
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={confirmBooking}
            className="btn-confirm btn btn-primary"
          >
            <i className="bi bi-check2-circle"></i> Xác nhận đặt phòng &amp; Tạo hợp đồng
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="btn btn-link w-100 mt-2"
          >
            Đóng lại
          </button>
        </div>
      </div>

      {/* Modal Xem Mẫu Hợp Đồng & Bảng Phí Dự Kiến */}
      <div
        id="contractPreviewModal"
        className="modal"
        style={{ display: isContractPreviewOpen ? "flex" : "none" }}
        onClick={(e) => {
          if (e.target.id === "contractPreviewModal")
            setIsContractPreviewOpen(false);
        }}
      >
        <div
          className="modal-content shadow-lg"
          style={{ maxWidth: "700px", padding: "28px" }}
        >
          <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
            <div>
              <span className="badge bg-primary-subtle text-primary mb-1">
                Văn bản pháp lý mẫu · RIPT Rental
              </span>
              <h4 className="fw-bold mb-0 text-primary">
                <i className="bi bi-file-earmark-check me-2"></i>
                DỰ THẢO HỢP ĐỒNG THUÊ PHÒNG TRỌ
              </h4>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setIsContractPreviewOpen(false)}
            ></button>
          </div>

          <div
            className="p-3 rounded-3 mb-3"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="row g-2 small">
              <div className="col-md-6">
                <div className="text-muted fw-semibold">BÊN CHO THUÊ (BÊN A):</div>
                <div className="fw-bold text-dark">
                  {room.ownerName || "Chủ trọ Demo (Hệ thống RIPT Rental)"}
                </div>
                <div>SĐT: {room.ownerPhone || "0987.654.321"}</div>
              </div>
              <div className="col-md-6">
                <div className="text-muted fw-semibold">BÊN THUÊ PHÒNG (BÊN B):</div>
                <div className="fw-bold text-dark">
                  {user?.name || "Khách thuê phòng (Sẽ cập nhật khi ký)"}
                </div>
                <div>Email: {user?.email || "Chưa đăng nhập"}</div>
              </div>
            </div>
          </div>

          <h6 className="fw-bold text-dark mb-2">
            1. Thông tin phòng &amp; Biểu phí định kỳ hàng tháng
          </h6>
          <div className="table-responsive mb-3">
            <table className="table table-bordered table-sm align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Hạng mục</th>
                  <th>Đơn giá cam kết</th>
                  <th>Ghi chú tính phí</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="fw-semibold">Tiền thuê phòng ({room.title})</td>
                  <td className="fw-bold text-danger">
                    {formatVND(room.price)} / tháng
                  </td>
                  <td className="small text-muted">Cố định suốt kỳ hợp đồng</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Tiền đặt cọc giữ phòng</td>
                  <td className="fw-bold">{formatVND(room.price)}</td>
                  <td className="small text-muted">Hoàn trả 100% khi kết thúc HĐ</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Đơn giá Điện sinh hoạt</td>
                  <td className="fw-bold">
                    {formatVND(room.electricityPrice || 3500)} / kWh
                  </td>
                  <td className="small text-muted">Theo đồng hồ riêng từng phòng</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Đơn giá Nước sinh hoạt</td>
                  <td className="fw-bold">
                    {formatVND(room.waterPrice || 15000)} / m³
                  </td>
                  <td className="small text-muted">Theo đồng hồ nước riêng</td>
                </tr>
                <tr>
                  <td className="fw-semibold">Phí dịch vụ (Wifi, rác, an ninh)</td>
                  <td className="fw-bold">
                    {formatVND(room.serviceFee || 150000)} / tháng
                  </td>
                  <td className="small text-muted">Trọn gói hàng tháng</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="small text-secondary mb-3">
            <strong>Cam kết hợp đồng:</strong> Bên A bàn giao phòng đúng hiện trạng{" "}
            <strong>{room.area || 25} m²</strong> tại <strong>{room.district}</strong>;
            phát hành hóa đơn điện tử chi tiết từng khoản từ ngày 01–05 hàng tháng.
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setIsContractPreviewOpen(false)}
            >
              Đóng
            </button>
            <button
              type="button"
              className="btn btn-success fw-semibold"
              onClick={() => {
                setIsContractPreviewOpen(false);
                openModal();
              }}
            >
              <i className="bi bi-pen-fill me-1"></i> Tiến hành Đặt phòng &amp; Ký hợp đồng
            </button>
          </div>
        </div>
      </div>

      {/* Modal Chỉnh Sửa Đánh Giá (#editReviewModal - giống hệt detail.html) */}
      <div
        id="editReviewModal"
        className={`review-modal ${editingReview ? "show" : ""}`}
        onClick={(e) => {
          if (e.target.classList.contains("review-modal-overlay")) {
            closeEditReviewModal();
          }
        }}
      >
        <div
          className="review-modal-overlay"
          onClick={closeEditReviewModal}
        ></div>
        <div className="review-modal-content">
          <button
            type="button"
            className="review-modal-close"
            onClick={closeEditReviewModal}
          >
            <i className="bi bi-x-lg"></i>
          </button>

          <h3 className="review-modal-title">
            <i className="bi bi-pencil-square"></i> Chỉnh sửa đánh giá
          </h3>

          <div className="review-stars-input">
            <label className="stars-label">Đánh giá:</label>
            <div className="star-rating-input" id="edit-star-rating">
              {[1, 2, 3, 4, 5].map((val) => {
                const activeVal = editHoverRating || editRating;
                return (
                  <i
                    key={val}
                    className={`bi ${
                      val <= activeVal ? "bi-star-fill active" : "bi-star"
                    } star-icon`}
                    data-rating={val}
                    onMouseEnter={() => setEditHoverRating(val)}
                    onMouseLeave={() => setEditHoverRating(0)}
                    onClick={() => setEditRating(val)}
                  ></i>
                );
              })}
            </div>
          </div>

          <textarea
            id="edit-review-content"
            rows="4"
            className="review-textarea"
            placeholder="Chia sẻ trải nghiệm của bạn..."
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
          ></textarea>

          <div className="review-modal-actions">
            <button
              type="button"
              onClick={closeEditReviewModal}
              className="btn-cancel-edit"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={saveEditedReview}
              className="btn-save-edit"
            >
              <i className="bi bi-check-lg"></i> Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
