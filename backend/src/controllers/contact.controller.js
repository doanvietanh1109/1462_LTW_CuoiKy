const { ContactInquiry } = require("../models/contactInquiry.model");
const { Room } = require("../models/room.model");
const { sendSuccess, sendError } = require("../utils/response");

// Khách không đăng nhập để lại thông tin liên hệ
const createContactInquiry = async (req, res, next) => {
  try {
    const { roomId, name, phone, email, message } = req.body;

    if (!roomId || !name || !phone) {
      return sendError(
        res,
        "Vui lòng nhập đầy đủ Họ tên, Số điện thoại và Phòng quan tâm",
        null,
        400
      );
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return sendError(res, "Không tìm thấy phòng trọ", null, 404);
    }

    const inquiry = await ContactInquiry.create({
      roomId: room._id,
      landlordId: room.ownerId || null,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : "",
      message: message ? message.trim() : "",
      status: "new",
    });

    return sendSuccess(
      res,
      "Gửi thông tin liên hệ thành công! Chủ trọ sẽ sớm liên hệ với bạn.",
      { inquiry },
      201
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
    }
    if (req.query.status && req.query.status !== "all") {
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

    inquiry.status = req.body.status === "contacted" ? "contacted" : "new";
    await inquiry.save();

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
