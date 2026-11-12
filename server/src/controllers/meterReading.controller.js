const { MeterReading } = require("../models/meterReading.model");
const { Room } = require("../models/room.model");
const { Contract } = require("../models/contract.model");
const { Invoice } = require("../models/invoice.model");
const { sendSuccess, sendError } = require("../utils/response");

// Tính giá điện bậc thang (Tính năng nâng cao cộng điểm)
const calculateTieredElectricity = (usage) => {
  if (usage <= 0) return 0;
  const tiers = [
    { limit: 50, price: 1806 },
    { limit: 50, price: 1866 },
    { limit: 100, price: 2167 },
    { limit: 100, price: 2729 },
    { limit: 100, price: 3050 },
    { limit: Infinity, price: 3151 },
  ];
  let remaining = usage;
  let totalCost = 0;
  for (const tier of tiers) {
    if (remaining <= 0) break;
    const consumedInTier = Math.min(remaining, tier.limit);
    totalCost += consumedInTier * tier.price;
    remaining -= consumedInTier;
  }
  return Math.round(totalCost);
};

// Lấy bảng chỉ số điện nước cho tất cả phòng đang thuê theo tháng/năm
const getMeterSheet = async (req, res, next) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const roomQuery = { status: "rented" };
    if (req.user.role === "landlord") {
      roomQuery.ownerId = req.user._id;
    }

    const [rentedRooms, readings, invoices, activeContracts] = await Promise.all([
      Room.find(roomQuery).populate("blockId", "name").sort({ roomNumber: 1, title: 1 }).lean(),
      MeterReading.find({ month, year }).lean(),
      Invoice.find({ month, year }).lean(),
      Contract.find({ status: "active" }).lean(),
    ]);

    const readingMap = new Map(readings.map((r) => [r.roomId.toString(), r]));
    const invoiceMap = new Map(invoices.map((inv) => [inv.roomId.toString(), inv]));
    const contractMap = new Map(activeContracts.map((c) => [c.roomId.toString(), c]));

    const rows = rentedRooms.map((room) => {
      const key = room._id.toString();
      const existingReading = readingMap.get(key);
      const existingInvoice = invoiceMap.get(key);
      const activeContract = contractMap.get(key);

      const oldElectricity = existingReading
        ? existingReading.oldElectricity
        : room.currentElectricity || 0;
      const newElectricity = existingReading
        ? existingReading.newElectricity
        : room.currentElectricity || 0;
      const oldWater = existingReading
        ? existingReading.oldWater
        : room.currentWater || 0;
      const newWater = existingReading
        ? existingReading.newWater
        : room.currentWater || 0;

      return {
        roomId: room._id,
        roomTitle: room.title,
        roomNumber: room.roomNumber || "",
        blockName: room.blockId?.name || "Chưa phân dãy",
        tenantName: activeContract?.tenantName || room.tenant?.name || "Người thuê",
        tenantEmail: activeContract?.tenantEmail || room.tenant?.email || "",
        roomPrice: activeContract?.rentPrice || room.price || 0,
        electricityPrice: activeContract?.electricityPrice || room.electricityPrice || 3500,
        waterPrice: activeContract?.waterPrice || room.waterPrice || 15000,
        serviceFee: activeContract?.serviceFee || room.serviceFee || 100000,
        oldElectricity,
        newElectricity,
        oldWater,
        newWater,
        hasReading: Boolean(existingReading),
        hasInvoice: Boolean(existingInvoice),
        invoiceId: existingInvoice?._id || null,
        invoiceCode: existingInvoice?.invoiceCode || null,
        invoiceStatus: existingInvoice?.status || null,
      };
    });

    return sendSuccess(res, "Lấy bảng chỉ số điện nước thành công", {
      month,
      year,
      rows,
    });
  } catch (error) {
    return next(error);
  }
};

