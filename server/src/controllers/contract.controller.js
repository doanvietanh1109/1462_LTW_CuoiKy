const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { Contract } = require("../models/contract.model");
const { Room } = require("../models/room.model");
const { User } = require("../models/user.model");
const { RentalHistory } = require("../models/rentalHistory.model");
const { Order } = require("../models/order.model");
const { sendSuccess, sendError } = require("../utils/response");
const { createNotification } = require("../utils/createNotification");

const updateRoomAfterContractTermination = async (contract) => {
  const successor = await Contract.findOne({ roomId: contract.roomId, status: "active" });
  let room = successor
    ? await Room.findById(contract.roomId)
    : await Room.findOneAndUpdate(
        { _id: contract.roomId, status: "rented", "tenant.userId": contract.tenantId },
        { $set: { status: "available" }, $unset: { tenant: "" } },
        { new: true }
      );
  if (!room) room = await Room.findById(contract.roomId);
  return { successor, room };
};

const canAccessContract = (user, contract) => {
  if (user.role === "admin") return true;
  if (user.role === "landlord") return contract.landlordId?.toString() === user._id.toString();
  return user.role === "user" && (
    (contract.tenantId?._id || contract.tenantId)?.toString() === user._id.toString() ||
    contract.tenantEmail?.toLowerCase() === user.email?.toLowerCase()
  );
};

const buildContractQuery = (user, { status, roomId, search }) => {
  const clauses = [];
  if (user.role === "user") clauses.push({ $or: [{ tenantId: user._id }, { tenantEmail: user.email }] });
  if (user.role === "landlord") clauses.push({ landlordId: user._id });
  if (search) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (escaped) clauses.push({ $or: [
      { contractCode: { $regex: escaped, $options: "i" } },
      { tenantName: { $regex: escaped, $options: "i" } },
      { tenantEmail: { $regex: escaped, $options: "i" } },
      { tenantPhone: { $regex: escaped, $options: "i" } },
    ] });
  }
  const query = {};
  if (clauses.length) query.$and = clauses;
  if (status && status !== "all") query.status = status;
  if (roomId) query.roomId = roomId;
  return query;
};

const validNonNegativeNumber = (value) =>
  (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value)) && Number(value) >= 0;

