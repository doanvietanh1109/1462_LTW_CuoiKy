const { Router } = require("express");
const {
    getDashboardStats,
    getRevenue,
    getOccupiedRooms,
    getAllRentals,
    getAllReviews,
    deleteReviewByAdmin,
} = require("../controllers/admin.controller");
const { getOrders } = require("../controllers/order.controller");
const { getCoupons } = require("../controllers/coupon.controller");
const { getAllUsers, updateUserStatus, updateUserRole } = require("../controllers/user.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = Router();

router.use(requireAuth, requireAdmin);

// Tổng quan
router.get("/dashboard", getDashboardStats);
router.get("/revenue", getRevenue);
router.get("/orders", getOrders);
router.get("/coupons", getCoupons);

// 4.1 - Quản lý tài khoản người dùng
router.get("/users", getAllUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);

// 4.2 - Quản lý người thuê trong từng phòng
router.get("/occupied-rooms", getOccupiedRooms);
router.get("/rentals", getAllRentals);

// 4.3 - Quản lý đánh giá và phản hồi
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReviewByAdmin);

module.exports = router;