// Lưu bảng chỉ số điện nước hàng loạt & tùy chọn phát hành hóa đơn ngay
const saveBatchMeterReadings = async (req, res, next) => {
  try {
    const { month, year, rows, issueInvoices = false, useTieredElectricity = false } = req.body;

    const numMonth = Number(month);
    const numYear = Number(year);

    if (!numMonth || numMonth < 1 || numMonth > 12 || !numYear) {
      return sendError(res, "Tháng và năm không hợp lệ", null, 400);
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return sendError(res, "Danh sách chỉ số điện nước trống", null, 400);
    }

    // Kiểm tra từng dòng ở server: từ chối chỉ số mới nhỏ hơn chỉ số cũ
    const rowErrors = {};
    rows.forEach((row, idx) => {
      const oldE = Number(row.oldElectricity);
      const newE = Number(row.newElectricity);
      const oldW = Number(row.oldWater);
      const newW = Number(row.newWater);
      const key = row.roomId || `row_${idx}`;

      if (Number.isNaN(oldE) || Number.isNaN(newE) || Number.isNaN(oldW) || Number.isNaN(newW)) {
        rowErrors[key] = "Chỉ số điện/nước phải là số hợp lệ";
      } else if (oldE < 0 || newE < 0 || oldW < 0 || newW < 0) {
        rowErrors[key] = "Chỉ số điện/nước không được là số âm";
      } else if (newE < oldE) {
        rowErrors[key] = `Số điện mới (${newE}) không được nhỏ hơn số điện cũ (${oldE})`;
      } else if (newW < oldW) {
        rowErrors[key] = `Số nước mới (${newW}) không được nhỏ hơn số nước cũ (${oldW})`;
      }
    });

    if (Object.keys(rowErrors).length > 0) {
      return sendError(
        res,
        "Có dòng nhập chỉ số điện nước không hợp lệ (chỉ số mới nhỏ hơn chỉ số cũ)",
        { rowErrors },
        400
      );
    }

    const savedReadings = [];
    const createdInvoices = [];
    const skippedInvoices = [];

    for (const row of rows) {
      const room = await Room.findById(row.roomId);
      if (!room) continue;

      const activeContract = await Contract.findOne({
        roomId: room._id,
        status: "active",
      });

      const oldElectricity = Number(row.oldElectricity);
      const newElectricity = Number(row.newElectricity);
      const oldWater = Number(row.oldWater);
      const newWater = Number(row.newWater);

      const reading = await MeterReading.findOneAndUpdate(
        { roomId: room._id, month: numMonth, year: numYear },
        {
          roomId: room._id,
          contractId: activeContract?._id || null,
          landlordId: room.ownerId || req.user._id,
          month: numMonth,
          year: numYear,
          oldElectricity,
          newElectricity,
          oldWater,
          newWater,
        },
        { upsert: true, new: true }
      );

      savedReadings.push(reading);

      // Cập nhật chỉ số hiện tại trên phòng
      room.currentElectricity = newElectricity;
      room.currentWater = newWater;
      await room.save();

      // Nếu chọn phát hành hóa đơn luôn
      if (issueInvoices) {
        const existingInvoice = await Invoice.findOne({
          roomId: room._id,
          month: numMonth,
          year: numYear,
        });

        if (existingInvoice) {
          skippedInvoices.push({
            roomId: room._id,
            roomTitle: room.title,
            reason: `Phòng đã có hóa đơn tháng ${numMonth}/${numYear}`,
          });
          continue;
        }

        const roomPrice = activeContract?.rentPrice ?? room.price ?? 0;
        const electricityPrice =
          activeContract?.electricityPrice ?? room.electricityPrice ?? 3500;
        const waterPrice = activeContract?.waterPrice ?? room.waterPrice ?? 15000;
        const serviceFee = activeContract?.serviceFee ?? room.serviceFee ?? 100000;

        const electricityUsage = newElectricity - oldElectricity;
        const waterUsage = newWater - oldWater;

        const electricityCost = useTieredElectricity
          ? calculateTieredElectricity(electricityUsage)
          : electricityUsage * electricityPrice;
        const waterCost = waterUsage * waterPrice;
        const totalAmount = roomPrice + electricityCost + waterCost + serviceFee;

        const invoiceCode = `INV-${numYear}${String(numMonth).padStart(2, "0")}-${String(
          room._id
        )
          .slice(-4)
          .toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

        const invoice = await Invoice.create({
          invoiceCode,
          roomId: room._id,
          contractId: activeContract?._id || null,
          tenantId: activeContract?.tenantId || room.tenant?.userId || null,
          landlordId: room.ownerId || req.user._id,
          meterReadingId: reading._id,
          month: numMonth,
          year: numYear,
          roomPrice,
          oldElectricity,
          newElectricity,
          electricityUsage,
          electricityPrice,
          electricityCost,
          useTieredElectricity: Boolean(useTieredElectricity),
          oldWater,
          newWater,
          waterUsage,
          waterPrice,
          waterCost,
          serviceFee,
          totalAmount,
          status: "unpaid",
          dueDate: new Date(numYear, numMonth - 1, 10),
        });

        createdInvoices.push(invoice);
      }
    }

    return sendSuccess(
      res,
      issueInvoices
        ? `Đã lưu chỉ số cho ${savedReadings.length} phòng và phát hành ${createdInvoices.length} hóa đơn!`
        : `Đã lưu chỉ số điện nước cho ${savedReadings.length} phòng!`,
      {
        savedReadings,
        createdInvoices,
        skippedInvoices,
      },
      201
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getMeterSheet,
  saveBatchMeterReadings,
  calculateTieredElectricity,
};
