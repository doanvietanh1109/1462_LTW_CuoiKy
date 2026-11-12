const { MotelBlock } = require("../models/motelBlock.model");
const { Room } = require("../models/room.model");
const { sendSuccess, sendError } = require("../utils/response");

const getMotelBlocks = async (req, res, next) => {
  try {
    const { ownerId, search } = req.query;
    const query = {};

    if (ownerId) {
      query.ownerId = ownerId;
    } else if (req.user && req.user.role === "landlord") {
      query.ownerId = req.user._id;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    const blocks = await MotelBlock.find(query).sort({ createdAt: -1 }).lean();

    // Đếm số phòng theo trạng thái trong từng dãy trọ
    const blockIds = blocks.map((b) => b._id);
    const rooms = await Room.find({
      blockId: { $in: blockIds },
      status: { $ne: "deleted" },
    })
      .select("blockId status price area title roomNumber")
      .lean();

    const blocksWithStats = blocks.map((block) => {
      const blockRooms = rooms.filter(
        (r) => r.blockId && r.blockId.toString() === block._id.toString()
      );
      return {
        ...block,
        totalRooms: blockRooms.length,
        availableRooms: blockRooms.filter((r) => r.status === "available").length,
        rentedRooms: blockRooms.filter((r) => r.status === "rented").length,
        maintenanceRooms: blockRooms.filter((r) => r.status === "maintenance").length,
      };
    });

    return sendSuccess(res, "Lấy danh sách dãy trọ thành công", {
      blocks: blocksWithStats,
    });
  } catch (error) {
    return next(error);
  }
};

const getMotelBlockById = async (req, res, next) => {
  try {
    const block = await MotelBlock.findById(req.params.id).lean();
    if (!block) {
      return sendError(res, "Không tìm thấy dãy trọ", null, 404);
    }

    const rooms = await Room.find({
      blockId: block._id,
      status: { $ne: "deleted" },
    }).sort({ roomNumber: 1, createdAt: -1 });

    return sendSuccess(res, "Lấy thông tin dãy trọ thành công", {
      block,
      rooms,
    });
  } catch (error) {
    return next(error);
  }
};

const createMotelBlock = async (req, res, next) => {
  try {
    const {
      name,
      address,
      description,
      defaultElectricityPrice,
      defaultWaterPrice,
      defaultServiceFee,
    } = req.body;

    if (!name || !address) {
      return sendError(res, "Tên dãy trọ và địa chỉ là bắt buộc", null, 400);
    }

    const block = await MotelBlock.create({
      name: name.trim(),
      address: address.trim(),
      description: description || "",
      ownerId: req.user._id,
      ownerName: req.user.name,
      defaultElectricityPrice:
        defaultElectricityPrice !== undefined ? Number(defaultElectricityPrice) : 3500,
      defaultWaterPrice:
        defaultWaterPrice !== undefined ? Number(defaultWaterPrice) : 15000,
      defaultServiceFee:
        defaultServiceFee !== undefined ? Number(defaultServiceFee) : 100000,
    });

    return sendSuccess(res, "Tạo dãy trọ thành công", { block }, 201);
  } catch (error) {
    return next(error);
  }
};

const updateMotelBlock = async (req, res, next) => {
  try {
    const block = await MotelBlock.findById(req.params.id);
    if (!block) {
      return sendError(res, "Không tìm thấy dãy trọ", null, 404);
    }

    if (
      req.user.role !== "admin" &&
      block.ownerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, "Bạn không có quyền chỉnh sửa dãy trọ này", null, 403);
    }

    const {
      name,
      address,
      description,
      defaultElectricityPrice,
      defaultWaterPrice,
      defaultServiceFee,
      status,
    } = req.body;

    if (name) block.name = name.trim();
    if (address) block.address = address.trim();
    if (description !== undefined) block.description = description;
    if (defaultElectricityPrice !== undefined)
      block.defaultElectricityPrice = Number(defaultElectricityPrice);
    if (defaultWaterPrice !== undefined)
      block.defaultWaterPrice = Number(defaultWaterPrice);
    if (defaultServiceFee !== undefined)
      block.defaultServiceFee = Number(defaultServiceFee);
    if (status && ["active", "inactive"].includes(status)) block.status = status;

    await block.save();

    return sendSuccess(res, "Cập nhật dãy trọ thành công", { block });
  } catch (error) {
    return next(error);
  }
};

const deleteMotelBlock = async (req, res, next) => {
  try {
    const block = await MotelBlock.findById(req.params.id);
    if (!block) {
      return sendError(res, "Không tìm thấy dãy trọ", null, 404);
    }

    if (
      req.user.role !== "admin" &&
      block.ownerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, "Bạn không có quyền xóa dãy trọ này", null, 403);
    }

    const rentedCount = await Room.countDocuments({
      blockId: block._id,
      status: "rented",
    });

    if (rentedCount > 0) {
      return sendError(
        res,
        "Không thể xóa dãy trọ đang có phòng cho thuê hiệu lực",
        null,
        400
      );
    }

    await Room.updateMany({ blockId: block._id }, { $set: { blockId: null } });
    await block.deleteOne();

    return sendSuccess(res, "Xóa dãy trọ thành công", { id: req.params.id });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMotelBlocks,
  getMotelBlockById,
  createMotelBlock,
  updateMotelBlock,
  deleteMotelBlock,
};
