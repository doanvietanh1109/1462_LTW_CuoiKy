const bcrypt = require("bcrypt");
const { Contract } = require("../models/contract.model");
const { Room } = require("../models/room.model");
const { User } = require("../models/user.model");
const { RentalHistory } = require("../models/rentalHistory.model");
const { Invoice } = require("../models/invoice.model");
const { MeterReading } = require("../models/meterReading.model");
const { Order } = require("../models/order.model");
const { sendSuccess, sendError } = require("../utils/response");

// Helper: Tự động phát hành hóa đơn mẫu cho hợp đồng mới để người thuê có ngay bảng kê chi tiết từng khoản
const ensureSampleInvoicesForContract = async (contract, room) => {
  try {
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const existingCur = await Invoice.findOne({
      roomId: room._id,
      month: curMonth,
      year: curYear,
    });

    if (!existingCur) {
      const oldE = Number(contract.initialElectricity || room.currentElectricity || 120);
      const newE = oldE + 45;
      const oldW = Number(contract.initialWater || room.currentWater || 12);
      const newW = oldW + 6;
      const ePrice = Number(contract.electricityPrice || 3500);
      const wPrice = Number(contract.waterPrice || 15000);
      const sFee = Number(contract.serviceFee || 100000);
      const rPrice = Number(contract.rentPrice || room.price || 3000000);

      const eUsage = newE - oldE;
      const wUsage = newW - oldW;
      const eCost = eUsage * ePrice;
      const wCost = wUsage * wPrice;
      const totalAmount = rPrice + eCost + wCost + sFee;

      const reading = await MeterReading.findOneAndUpdate(
        { roomId: room._id, month: curMonth, year: curYear },
        {
          roomId: room._id,
          contractId: contract._id,
          landlordId: contract.landlordId,
          month: curMonth,
          year: curYear,
          oldElectricity: oldE,
          newElectricity: newE,
          oldWater: oldW,
          newWater: newW,
        },
        { upsert: true, new: true }
      );

      const invoiceCode = `INV-${curYear}${String(curMonth).padStart(2, "0")}-${String(
        room._id
      )
        .slice(-4)
        .toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

      await Invoice.create({
        invoiceCode,
        roomId: room._id,
        contractId: contract._id,
        tenantId: contract.tenantId,
        landlordId: contract.landlordId,
        meterReadingId: reading._id,
        month: curMonth,
        year: curYear,
        roomPrice: rPrice,
        oldElectricity: oldE,
        newElectricity: newE,
        electricityUsage: eUsage,
        electricityPrice: ePrice,
        electricityCost: eCost,
        useTieredElectricity: false,
        oldWater: oldW,
        newWater: newW,
        waterUsage: wUsage,
        waterPrice: wPrice,
        waterCost: wCost,
        serviceFee: sFee,
        totalAmount,
        status: "unpaid",
        dueDate: new Date(curYear, curMonth - 1, 15),
        note: "Hóa đơn tiền phòng, điện, nước và dịch vụ hàng tháng",
      });

      room.currentElectricity = newE;
      room.currentWater = newW;
      await room.save();
    } else if (!existingCur.tenantId || String(existingCur.tenantId) !== String(contract.tenantId)) {
      existingCur.tenantId = contract.tenantId;
      existingCur.contractId = contract._id;
      await existingCur.save();
    }
  } catch (err) {
    console.warn("ensureSampleInvoicesForContract warning:", err.message);
  }
};

const getContracts = async (req, res, next) => {
  try {
    const { status, roomId, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === "user") {
      query.$or = [
        { tenantId: req.user._id },
        { tenantEmail: req.user.email },
      ];
    } else if (req.user.role === "landlord") {
      query.landlordId = req.user._id;
    }

    if (status && status !== "all") {
      query.status = status;
    }
    if (roomId) {
      query.roomId = roomId;
    }
    if (search) {
      query.$or = [
        { contractCode: { $regex: search, $options: "i" } },
        { tenantName: { $regex: search, $options: "i" } },
        { tenantEmail: { $regex: search, $options: "i" } },
        { tenantPhone: { $regex: search, $options: "i" } },
      ];
    }

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

    if (
      req.user.role === "user" &&
      contract.tenantId &&
      contract.tenantId._id.toString() !== req.user._id.toString() &&
      contract.tenantEmail !== req.user.email
    ) {
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

    const room = await Room.findById(roomId);
    if (!room || room.status === "deleted") {
      return sendError(res, "Không tìm thấy phòng trọ", null, 404);
    }

    // RÀNG BUỘC KỸ THUẬT RIÊNG ĐỀ 4:
    // Không cho tạo hợp đồng mới vào phòng đang có hợp đồng hiệu lực
    const existingActiveContract = await Contract.findOne({
      roomId: room._id,
      status: "active",
    });

    if (existingActiveContract || room.status === "rented") {
      return sendError(
        res,
        "Phòng này đang có hợp đồng hiệu lực (Đang thuê). Không thể tạo hợp đồng mới!",
        { activeContractCode: existingActiveContract?.contractCode },
        400
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
        : room.electricityPrice || 3500;
    const finalWaterPrice =
      waterPrice !== undefined ? Number(waterPrice) : room.waterPrice || 15000;
    const finalServiceFee =
      serviceFee !== undefined ? Number(serviceFee) : room.serviceFee || 100000;
    const initElec =
      initialElectricity !== undefined
        ? Number(initialElectricity)
        : room.currentElectricity || 120;
    const initWater =
      initialWater !== undefined
        ? Number(initialWater)
        : room.currentWater || 12;

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

    await ensureSampleInvoicesForContract(contract, room);

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

    let room = null;
    if (roomId) {
      room = await Room.findById(roomId);
    }
    if (!room) {
      room =
        (await Room.findOne({ status: "available" })) ||
        (await Room.findOne({ status: { $ne: "deleted" } }));
    }

    if (!room) {
      return sendError(res, "Không tìm thấy phòng trọ để tạo hợp đồng", null, 404);
    }

    // Kết thúc hợp đồng active cũ của chính user này (nếu muốn chuyển sang phòng mới) hoặc trên phòng này nếu đang demo
    await Contract.updateMany(
      {
        $or: [{ roomId: room._id, status: "active" }, { tenantId: req.user._id, status: "active" }],
      },
      { status: "terminated", actualEndDate: new Date() }
    );

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + (Number(durationMonths) || 6));

    const contractCode = `HD-${Date.now().toString().slice(-6)}-${Math.floor(
      100 + Math.random() * 900
    )}`;

    const rentPriceVal =
      finalPrice !== undefined && Number(finalPrice) > 0
        ? Number(finalPrice)
        : Number(room.price) || 3200000;
    const elecPriceVal = Number(room.electricityPrice) || 3500;
    const waterPriceVal = Number(room.waterPrice) || 15000;
    const serviceFeeVal = Number(room.serviceFee) || 100000;
    const initElec = Number(room.currentElectricity) || 120;
    const initWater = Number(room.currentWater) || 12;
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

    await ensureSampleInvoicesForContract(contract, room);

    const populated = await Contract.findById(contract._id)
      .populate("roomId")
      .populate("blockId", "name address")
      .populate("landlordId", "name email phone");

    return sendSuccess(
      res,
      "Đặt phòng & Ký hợp đồng điện tử thành công! Đã khởi tạo hợp đồng và bảng kê hóa đơn cho phòng của bạn.",
      { contract: populated, room },
      201
    );
  } catch (error) {
    return next(error);
  }
};

// Gia hạn hợp đồng (cho cả Người thuê & Chủ trọ)
const extendContract = async (req, res, next) => {
  try {
    const { months = 6 } = req.body;
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return sendError(res, "Không tìm thấy hợp đồng", null, 404);
    }

    const baseDate = contract.endDate ? new Date(contract.endDate) : new Date();
    baseDate.setMonth(baseDate.getMonth() + (Number(months) || 6));
    contract.endDate = baseDate;
    await contract.save();

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

    if (contract.status === "terminated") {
      return sendError(res, "Hợp đồng này đã kết thúc trước đó", null, 400);
    }

    contract.status = "terminated";
    contract.actualEndDate = new Date();
    await contract.save();

    // Tự động đổi trạng thái phòng về "available" (Trống)
    const room = await Room.findById(contract.roomId);
    if (room) {
      room.status = "available";
      room.tenant = undefined;
      await room.save();
    }

    // Đồng bộ RentalHistory
    await RentalHistory.findOneAndUpdate(
      { roomId: contract.roomId, status: "active" },
      { status: "completed", actualEndDate: new Date() }
    );

    return sendSuccess(
      res,
      "Kết thúc hợp đồng thành công! Phòng đã tự động chuyển về trạng thái Trống.",
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
};
