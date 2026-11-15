const { RepairRequest } = require("../models/repairRequest.model");
const { Room } = require("../models/room.model");
const { Contract } = require("../models/contract.model");
const { sendSuccess, sendError } = require("../utils/response");
const { createNotification } = require("../utils/createNotification");
const cloudinary = require("../config/cloudinary");
const mongoose = require("mongoose");

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
    const { roomId, title, description, priority } = req.body;
    if (req.user.role !== "user") return sendError(res, "Chỉ người thuê mới được gửi yêu cầu sửa chữa", null, 403);
    if (typeof title !== "string" || typeof description !== "string" || title.trim().length < 3 || title.trim().length > 120 || description.trim().length < 5 || description.trim().length > 3000) {
      return sendError(
        res,
        "Tiêu đề (3–120 ký tự) và mô tả (5–3000 ký tự) là bắt buộc",
        null,
        400
      );
    }
    if (roomId && !mongoose.isValidObjectId(roomId)) return sendError(res, "Mã phòng không hợp lệ", null, 400);
    if (priority !== undefined && !["low", "medium", "high"].includes(priority)) return sendError(res, "Mức độ ưu tiên không hợp lệ", null, 400);
    const tenantClauses = [{ tenantId: req.user._id }];
    if (req.user.email) tenantClauses.push({ tenantEmail: req.user.email });
    const tenantScope = { $or: tenantClauses };
    const contractQuery = { ...tenantScope, status: "active" };
    if (roomId) contractQuery.roomId = roomId;
    const activeContract = await Contract.findOne(contractQuery).sort({ createdAt: -1 });
    if (!activeContract) return sendError(res, "Bạn không có hợp đồng hiệu lực cho phòng này", null, 403);
    const targetRoom = await Room.findById(activeContract.roomId);
    if (!targetRoom) return sendError(res, "Không tìm thấy phòng thuộc hợp đồng", null, 404);

    const files = req.files || [];
    if (files.length > 3) return sendError(res, "Mỗi yêu cầu được đính kèm tối đa 3 ảnh", null, 400);
    const uploadedAssets = [];
    let persisted = false;
    try {
      const uploadResults = await Promise.allSettled(files.map((file) => new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "repair-requests", resource_type: "image" }, (error, result) => {
          if (error) return reject(error);
          uploadedAssets.push(result.public_id);
          resolve(result.secure_url);
        });
        stream.end(file.buffer);
      })));
      const failedUpload = uploadResults.find((result) => result.status === "rejected");
      if (failedUpload) throw failedUpload.reason;
      const imageUrls = uploadResults.map((result) => result.value);

      const repairRequest = await RepairRequest.create({
        roomId: targetRoom._id,
        contractId: activeContract._id,
        tenantId: req.user._id,
        landlordId: activeContract.landlordId,
        title: title.trim(),
        description: description.trim(),
        images: imageUrls,
        priority: priority || "medium",
        status: "new",
      });
      persisted = true;
      await createNotification({ userId: activeContract.landlordId, type: "repair", title: "Yêu cầu sửa chữa mới",
        message: `Người thuê đã gửi yêu cầu: ${repairRequest.title}.`, resourceType: "repair", resourceId: repairRequest._id });
      const populated = await RepairRequest.findById(repairRequest._id)
        .populate("roomId", "title roomNumber district status")
        .populate("tenantId", "name email phone");
      return sendSuccess(res, "Gửi yêu cầu sửa chữa thành công!", { request: populated }, 201);
    } catch (error) {
      if (!persisted && uploadedAssets.length) {
        await Promise.allSettled(uploadedAssets.map((publicId) => cloudinary.uploader.destroy(publicId)));
      }
      return next(error);
    }
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
    if (req.user.role !== "admin" && repairRequest.landlordId.toString() !== req.user._id.toString()) {
      return sendError(res, "Bạn không có quyền xử lý yêu cầu sửa chữa này", null, 403);
    }
    if (landlordNote !== undefined && (typeof landlordNote !== "string" || landlordNote.length > 1000)) {
      return sendError(res, "Ghi chú không hợp lệ", null, 400);
    }

    const previousStatus = repairRequest.status;
    repairRequest.status = status;
    if (landlordNote !== undefined) {
      repairRequest.landlordNote = landlordNote;
    }
    if (status === "resolved") {
      repairRequest.resolvedAt = new Date();
    }

    await repairRequest.save();
    if (previousStatus !== status) {
      const statusLabel = status === "in_progress" ? "đang được xử lý" : status === "resolved" ? "đã hoàn thành" : "được cập nhật";
      await createNotification({ userId: repairRequest.tenantId, type: "repair", title: "Cập nhật yêu cầu sửa chữa",
        message: `Yêu cầu “${repairRequest.title}” ${statusLabel}.`, resourceType: "repair", resourceId: repairRequest._id });
    }

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
