const { MeterReading } = require("../models/meterReading.model");
const { Room } = require("../models/room.model");
const { Contract } = require("../models/contract.model");
const { Invoice } = require("../models/invoice.model");
const { sendSuccess, sendError } = require("../utils/response");

const isNumericInput = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value));
const isValidMeterValue = (value) => isNumericInput(value) && Number(value) >= 0;
const isValidPeriod = (month, year) => isNumericInput(month) && Number.isInteger(Number(month)) && Number(month) >= 1 && Number(month) <= 12 && isNumericInput(year) && Number.isInteger(Number(year)) && Number(year) >= 2020 && Number(year) <= 2100;

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
    const month = req.query.month === undefined ? now.getMonth() + 1 : Number(req.query.month);
    const year = req.query.year === undefined ? now.getFullYear() : Number(req.query.year);
    if (!isValidPeriod(month, year)) return sendError(res, "Tháng và năm không hợp lệ", null, 400);

    const contractQuery = { status: "active" };
    if (req.user.role === "landlord") contractQuery.landlordId = req.user._id;
    const activeContracts = await Contract.find(contractQuery).lean();
    const activeRoomIds = activeContracts.map((contract) => contract.roomId);
    const roomQuery = { $or: [{ status: "rented" }, { _id: { $in: activeRoomIds } }] };
    if (req.user.role === "landlord") roomQuery.ownerId = req.user._id;

    const previousPeriodQuery = {
      $or: [{ year: { $lt: year } }, { year, month: { $lt: month } }],
      ...(req.user.role === "landlord" ? { landlordId: req.user._id } : {}),
    };
    const [rentedRooms, readings, previousReadings, invoices] = await Promise.all([
      Room.find(roomQuery).populate("blockId", "name").sort({ roomNumber: 1, title: 1 }).lean(),
      MeterReading.find({ month, year, ...(req.user.role === "landlord" ? { landlordId: req.user._id } : {}) }).lean(),
      MeterReading.find(previousPeriodQuery).sort({ year: -1, month: -1 }).lean(),
      Invoice.find({ month, year, ...(req.user.role === "landlord" ? { landlordId: req.user._id } : {}) }).lean(),
    ]);

    const readingMap = new Map(readings.map((r) => [r.roomId.toString(), r]));
    const previousReadingMap = new Map();
    for (const reading of previousReadings) {
      const key = reading.roomId.toString();
      if (!previousReadingMap.has(key)) previousReadingMap.set(key, reading);
    }
    const invoiceMap = new Map(invoices.map((inv) => [inv.roomId.toString(), inv]));
    const contractMap = new Map(activeContracts.map((c) => [c.roomId.toString(), c]));

    const rows = rentedRooms.map((room) => {
      const key = room._id.toString();
      const existingReading = readingMap.get(key);
      const previousReading = previousReadingMap.get(key);
      const existingInvoice = invoiceMap.get(key);
      const activeContract = contractMap.get(key);
      const previousElectricity = previousReading?.newElectricity ?? activeContract?.initialElectricity ?? room.currentElectricity ?? 0;
      const previousWater = previousReading?.newWater ?? activeContract?.initialWater ?? room.currentWater ?? 0;
      const oldElectricity = existingReading
        ? existingReading.oldElectricity
        : previousElectricity;
      const newElectricity = existingReading
        ? existingReading.newElectricity
        : previousElectricity;
      const oldWater = existingReading
        ? existingReading.oldWater
        : previousWater;
      const newWater = existingReading
        ? existingReading.newWater
        : previousWater;

      return {
        roomId: room._id,
        roomTitle: room.title,
        roomNumber: room.roomNumber || "",
        blockName: room.blockId?.name || "Chưa phân dãy",
        tenantName: activeContract?.tenantName || room.tenant?.name || "Người thuê",
        tenantEmail: activeContract?.tenantEmail || room.tenant?.email || "",
        roomPrice: activeContract?.rentPrice ?? room.price ?? 0,
        electricityPrice: activeContract?.electricityPrice ?? room.electricityPrice ?? 3500,
        waterPrice: activeContract?.waterPrice ?? room.waterPrice ?? 15000,
        serviceFee: activeContract?.serviceFee ?? room.serviceFee ?? 100000,
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
  const savedReadings = [];
  const createdInvoices = [];
  const skippedInvoices = [];
  try {
    const { month, year, rows, issueInvoices = false, useTieredElectricity = false } = req.body;

    const numMonth = Number(month);
    const numYear = Number(year);

    if (!isValidPeriod(numMonth, numYear)) {
      return sendError(res, "Tháng và năm không hợp lệ", null, 400);
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return sendError(res, "Danh sách chỉ số điện nước trống", null, 400);
    }
    if (typeof issueInvoices !== "boolean" || typeof useTieredElectricity !== "boolean") {
      return sendError(res, "Tùy chọn phát hành hoặc cách tính điện không hợp lệ", null, 400);
    }

    // Kiểm tra từng dòng ở server: từ chối chỉ số mới nhỏ hơn chỉ số cũ
    const rowErrors = {};
    const seenRoomIds = new Set();
    rows.forEach((row, idx) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        rowErrors[`row_${idx}`] = "Dòng chỉ số không hợp lệ";
        return;
      }
      const oldE = Number(row.oldElectricity);
      const newE = Number(row.newElectricity);
      const oldW = Number(row.oldWater);
      const newW = Number(row.newWater);
      const key = row.roomId || `row_${idx}`;

      if (typeof row.roomId !== "string" || !/^[a-f\d]{24}$/i.test(row.roomId)) {
        rowErrors[key] = "Mã phòng không hợp lệ";
      } else if (seenRoomIds.has(row.roomId)) {
        rowErrors[key] = "Phòng bị lặp trong cùng bảng chỉ số";
      } else {
        seenRoomIds.add(row.roomId);
      }

      if (![row.oldElectricity, row.newElectricity, row.oldWater, row.newWater].every(isValidMeterValue)) {
        rowErrors[key] = "Chỉ số điện/nước phải là số hợp lệ";
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

    // Validate every target before the first write. A batch can never touch another landlord's room.
    const roomIds = rows.map((row) => row.roomId);
    const roomQuery = { _id: { $in: roomIds } };
    if (req.user.role === "landlord") roomQuery.ownerId = req.user._id;
    const [targetRooms, activeContracts] = await Promise.all([
      Room.find(roomQuery),
      Contract.find({
        roomId: { $in: roomIds },
        status: "active",
        ...(req.user.role === "landlord" ? { landlordId: req.user._id } : {}),
      }),
    ]);
    const targetById = new Map(targetRooms.map((room) => [room._id.toString(), room]));
    const contractByRoom = new Map(activeContracts.map((contract) => [contract.roomId.toString(), contract]));
    for (const roomId of roomIds) {
      const room = targetById.get(roomId);
      if (!room || (room.status !== "rented" && !contractByRoom.has(roomId))) {
        rowErrors[roomId] = "Phòng không tồn tại, không có trạng thái thuê hợp lệ hoặc không thuộc quyền quản lý của bạn";
      }
    }
    if (Object.keys(rowErrors).length) return sendError(res, "Có phòng không hợp lệ trong bảng chỉ số", { rowErrors }, 400);

    const existingInvoices = await Invoice.find({
      roomId: { $in: roomIds }, month: numMonth, year: numYear,
      ...(req.user.role === "landlord" ? { landlordId: req.user._id } : {}),
    });
    const invoiceByRoom = new Map(existingInvoices.map((invoice) => [invoice.roomId.toString(), invoice]));
    for (const row of rows) {
      const issued = invoiceByRoom.get(row.roomId);
      if (issued && (
        Number(row.oldElectricity) !== issued.oldElectricity || Number(row.newElectricity) !== issued.newElectricity ||
        Number(row.oldWater) !== issued.oldWater || Number(row.newWater) !== issued.newWater
      )) {
        rowErrors[row.roomId] = "Kỳ này đã phát hành hóa đơn; không thể sửa chỉ số đã chốt";
      }
    }
    if (Object.keys(rowErrors).length) return sendError(res, "Không thể sửa chỉ số của kỳ đã phát hành", { rowErrors }, 409);

    // Load and validate contract rates for every row before mutating any record.
    for (const roomId of roomIds) {
      const room = targetById.get(roomId);
      const contract = contractByRoom.get(roomId);
      const rates = [contract?.rentPrice ?? room.price, contract?.electricityPrice ?? room.electricityPrice, contract?.waterPrice ?? room.waterPrice, contract?.serviceFee ?? room.serviceFee];
      if (!rates.every((value) => Number.isFinite(Number(value)) && Number(value) >= 0)) {
        rowErrors[roomId] = "Tiền phòng, đơn giá điện/nước hoặc phí dịch vụ của phòng không hợp lệ";
      }
    }
    if (Object.keys(rowErrors).length) return sendError(res, "Có đơn giá không hợp lệ trong bảng chỉ số", { rowErrors }, 400);

    for (const row of rows) {
      const room = targetById.get(row.roomId);

      const issuedInvoice = invoiceByRoom.get(row.roomId);
      if (issuedInvoice) {
        skippedInvoices.push({
          roomId: room._id,
          roomTitle: room.title,
          reason: `Giữ nguyên chỉ số đã chốt trong hóa đơn ${issuedInvoice.invoiceCode}`,
        });
        continue;
      }

      const activeContract = contractByRoom.get(row.roomId);

      const oldElectricity = Number(row.oldElectricity);
      const newElectricity = Number(row.newElectricity);
      const oldWater = Number(row.oldWater);
      const newWater = Number(row.newWater);

      let createdInvoice = null;
      if (issueInvoices) {
        const roomPrice = activeContract?.rentPrice ?? room.price ?? 0;
        const electricityPrice = activeContract?.electricityPrice ?? room.electricityPrice ?? 3500;
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

        createdInvoice = await Invoice.create({
          invoiceCode,
          roomId: room._id,
          contractId: activeContract?._id || null,
          tenantId: activeContract?.tenantId || room.tenant?.userId || null,
          landlordId: room.ownerId || req.user._id,
          // Reserve the unique room-period invoice before changing the meter reading.
          meterReadingId: null,
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
        // Track the invoice reservation immediately so a later failure can report partial progress.
        createdInvoices.push(createdInvoice);

      }

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
      if (createdInvoice) {
        createdInvoice.meterReadingId = reading._id;
        await createdInvoice.save();
      }

      // Only the current period updates the room counters; historical edits stay in history.
      const now = new Date();
      if (numYear === now.getFullYear() && numMonth === now.getMonth() + 1) {
        room.currentElectricity = newElectricity;
        room.currentWater = newWater;
        await room.save();
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
    if (savedReadings.length || createdInvoices.length) {
      return sendError(
        res,
        `Batch bị dừng sau khi đã ghi một phần (${savedReadings.length} chỉ số, ${createdInvoices.length} hóa đơn). Tải lại bảng để đối soát trước khi thử tiếp.`,
        { partial: true, savedReadingCount: savedReadings.length, createdInvoiceCount: createdInvoices.length },
        500
      );
    }
    if (error.code === 11000) return sendError(res, "Dữ liệu tháng này đã được tạo bởi một yêu cầu khác; hãy tải lại bảng và thử lại", error.keyValue || null, 409);
    return next(error);
  }
};

module.exports = {
  getMeterSheet,
  saveBatchMeterReadings,
  calculateTieredElectricity,
  isValidMeterValue,
  isValidPeriod,
};
