const { RepairRequest } = require("../models/repairRequest.model");
const { Room } = require("../models/room.model");
const { Contract } = require("../models/contract.model");
const { sendSuccess, sendError } = require("../utils/response");

const getRepairRequests = async (req, res, next) => {
  try {
    const { status, roomId } = req.query;
    const query = {};

    if (req.user.role === "user") {
      query.tenantId = req.user._id;
    } else if (req.user.role === "landlord") {
      query.landlordId = req.user._id;
    }

    if (status && status !== "all") {
      query.status = status;
    }
    if (roomId) {
      query.roomId = roomId;
    }

    const requests = await RepairRequest.find(query)
      .populate("roomId", "title roomNumber district status")
      .populate("tenantId", "name email phone")
      .sort({ createdAt: -1 });

    return sendSuccess(res, "Lấy danh sách yêu cầu sửa chữa thành công", {
      requests,
    });
  } catch (error) {
    return next(error);
  }
};

const createRepairRequest = async (req, res, next) => {
  try {
    const { roomId, title, description, images, priority } = req.body;

    if (!title || !description) {
      return sendError(
        res,
        "Tiêu đề và mô tả sự cố sửa chữa là bắt buộc",
        null,
        400
      );
    }

    let targetRoom = null;
    let activeContract = null;

    if (roomId) {
      targetRoom = await Room.findById(roomId);
      activeContract = await Contract.findOne({ roomId, status: "active" });
    } else {
      activeContract = await Contract.findOne({
        $or: [{ tenantId: req.user._id }, { tenantEmail: req.user.email }],
        status: "active",
      });
      if (activeContract) {
        targetRoom = await Room.findById(activeContract.roomId);
      }
    }

    if (!targetRoom) {
      return sendError(
        res,
        "Không tìm thấy phòng đang thuê để gửi yêu cầu sửa chữa",
        null,
        404
      );
    }

    const parsedImages = Array.isArray(images)
      ? images
      : typeof images === "string" && images.trim()
      ? [images.trim()]
      : [];

    const repairRequest = await RepairRequest.create({
      roomId: targetRoom._id,
      contractId: activeContract?._id || null,
      tenantId: req.user._id,
      landlordId: targetRoom.ownerId || activeContract?.landlordId || req.user._id,
      title: title.trim(),
      description: description.trim(),
      images: parsedImages,
      priority: priority || "medium",
      status: "new",
    });

    const populated = await RepairRequest.findById(repairRequest._id)
      .populate("roomId", "title roomNumber district status")
      .populate("tenantId", "name email phone");

    return sendSuccess(
      res,
      "Gửi yêu cầu sửa chữa thành công!",
      { request: populated },
      201
    );
  } catch (error) {
    return next(error);
  }
};

// Chủ trọ cập nhật trạng thái: Mới (new) -> Đang xử lý (in_progress) -> Xong (resolved)
const updateRepairStatus = async (req, res, next) => {
  try {
    const { status, landlordNote, updateRoomStatus } = req.body;

    if (!status || !["new", "in_progress", "resolved"].includes(status)) {
      return sendError(
        res,
        "Trạng thái không hợp lệ (chỉ chấp nhận new, in_progress, resolved)",
        null,
        400
      );
    }

    const repairRequest = await RepairRequest.findById(req.params.id);
    if (!repairRequest) {
      return sendError(res, "Không tìm thấy yêu cầu sửa chữa", null, 404);
    }

    repairRequest.status = status;
    if (landlordNote !== undefined) {
      repairRequest.landlordNote = landlordNote;
    }
    if (status === "resolved") {
      repairRequest.resolvedAt = new Date();
    }

    await repairRequest.save();

    // Tùy chọn đồng bộ trạng thái phòng (Đang sửa)
    if (updateRoomStatus) {
      const room = await Room.findById(repairRequest.roomId);
      if (room) {
        if (status === "in_progress") {
          room.status = "maintenance";
        } else if (status === "resolved") {
          const hasActiveContract = await Contract.exists({
            roomId: room._id,
            status: "active",
          });
          room.status = hasActiveContract ? "rented" : "available";
        }
        await room.save();
      }
    }

    const populated = await RepairRequest.findById(repairRequest._id)
      .populate("roomId", "title roomNumber district status")
      .populate("tenantId", "name email phone");

    return sendSuccess(res, "Cập nhật trạng thái sửa chữa thành công", {
      request: populated,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getRepairRequests,
  createRepairRequest,
  updateRepairStatus,
};
