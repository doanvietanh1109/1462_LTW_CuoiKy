const { ContactInquiry } = require("../models/contactInquiry.model");
const { Room } = require("../models/room.model");
const { sendSuccess, sendError } = require("../utils/response");
const mongoose = require("mongoose");

// Khách không đăng nhập để lại thông tin liên hệ
const createContactInquiry = async (req, res, next) => {
  try {
    const { roomId, name, phone, email, message } = req.body;

    if (
      !roomId ||
      !name ||
      !phone ||
      typeof name !== "string" ||
      typeof phone !== "string"
    ) {
      return sendError(
        res,
        "Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Phòng quan tâm",
        null,
        400,
      );
    }
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanMessage = typeof message === "string" ? message.trim() : "";
    const isValidPhone = /^(0|\+84)[0-9]{8,10}$/.test(cleanPhone);
    if (
      !mongoose.isValidObjectId(roomId) ||
      cleanName.length < 2 ||
      cleanName.length > 100 ||
      !isValidPhone ||
      cleanEmail.length > 254 ||
      cleanMessage.length > 2000 ||
      (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    ) {
      return sendError(res, "Thông tin liên hệ không hợp lệ", null, 400);
    }

    const room = await Room.findById(roomId);
    if (!room || room.status !== "available") {
      return sendError(res, "Không tìm thấy phòng trọ", null, 404);
    }

    const inquiry = await ContactInquiry.create({
      roomId: room._id,
      landlordId: room.ownerId || null,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      message: cleanMessage,
      status: "new",
    });

    return sendSuccess(
      res,
      "Gửi thông tin liên hệ thành công! Chủ trọ sẽ sớm liên hệ với bạn.",
      { inquiry },
      201,
    );
  } catch (error) {
    return next(error);
  }
};

const getContactInquiries = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === "landlord") {
      query.landlordId = req.user._id;
    } else if (req.user.role !== "admin") {
      return sendError(
        res,
        "Bạn không có quyền xem danh sách liên hệ",
        null,
        403,
      );
    }
    if (req.query.status && req.query.status !== "all") {
      if (!["new", "contacted"].includes(req.query.status)) {
        return sendError(
          res,
          "Trạng thái lọc liên hệ không hợp lệ (chỉ chấp nhận all, new, contacted)",
          null,
          400,
        );
      }
      query.status = req.query.status;
    }

    const inquiries = await ContactInquiry.find(query)
      .populate("roomId", "title roomNumber price area district")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "Lấy danh sách khách liên hệ thành công", {
      inquiries,
    });
  } catch (error) {
    return next(error);
  }
};

const updateContactStatus = async (req, res, next) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) {
      return sendError(res, "Không tìm thấy thông tin liên hệ", null, 404);
    }

    if (
      req.user.role !== "admin" &&
      inquiry.landlordId?.toString() !== req.user._id.toString()
    ) {
      return sendError(
        res,
        "Bạn không có quyền cập nhật liên hệ này",
        null,
        403,
      );
    }

    if (!["new", "contacted"].includes(req.body.status)) {
      return sendError(res, "Trạng thái liên hệ không hợp lệ", null, 400);
    }

    inquiry.status = req.body.status;
    await inquiry.save();
    await inquiry.populate("roomId", "title roomNumber price area district");

    return sendSuccess(res, "Cập nhật trạng thái liên hệ thành công", {
      inquiry,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createContactInquiry,
  getContactInquiries,
  updateContactStatus,
};
