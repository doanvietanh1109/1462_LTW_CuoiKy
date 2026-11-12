const { Order } = require("../models/order.model");
const { Room } = require("../models/room.model");
const { Coupon } = require("../models/coupon.model");
const { User } = require("../models/user.model");
const { Review } = require("../models/review.model");
const { RentalHistory } = require("../models/rentalHistory.model");
const { sendSuccess, sendError } = require("../utils/response");

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

// Gom doanh thu & số đơn theo 7 ngày gần nhất
const buildWeeklySeries = (orders) => {
  const labels = [];
  const revenue = new Array(7).fill(0);
  const counts = new Array(7).fill(0);
  const indexByDate = {};

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const idx = 6 - i;
    indexByDate[key] = idx;
    labels[idx] = DAY_LABELS[d.getDay()];
  }

  orders.forEach((order) => {
    if (!order.createdAt) return;
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    if (key in indexByDate) {
      revenue[indexByDate[key]] += order.pricePaid || 0;
      counts[indexByDate[key]] += 1;
    }
  });

  return { labels, revenue, counts };
};

// Gom số lượt thuê phòng theo 7 ngày gần nhất (dựa trên RentalHistory)
const buildWeeklyRentals = (rentals) => {
  const labels = [];
  const counts = new Array(7).fill(0);
  const indexByDate = {};

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const idx = 6 - i;
    indexByDate[key] = idx;
    labels[idx] = DAY_LABELS[d.getDay()];
  }

  rentals.forEach((r) => {
    const raw = r.createdAt || r.startDate;
    if (!raw) return;
    const key = new Date(raw).toISOString().slice(0, 10);
    if (key in indexByDate) counts[indexByDate[key]] += 1;
  });

  return { labels, counts };
};

const getDashboardStats = async (req, res) => {
  try {
    const [totalRooms, totalCoupons, totalUsers, orders, recentOrders, rentals] = await Promise.all([
      Room.countDocuments({ status: { $ne: "deleted" } }),
      Coupon.countDocuments(),
      User.countDocuments(),
      Order.find().sort({ createdAt: -1 }),
      Order.find().sort({ createdAt: -1 }).limit(5),
      RentalHistory.find().sort({ createdAt: -1 }),
    ]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.pricePaid || 0), 0);
    const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

    const todayKey = new Date().toISOString().slice(0, 10);
    let ordersToday = 0;
    let revenueToday = 0;
    const customerSet = new Set();

    orders.forEach((order) => {
      const key = order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : null;
      if (key === todayKey) {
        ordersToday += 1;
        revenueToday += order.pricePaid || 0;
      }
      const customerKey = order.userId ? order.userId.toString() : order.userName;
      if (customerKey) customerSet.add(customerKey);
    });

    // Thống kê thuê phòng (chủ trọ add người thuê -> tạo RentalHistory)
    const totalRentals = rentals.length;
    const activeRentals = rentals.filter((r) => r.status === "active").length;
    let rentalsToday = 0;
    const tenantSet = new Set();
    rentals.forEach((r) => {
      const raw = r.createdAt || r.startDate;
      const key = raw ? new Date(raw).toISOString().slice(0, 10) : null;
      if (key === todayKey) rentalsToday += 1;
      const tenantKey = r.tenantId ? r.tenantId.toString() : r.tenantEmail || r.tenantName;
      if (tenantKey) tenantSet.add(tenantKey);
    });

    return sendSuccess(res, "Dashboard stats fetched successfully", {
      totalRevenue,
      totalOrders,
      totalRooms,
      totalCoupons,
      totalUsers,
      ordersToday,
      revenueToday,
      avgOrderValue,
      uniqueCustomers: customerSet.size,
      // Thống kê thuê phòng
      totalRentals,
      activeRentals,
      rentalsToday,
      uniqueTenants: tenantSet.size,
      weeklyRentals: buildWeeklyRentals(rentals),
      weekly: buildWeeklySeries(orders),
      recentOrders,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return sendError(res, "Server error while fetching dashboard stats", null, 500);
  }
};

const getRevenue = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.pricePaid || 0), 0);
    const revenueByDate = {};

    orders.forEach((order) => {
      if (!order.createdAt) return;
      const date = order.createdAt.toISOString().split("T")[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + (order.pricePaid || 0);
    });

    return sendSuccess(res, "Revenue fetched successfully", {
      totalRevenue,
      revenueByDate,
      weekly: buildWeeklySeries(orders),
    });
  } catch (error) {
    console.error("Get revenue error:", error);
    return sendError(res, "Server error while fetching revenue", null, 500);
  }
};

// 4.2 - Quản lý người thuê trong từng phòng (admin xem toàn bộ)
const getOccupiedRooms = async (req, res) => {
  try {
    // Phòng đang có người thuê (status rented hoặc có tenant)
    const rooms = await Room.find({
      status: { $ne: "deleted" },
      "tenant.name": { $exists: true, $ne: null },
    })
      .select("title category district price status ownerName ownerId tenant")
      .sort({ updatedAt: -1 })
      .lean();

    return sendSuccess(res, "Occupied rooms fetched successfully", { rooms });
  } catch (error) {
    console.error("Get occupied rooms error:", error);
    return sendError(res, "Server error while fetching occupied rooms", null, 500);
  }
};

// 4.2 - Toàn bộ lịch sử thuê (admin)
const getAllRentals = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const rentals = await RentalHistory.find(query).sort({ createdAt: -1 }).lean();
    return sendSuccess(res, "Rentals fetched successfully", { rentals });
  } catch (error) {
    console.error("Get all rentals error:", error);
    return sendError(res, "Server error while fetching rentals", null, 500);
  }
};

// 4.3 - Kiểm duyệt đánh giá (admin xem toàn bộ review kèm tên phòng)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate({ path: "roomId", select: "title district" })
      .lean();

    const formatted = reviews.map((r) => ({
      _id: r._id,
      stars: r.stars,
      content: r.content,
      userName: r.userName,
      userId: r.userId,
      createdAt: r.createdAt,
      roomId: r.roomId ? r.roomId._id : null,
      roomTitle: r.roomId ? r.roomId.title : "Phòng đã xóa",
      roomDistrict: r.roomId ? r.roomId.district : "",
    }));

    return sendSuccess(res, "Reviews fetched successfully", { reviews: formatted });
  } catch (error) {
    console.error("Get all reviews error:", error);
    return sendError(res, "Server error while fetching reviews", null, 500);
  }
};

// 4.3 - Admin xóa (kiểm duyệt) một đánh giá
const deleteReviewByAdmin = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return sendError(res, "Review not found", null, 404);
    }
    return sendSuccess(res, "Review deleted successfully", { review });
  } catch (error) {
    console.error("Delete review (admin) error:", error);
    return sendError(res, "Server error while deleting review", null, 500);
  }
};

module.exports = {
  getDashboardStats,
  getRevenue,
  getOccupiedRooms,
  getAllRentals,
  getAllReviews,
  deleteReviewByAdmin,
};
