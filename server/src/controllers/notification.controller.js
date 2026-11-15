const { Notification } = require("../models/notification.model");
const { sendSuccess, sendError } = require("../utils/response");

const listNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const filter = { userId: req.user._id };
    if (req.query.read === "true") filter.readAt = { $ne: null };
    if (req.query.read === "false") filter.readAt = null;
    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments({ userId: req.user._id, readAt: null }),
    ]);
    return sendSuccess(res, "Lấy thông báo thành công", { notifications, unreadCount, page, limit });
  } catch (error) { return next(error); }
};

const markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, { $set: { readAt: new Date() } }, { new: true }
    );
    if (!notification) return sendError(res, "Không tìm thấy thông báo", null, 404);
    return sendSuccess(res, "Đã đánh dấu đã đọc", { notification });
  } catch (error) { return next(error); }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany({ userId: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
    return sendSuccess(res, "Đã đánh dấu tất cả là đã đọc", { updatedCount: result.modifiedCount });
  } catch (error) { return next(error); }
};

module.exports = { listNotifications, markRead, markAllRead };