const getContracts = async (req, res, next) => {
  try {
    const { status, roomId, search, page = 1, limit = 20 } = req.query;
    if (search !== undefined && (typeof search !== "string" || search.length > 100)) return sendError(res, "Từ khóa tìm kiếm không hợp lệ", null, 400);
    const query = buildContractQuery(req.user, { status, roomId, search });

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [contracts, total] = await Promise.all([
      Contract.find(query)
        .populate(
          "roomId",
          "title roomNumber price area district status image img amenities currentElectricity currentWater"
        )
        .populate("blockId", "name address")
        .populate("tenantId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Contract.countDocuments(query),
    ]);

    return sendSuccess(res, "Lấy danh sách hợp đồng thành công", {
      contracts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getMyActiveContract = async (req, res, next) => {
  try {
    const contracts = await Contract.find({
      $or: [{ tenantId: req.user._id }, { tenantEmail: req.user.email }],
    })
      .populate("roomId")
      .populate("blockId", "name address")
      .populate("landlordId", "name email phone")
      .sort({ status: 1, createdAt: -1 });

    const activeContract =
      contracts.find((c) => c.status === "active") || contracts[0] || null;

    return sendSuccess(
      res,
      "Lấy thông tin hợp đồng của người thuê thành công",
      {
        contract: activeContract,
        contracts,
      }
    );
  } catch (error) {
    return next(error);
  }
};

const getContractById = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate("roomId")
      .populate("blockId", "name address")
      .populate("tenantId", "name email phone")
      .populate("landlordId", "name email phone");

    if (!contract) {
      return sendError(res, "Không tìm thấy hợp đồng", null, 404);
    }

    if (!canAccessContract(req.user, contract)) {
      return sendError(
        res,
        "Bạn không có quyền xem hợp đồng của phòng khác",
        null,
        403
      );
    }

    return sendSuccess(res, "Lấy chi tiết hợp đồng thành công", { contract });
  } catch (error) {
    return next(error);
  }
};

const createContract = async (req, res, next) => {
  try {
    const {
      roomId,
      tenantId,
      tenantName,
      tenantEmail,
      tenantPhone,
      identityCard,
      startDate,
      endDate,
      rentPrice,
      deposit,
      electricityPrice,
      waterPrice,
      serviceFee,
      initialElectricity,
      initialWater,
      notes,
    } = req.body;

    if (!roomId || !tenantName || !tenantEmail || !tenantPhone || !startDate) {
      return sendError(
        res,
        "Vui lòng nhập đầy đủ: Phòng, Họ tên, Email, SĐT người thuê và Ngày bắt đầu",
        null,
        400
      );
    }

    if (!mongoose.isValidObjectId(roomId) || (tenantId && !mongoose.isValidObjectId(tenantId))) {
      return sendError(res, "Mã phòng hoặc mã người thuê không hợp lệ", null, 400);
    }
    const parsedStart = new Date(startDate);
    const parsedEnd = endDate ? new Date(endDate) : null;
    if (Number.isNaN(parsedStart.getTime()) || (parsedEnd && (Number.isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart))) {
      return sendError(res, "Ngày hợp đồng không hợp lệ", null, 400);
    }
    const providedAmounts = { rentPrice, deposit, electricityPrice, waterPrice, serviceFee, initialElectricity, initialWater };
    for (const [field, value] of Object.entries(providedAmounts)) {
      if (value !== undefined && !validNonNegativeNumber(value)) {
        return sendError(res, `Giá trị ${field} phải là số không âm`, null, 400);
      }
    }

    const room = await Room.findById(roomId);
    if (!room || room.status === "deleted") {
      return sendError(res, "Không tìm thấy phòng trọ", null, 404);
    }
    if (req.user.role === "landlord" && room.ownerId?.toString() !== req.user._id.toString()) {
      return sendError(res, "Bạn không có quyền tạo hợp đồng cho phòng này", null, 403);
    }

    // RÀNG BUỘC KỸ THUẬT RIÊNG ĐỀ 4:
    // Không cho tạo hợp đồng mới vào phòng đang có hợp đồng hiệu lực
    const existingActiveContract = await Contract.findOne({
      roomId: room._id,
      status: "active",
    });

    if (existingActiveContract || room.status !== "available") {
      return sendError(
        res,
        "Phòng này đang có hợp đồng hiệu lực (Đang thuê). Không thể tạo hợp đồng mới!",
        { activeContractCode: existingActiveContract?.contractCode },
        409
      );
    }

    // Tìm hoặc tạo tài khoản cho người thuê theo email
    let tenantUser = null;
    if (tenantId) {
      tenantUser = await User.findById(tenantId);
    }
    if (!tenantUser && tenantEmail) {
      tenantUser = await User.findOne({
        email: tenantEmail.toLowerCase().trim(),
      });
    }
    if (tenantId && !tenantUser) return sendError(res, "Không tìm thấy tài khoản người thuê", null, 404);
    if (tenantId && tenantUser && tenantUser._id.toString() !== tenantId.toString()) {
      return sendError(res, "Tài khoản người thuê không khớp", null, 400);
    }
    if (tenantUser && tenantUser.email?.toLowerCase() !== tenantEmail.toLowerCase().trim()) {
      return sendError(res, "Email không khớp với tài khoản người thuê đã chọn", null, 400);
    }
    if (!tenantUser) {
      const defaultPassword = await bcrypt.hash("123456", 10);
      tenantUser = await User.create({
        name: tenantName.trim(),
        email: tenantEmail.toLowerCase().trim(),
        phone: tenantPhone.trim(),
        password: defaultPassword,
        role: "user",
        status: "active",
      });
    }

    const contractCode = `HD-${Date.now().toString().slice(-6)}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const finalRentPrice =
      rentPrice !== undefined ? Number(rentPrice) : room.price;
    const finalElecPrice =
      electricityPrice !== undefined
        ? Number(electricityPrice)
        : room.electricityPrice ?? 3500;
    const finalWaterPrice =
      waterPrice !== undefined ? Number(waterPrice) : room.waterPrice ?? 15000;
    const finalServiceFee =
      serviceFee !== undefined ? Number(serviceFee) : room.serviceFee ?? 100000;
    const initElec =
      initialElectricity !== undefined
        ? Number(initialElectricity)
        : room.currentElectricity ?? 0;
    const initWater =
      initialWater !== undefined
        ? Number(initialWater)
        : room.currentWater ?? 0;

    const contract = await Contract.create({
      contractCode,
      roomId: room._id,
      blockId: room.blockId || null,
      landlordId: room.ownerId || req.user._id,
      tenantId: tenantUser._id,
      tenantName: tenantName.trim(),
      tenantEmail: tenantEmail.toLowerCase().trim(),
      tenantPhone: tenantPhone.trim(),
      identityCard: identityCard || "",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      rentPrice: finalRentPrice,
      deposit: deposit !== undefined ? Number(deposit) : finalRentPrice,
      electricityPrice: finalElecPrice,
      waterPrice: finalWaterPrice,
      serviceFee: finalServiceFee,
      initialElectricity: initElec,
      initialWater: initWater,
      notes: notes || "",
      status: "active",
    });
    await createNotification({ userId: tenantUser._id, type: "contract", title: "Hợp đồng mới",
      message: `Hợp đồng ${contract.contractCode} đã được tạo cho phòng ${room.roomNumber || room.title}.`, resourceType: "contract", resourceId: contract._id });

    // Tự động chuyển trạng thái phòng sang "rented" (Đang thuê)
    room.status = "rented";
    room.price = finalRentPrice;
    room.electricityPrice = finalElecPrice;
    room.waterPrice = finalWaterPrice;
    room.serviceFee = finalServiceFee;
    room.currentElectricity = initElec;
    room.currentWater = initWater;
    room.tenant = {
      userId: tenantUser._id,
      name: tenantName.trim(),
      email: tenantEmail.toLowerCase().trim(),
      phone: tenantPhone.trim(),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    };
    await room.save();

    // Đồng bộ với RentalHistory để trang landlord.html cũ vẫn hiển thị đầy đủ
    await RentalHistory.create({
      roomId: room._id,
      roomTitle: room.title,
      landlordId: room.ownerId || req.user._id,
      tenantId: tenantUser._id,
      tenantName: tenantName.trim(),
      tenantEmail: tenantEmail.toLowerCase().trim(),
      tenantPhone: tenantPhone.trim(),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      price: finalRentPrice,
      status: "active",
    });


    const populated = await Contract.findById(contract._id)
      .populate("roomId")
      .populate("blockId", "name address")
      .populate("landlordId", "name email phone");

    return sendSuccess(
      res,
      "Tạo hợp đồng thành công! Trạng thái phòng đã tự động chuyển sang Đang thuê.",
      { contract: populated, room },
      201
    );
  } catch (error) {
    if (error?.code === 11000) return sendError(res, "Phòng đã được gán một hợp đồng hiệu lực", null, 409);
    return next(error);
  }
};

// Luồng Người thuê đặt phòng trên trang Chi tiết phòng (hoặc tự đăng ký hợp đồng mẫu)
// -> Tự động tạo Order + Contract + Hóa đơn tháng để xem ngay tại /tenant/my-room
const selfBookRoomAndCreateContract = async (req, res, next) => {
  try {
    const {
      roomId,
      tenantPhone,
      identityCard,
      startDate,
      durationMonths = 6,
      finalPrice,
      couponCode,
      notes,
    } = req.body;

    if (req.user.role !== "user") return sendError(res, "Chỉ người thuê mới được đặt phòng", null, 403);
    if (!roomId || !mongoose.isValidObjectId(roomId)) return sendError(res, "Mã phòng không hợp lệ", null, 400);

    const room = await Room.findById(roomId);

    if (!room) {
      return sendError(res, "Không tìm thấy phòng trọ để tạo hợp đồng", null, 404);
    }
    if (room.status !== "available") return sendError(res, "Phòng không còn trống để đặt", null, 409);

    const activeContract = await Contract.findOne({
      $or: [{ roomId: room._id }, { tenantId: req.user._id }],
      status: "active",
    });
    if (activeContract) return sendError(res, "Bạn hoặc phòng này đã có hợp đồng hiệu lực", null, 409);

    const start = startDate ? new Date(startDate) : new Date();
    if (Number.isNaN(start.getTime()) || !Number.isInteger(Number(durationMonths)) || Number(durationMonths) < 1 || Number(durationMonths) > 24) {
      return sendError(res, "Ngày bắt đầu hoặc thời hạn hợp đồng không hợp lệ", null, 400);
    }
    if (finalPrice !== undefined && (!validNonNegativeNumber(finalPrice) || Number(finalPrice) > Number(room.price))) {
      return sendError(res, "Giá thuê sau ưu đãi không hợp lệ", null, 400);
    }
    const end = new Date(start);
    end.setMonth(end.getMonth() + Number(durationMonths));

    const contractCode = `HD-${Date.now().toString().slice(-6)}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const rentPriceVal =
      finalPrice !== undefined && Number(finalPrice) > 0
        ? Number(finalPrice)
        : Number(room.price) || 3200000;
    const elecPriceVal = Number(room.electricityPrice ?? 3500);
    const waterPriceVal = Number(room.waterPrice ?? 15000);
    const serviceFeeVal = Number(room.serviceFee ?? 100000);
    const initElec = Number(room.currentElectricity ?? 0);
    const initWater = Number(room.currentWater ?? 0);
    const phoneVal = tenantPhone || req.user.phone || "0987654321";
    const cccdVal = identityCard || "001202034567";

    const contract = await Contract.create({
      contractCode,
      roomId: room._id,
      blockId: room.blockId || null,
      landlordId: room.ownerId || req.user._id,
      tenantId: req.user._id,
      tenantName: req.user.name || "Người thuê",
      tenantEmail: (req.user.email || "user@example.com").toLowerCase(),
      tenantPhone: phoneVal,
      identityCard: cccdVal,
      startDate: start,
      endDate: end,
      rentPrice: rentPriceVal,
      deposit: rentPriceVal,
      electricityPrice: elecPriceVal,
      waterPrice: waterPriceVal,
      serviceFee: serviceFeeVal,
      initialElectricity: initElec,
      initialWater: initWater,
      notes:
        notes ||
        "Hợp đồng điện tử được khởi tạo trực tiếp khi đặt giữ chỗ & ký hợp đồng trực tuyến.",
      status: "active",
    });
    await createNotification({ userId: room.ownerId, type: "contract", title: "Đăng ký thuê phòng mới",
      message: `Người thuê ${req.user.name || req.user.email} đã đăng ký phòng ${room.roomNumber || room.title}.`, resourceType: "contract", resourceId: contract._id });

    room.status = "rented";
    room.tenant = {
      userId: req.user._id,
      name: req.user.name || "Người thuê",
      email: (req.user.email || "").toLowerCase(),
      phone: phoneVal,
      startDate: start,
      endDate: end,
    };
    await room.save();

    // Lưu lịch sử thuê & đơn đặt phòng
    await RentalHistory.create({
      roomId: room._id,
      roomTitle: room.title,
      landlordId: room.ownerId || req.user._id,
      tenantId: req.user._id,
      tenantName: req.user.name || "Người thuê",
      tenantEmail: (req.user.email || "").toLowerCase(),
      tenantPhone: phoneVal,
      startDate: start,
      endDate: end,
      price: rentPriceVal,
      status: "active",
    });

    const originalPrice = Number(room.price) || rentPriceVal;
    const discount = Math.max(0, originalPrice - rentPriceVal);
    await Order.create({
      userId: req.user._id,
      userName: req.user.name || "Người thuê",
      roomId: room._id,
      roomName: room.title,
      landlordId: room.ownerId || req.user._id,
      originalPrice,
      discount,
      couponCode: couponCode || "",
      pricePaid: rentPriceVal,
      paymentMethod: "cash",
      status: "success",
    });


    const populated = await Contract.findById(contract._id)
      .populate("roomId")
      .populate("blockId", "name address")
      .populate("landlordId", "name email phone");

    return sendSuccess(
      res,
      "Đặt phòng và tạo hợp đồng thành công. Hóa đơn sẽ được phát hành sau khi nhập chỉ số thực tế.",
      { contract: populated, room },
      201
    );
  } catch (error) {
    if (error?.code === 11000) return sendError(res, "Phòng đã được gán một hợp đồng hiệu lực", null, 409);
    return next(error);
  }
};

// Gia hạn hợp đồng (cho cả Người thuê & Chủ trọ)
const extendContract = async (req, res, next) => {
  try {
    const { months = 6 } = req.body;
    if (!Number.isInteger(Number(months)) || Number(months) < 1 || Number(months) > 24) {
      return sendError(res, "Số tháng gia hạn phải từ 1 đến 24", null, 400);
    }
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return sendError(res, "Không tìm thấy hợp đồng", null, 404);
    }
    if (!canAccessContract(req.user, contract)) return sendError(res, "Bạn không có quyền gia hạn hợp đồng này", null, 403);
    if (contract.status !== "active") return sendError(res, "Không thể gia hạn hợp đồng đã kết thúc", null, 409);

    const baseDate = contract.endDate ? new Date(contract.endDate) : new Date();
    baseDate.setMonth(baseDate.getMonth() + Number(months));
    contract.endDate = baseDate;
    await contract.save();
    const renewalRecipient = req.user.role === "landlord" ? contract.tenantId : contract.landlordId;
    await createNotification({ userId: renewalRecipient, type: "contract", title: "Hợp đồng được gia hạn",
      message: `Hợp đồng ${contract.contractCode} đã được gia hạn đến ${baseDate.toLocaleDateString("vi-VN")}.`, resourceType: "contract", resourceId: contract._id });

    const populated = await Contract.findById(contract._id)
      .populate("roomId")
      .populate("blockId", "name address")
      .populate("landlordId", "name email phone");

    return sendSuccess(
      res,
      `Đã gia hạn hợp đồng thêm ${months} tháng thành công!`,
      { contract: populated }
    );
  } catch (error) {
    return next(error);
  }
};

const terminateContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return sendError(res, "Không tìm thấy hợp đồng", null, 404);
    }
    if (!canAccessContract(req.user, contract)) return sendError(res, "Bạn không có quyền kết thúc hợp đồng này", null, 403);

    if (contract.status === "terminated") {
      return sendError(res, "Hợp đồng này đã kết thúc trước đó", null, 400);
    }

    contract.status = "terminated";
    contract.actualEndDate = new Date();
    await contract.save();
    const endRecipient = req.user.role === "landlord" ? contract.tenantId : contract.landlordId;
    await createNotification({ userId: endRecipient, type: "contract", title: "Hợp đồng đã kết thúc",
      message: `Hợp đồng ${contract.contractCode} đã được kết thúc.`, resourceType: "contract", resourceId: contract._id });

    // Không để kết thúc hợp đồng cũ ghi đè phòng đã được gán cho hợp đồng kế tiếp.
    const { successor, room } = await updateRoomAfterContractTermination(contract);

    // Đồng bộ RentalHistory
    await RentalHistory.findOneAndUpdate(
      { roomId: contract.roomId, status: "active" },
      { status: "completed", actualEndDate: new Date() }
    );

    return sendSuccess(
      res,
      successor
        ? "Kết thúc hợp đồng thành công. Phòng hiện vẫn được sử dụng theo hợp đồng đang hiệu lực."
        : "Kết thúc hợp đồng thành công! Phòng đã tự động chuyển về trạng thái Trống.",
      { contract, room }
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getContracts,
  getMyActiveContract,
  getContractById,
  createContract,
  selfBookRoomAndCreateContract,
  extendContract,
  terminateContract,
  canAccessContract,
  buildContractQuery,
  updateRoomAfterContractTermination,
};
