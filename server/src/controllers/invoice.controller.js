const mongoose = require("mongoose");
const { Invoice } = require("../models/invoice.model");
const { Room } = require("../models/room.model");
const { Contract } = require("../models/contract.model");
const { MeterReading } = require("../models/meterReading.model");
const { calculateTieredElectricity } = require("./meterReading.controller");
const { sendSuccess, sendError } = require("../utils/response");
const { createNotification } = require("../utils/createNotification");
const { User } = require("../models/user.model");

const isNumericInput = (value) => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value));
const validPeriod = (month, year) => isNumericInput(month) && Number.isInteger(Number(month)) && Number(month) >= 1 && Number(month) <= 12 && isNumericInput(year) && Number.isInteger(Number(year)) && Number(year) >= 2020 && Number(year) <= 2100;
const validNonNegativeNumber = (value) => isNumericInput(value) && Number(value) >= 0;
const isDuplicateKeyError = (error) => error?.code === 11000;

const isTenantInvoiceOwner = (invoice, user) => Boolean(
  (invoice.tenantId?._id || invoice.tenantId)?.toString() === user._id.toString() ||
  invoice.contractId?.tenantId?.toString() === user._id.toString() ||
  invoice.contractId?.tenantEmail?.toLowerCase() === user.email?.toLowerCase()
);
const hasPendingPaymentRequest = (invoice) => invoice.paymentConfirmationStatus === "pending" || invoice.status === "pending_confirmation";

// Lấy danh sách hóa đơn (có kiểm tra quyền 403 cho người thuê)
const getInvoices = async (req, res, next) => {
  try {
    const { month, year, status, roomId, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (month !== undefined && (!Number.isInteger(Number(month)) || Number(month) < 1 || Number(month) > 12)) return sendError(res, "Tháng không hợp lệ", null, 400);
    if (year !== undefined && (!Number.isInteger(Number(year)) || Number(year) < 2020 || Number(year) > 2100)) return sendError(res, "Năm không hợp lệ", null, 400);
    if (status && !["all", "unpaid", "pending_confirmation", "paid"].includes(status)) return sendError(res, "Trạng thái hóa đơn không hợp lệ", null, 400);
    if (roomId && !mongoose.isValidObjectId(roomId)) return sendError(res, "Mã phòng không hợp lệ", null, 400);
    if (search !== undefined) {
      if (typeof search !== "string" || search.length > 100) return sendError(res, "Từ khóa tìm kiếm không hợp lệ", null, 400);
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (escaped) query.invoiceCode = { $regex: escaped, $options: "i" };
    }

    // RÀNG BUỘC KỸ THUẬT RIÊNG ĐỀ 4:
    // Người thuê chỉ xem được hóa đơn của phòng mình: kiểm tra ở API, gọi thẳng API hóa đơn phòng khác phải nhận 403
    if (req.user.role === "user") {
      const myContracts = await Contract.find({
        $or: [{ tenantId: req.user._id }, { tenantEmail: req.user.email }],
      }).select("_id roomId");
      const myContractIds = myContracts.map((contract) => contract._id);
      const myRooms = await Room.find({
        $or: [
          { "tenant.userId": req.user._id },
          { "tenant.email": req.user.email },
        ],
      }).select("_id");

      const allowedRoomIds = new Set([
        ...myContracts.map((c) => c.roomId.toString()),
        ...myRooms.map((r) => r._id.toString()),
      ]);

      if (roomId) {
        if (!allowedRoomIds.has(roomId.toString())) {
          return sendError(
            res,
            "403 Forbidden: Bạn chỉ được phép xem hóa đơn của phòng mình đang thuê!",
            null,
            403
          );
        }
        query.roomId = roomId;
        query.$and = [{ $or: [{ tenantId: req.user._id }, { contractId: { $in: myContractIds } }] }];
      } else {
        // Room.tenant is mutable current state and cannot authorize historical invoices.
        query.$or = [
          { tenantId: req.user._id },
          { contractId: { $in: myContractIds } },
        ];
      }
    } else if (req.user.role === "landlord") {
      query.landlordId = req.user._id;
      if (roomId) query.roomId = roomId;
    } else if (roomId) {
      query.roomId = roomId;
    }

    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (status === "paid") query.status = "paid";
    if (status === "unpaid") Object.assign(query, { status: "unpaid", paymentConfirmationStatus: { $ne: "pending" } });
    if (status === "pending_confirmation") {
      const existingOr = query.$or;
      delete query.$or;
      query.$and = [...(query.$and || []), ...(existingOr ? [{ $or: existingOr }] : []), { $or: [{ status: "pending_confirmation" }, { status: "unpaid", paymentConfirmationStatus: "pending" }] }];
    }

    if (!Number.isInteger(Number(page)) || !Number.isInteger(Number(limit)) || Number(page) < 1 || Number(limit) < 1) return sendError(res, "Phân trang không hợp lệ", null, 400);
    const pageNum = Number(page);
    const limitNum = Math.min(100, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate("roomId", "title roomNumber price area district status tenant")
        .populate("tenantId", "name email phone")
        .populate("contractId", "contractCode tenantName tenantPhone tenantEmail")
        .sort({ year: -1, month: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Invoice.countDocuments(query),
    ]);

    return sendSuccess(res, "Lấy danh sách hóa đơn thành công", {
      invoices,
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

// Xem chi tiết 1 hóa đơn (kiểm tra nghiêm ngặt quyền 403 nếu người thuê xem hóa đơn phòng khác)
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("roomId", "title roomNumber price area district status tenant blockId")
      .populate("tenantId", "name email phone")
      .populate("landlordId", "name email phone")
      .populate("contractId", "contractCode tenantName tenantEmail tenantPhone startDate endDate");

    if (!invoice) {
      return sendError(res, "Không tìm thấy hóa đơn", null, 404);
    }

    if (req.user.role === "user") {
      if (!isTenantInvoiceOwner(invoice, req.user)) {
        return sendError(
          res,
          "403 Forbidden: Người thuê không được phép xem hóa đơn của phòng khác!",
          null,
          403
        );
      }
    }

    return sendSuccess(res, "Lấy chi tiết hóa đơn thành công", { invoice });
  } catch (error) {
    return next(error);
  }
};

const getPaymentInstructions = async (req, res, next) => {
  try {
    if (req.user.role !== "user") return sendError(res, "Chỉ người thuê mới được xem hướng dẫn thanh toán", null, 403);
    const invoice = await Invoice.findById(req.params.id).populate("roomId", "title roomNumber tenant").populate("contractId", "tenantEmail");
    if (!invoice) return sendError(res, "Không tìm thấy hóa đơn", null, 404);
    if (!isTenantInvoiceOwner(invoice, req.user)) return sendError(res, "Bạn không có quyền xem hướng dẫn thanh toán hóa đơn này", null, 403);
    if (invoice.status !== "unpaid" || hasPendingPaymentRequest(invoice)) return sendError(res, "Hóa đơn không ở trạng thái chờ thanh toán", null, 409);
    const landlord = await User.findById(invoice.landlordId).select("+bankAccount");
    if (!landlord?.bankAccount) return sendSuccess(res, "Chủ trọ chưa cấu hình tài khoản nhận tiền", { configured: false });
    const amount = Math.round(Number(invoice.totalAmount));
    if (!Number.isSafeInteger(amount) || amount <= 0 || String(amount).length > 13) return sendError(res, "Số tiền hóa đơn không hợp lệ để tạo VietQR", null, 422);
    const transferContent = `RIPT${invoice._id.toString().toUpperCase()}`;
    const bank = landlord.bankAccount;
    const qr = new URL(`https://img.vietqr.io/image/${encodeURIComponent(bank.bankBin)}-${encodeURIComponent(bank.accountNumber)}-compact2.svg`);
    qr.searchParams.set("amount", String(amount)); qr.searchParams.set("addInfo", transferContent); qr.searchParams.set("accountName", bank.accountName);
    return sendSuccess(res, "Hướng dẫn thanh toán", { configured: true, invoice: { id: invoice._id, invoiceCode: invoice.invoiceCode, month: invoice.month, year: invoice.year, amount, room: invoice.roomId?.roomNumber || invoice.roomId?.title || "" }, bank: { bankBin: bank.bankBin, bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName }, transferContent, qrUrl: qr.toString() });
  } catch (error) { return next(error); }
};

// Phát hành hóa đơn đơn lẻ (Tính toán hoàn toàn ở Server)
const createInvoice = async (req, res, next) => {
  try {
    const {
      roomId,
      month,
      year,
      oldElectricity,
      newElectricity,
      oldWater,
      newWater,
      serviceFee,
      useTieredElectricity = false,
      note,
    } = req.body;

    if (!roomId || !validPeriod(month, year)) {
      return sendError(res, "Phòng, tháng và năm là bắt buộc", null, 400);
    }

    if (!mongoose.isValidObjectId(roomId)) return sendError(res, "Mã phòng không hợp lệ", null, 400);
    if (![oldElectricity, newElectricity, oldWater, newWater].every(validNonNegativeNumber)) {
      return sendError(res, "Chỉ số điện/nước phải là số hợp lệ không âm", null, 400);
    }
    if (serviceFee !== undefined && !validNonNegativeNumber(serviceFee)) {
      return sendError(res, "Phí dịch vụ phải là số hợp lệ không âm", null, 400);
    }
    if (typeof useTieredElectricity !== "boolean") return sendError(res, "Cấu hình giá điện không hợp lệ", null, 400);

    const numMonth = Number(month);
    const numYear = Number(year);
    const oldE = Number(oldElectricity);
    const newE = Number(newElectricity);
    const oldW = Number(oldWater);
    const newW = Number(newWater);

    // Từ chối chỉ số mới nhỏ hơn chỉ số cũ
    if (newE < oldE) {
      return sendError(
        res,
        `Từ chối phát hành: Chỉ số điện mới (${newE}) nhỏ hơn chỉ số điện cũ (${oldE})`,
        null,
        400
      );
    }
    if (newW < oldW) {
      return sendError(
        res,
        `Từ chối phát hành: Chỉ số nước mới (${newW}) nhỏ hơn chỉ số nước cũ (${oldW})`,
        null,
        400
      );
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return sendError(res, "Không tìm thấy phòng", null, 404);
    }
    if (req.user.role === "landlord" && room.ownerId?.toString() !== req.user._id.toString()) {
      return sendError(res, "Bạn không có quyền quản lý phòng này", null, 403);
    }
    if (room.status !== "rented") return sendError(res, "Chỉ được lập hóa đơn cho phòng đang thuê", null, 400);

    const activeContract = await Contract.findOne({
      roomId: room._id,
      status: "active",
    });

    const duplicate = await Invoice.findOne({ roomId, month: numMonth, year: numYear, contractId: activeContract?._id || null });
    if (duplicate) {
      return sendError(
        res,
        `Hợp đồng này đã có hóa đơn tháng ${numMonth}/${numYear} (${duplicate.invoiceCode}).`,
        { existingInvoiceId: duplicate._id },
        400
      );
    }

    const roomPrice = activeContract?.rentPrice ?? room.price ?? 0;
    const electricityPrice =
      activeContract?.electricityPrice ?? room.electricityPrice ?? 3500;
    const waterPrice = activeContract?.waterPrice ?? room.waterPrice ?? 15000;
    const finalServiceFee =
      serviceFee !== undefined
        ? Number(serviceFee)
        : activeContract?.serviceFee ?? room.serviceFee ?? 100000;
    if (![roomPrice, electricityPrice, waterPrice, finalServiceFee].every(validNonNegativeNumber)) {
      return sendError(res, "Tiền phòng, đơn giá điện/nước hoặc phí dịch vụ của phòng không hợp lệ", null, 400);
    }

    // Công thức tính ở server:
    // Hóa đơn = tiền phòng + (số điện mới - cũ) × đơn giá điện + (số nước mới - cũ) × đơn giá nước + phí dịch vụ
    const electricityUsage = newE - oldE;
    const waterUsage = newW - oldW;
    const electricityCost = useTieredElectricity
      ? calculateTieredElectricity(electricityUsage)
      : electricityUsage * electricityPrice;
    const waterCost = waterUsage * waterPrice;
    const totalAmount = roomPrice + electricityCost + waterCost + finalServiceFee;

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
      // Claim the unique room-period invoice before mutating meter records. Concurrent losers
      // must not overwrite the winning request's reading.
      meterReadingId: null,
      month: numMonth,
      year: numYear,
      roomPrice,
      oldElectricity: oldE,
      newElectricity: newE,
      electricityUsage,
      electricityPrice,
      electricityCost,
      useTieredElectricity: Boolean(useTieredElectricity),
      oldWater: oldW,
      newWater: newW,
      waterUsage,
      waterPrice,
      waterCost,
      serviceFee: finalServiceFee,
      totalAmount,
      status: "unpaid",
      dueDate: new Date(numYear, numMonth - 1, 10),
      note: note || "",
    });

    const reading = await MeterReading.findOneAndUpdate(
      { roomId: room._id, month: numMonth, year: numYear, contractId: activeContract?._id || null },
      {
        roomId: room._id,
        contractId: activeContract?._id || null,
        landlordId: room.ownerId || req.user._id,
        month: numMonth,
        year: numYear,
        oldElectricity: oldE,
        newElectricity: newE,
        oldWater: oldW,
        newWater: newW,
      },
      { upsert: true, new: true }
    );
    invoice.meterReadingId = reading._id;
    await invoice.save();

    const currentPeriod = new Date();
    if (numYear === currentPeriod.getFullYear() && numMonth === currentPeriod.getMonth() + 1) {
      room.currentElectricity = newE;
      room.currentWater = newW;
      await room.save();
    }

    const populated = await Invoice.findById(invoice._id)
      .populate("roomId", "title roomNumber price area district")
      .populate("tenantId", "name email phone");

    await createNotification({ userId: invoice.tenantId, type: "invoice", title: "Hóa đơn mới cần thanh toán",
      message: `Bạn có hóa đơn tiền phòng tháng ${numMonth}/${numYear} (${invoice.invoiceCode}) với số tiền ${Number(invoice.totalAmount).toLocaleString("vi-VN")} đồng. Vui lòng kiểm tra và thanh toán trước hạn.`, resourceType: "invoice", resourceId: invoice._id });

    return sendSuccess(res, "Phát hành hóa đơn thành công", { invoice: populated }, 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) return sendError(res, "Hóa đơn phòng/tháng này đã được tạo bởi yêu cầu khác", error.keyValue || null, 409);
    return next(error);
  }
};

// Đánh dấu đã thu tiền (Chủ trọ / Admin)
const markInvoicePaid = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return sendError(res, "Không tìm thấy hóa đơn", null, 404);
    }

    if (req.user.role === "landlord" && invoice.landlordId.toString() !== req.user._id.toString()) {
      return sendError(res, "Bạn không có quyền thay đổi hóa đơn này", null, 403);
    }
    if (invoice.status === "paid") return sendError(res, "Hóa đơn đã được xác nhận đã thu tiền", null, 409);
    const pending = hasPendingPaymentRequest(invoice);
    const paymentMethod = pending ? "bank_transfer" : "cash";
    if (req.body?.paymentMethod && req.body.paymentMethod !== paymentMethod) return sendError(res, "Phương thức thanh toán không phù hợp với trạng thái hóa đơn", null, 400);
    if (req.user.role === "landlord" && !pending && req.body?.paymentMethod !== "cash") return sendError(res, "Hãy xác nhận rõ khoản tiền mặt đã thực nhận", null, 400);
    const paymentStateFilter = pending
      ? (invoice.status === "pending_confirmation" ? {} : { paymentConfirmationStatus: "pending" })
      : { paymentConfirmationStatus: { $ne: "pending" } };
    const paid = await Invoice.findOneAndUpdate({ _id: invoice._id, status: pending ? { $in: ["unpaid", "pending_confirmation"] } : "unpaid", ...paymentStateFilter }, { $set: { status: "paid", paymentConfirmationStatus: pending ? "confirmed" : "none", paymentMethod, paymentRejectionReason: "", paidAt: new Date(), paymentConfirmedBy: req.user._id }, ...(pending ? { $push: { paymentConfirmationRequests: { tenantId: invoice.tenantId, submittedAt: invoice.paymentSubmittedAt || new Date(), status: "confirmed", reviewedAt: new Date(), reviewedBy: req.user._id } } } : {}) }, { new: true });
    if (!paid) return sendError(res, "Hóa đơn đã được xử lý", null, 409);
    invoice.status = paid.status;
    const paymentRequest = [...(invoice.paymentConfirmationRequests || [])].reverse().find((request) => request.status === "pending");
    await createNotification({ userId: paymentRequest?.tenantId || invoice.tenantId, type: "invoice", title: pending ? "Thanh toán đã được xác nhận" : "Đã ghi nhận thanh toán tiền mặt",
      message: pending ? `Chủ trọ đã xác nhận nhận đủ ${Number(invoice.totalAmount).toLocaleString("vi-VN")} đồng cho hóa đơn ${invoice.invoiceCode}. Hóa đơn đã được ghi nhận thanh toán.` : `Chủ trọ đã xác nhận nhận tiền mặt cho hóa đơn ${invoice.invoiceCode}.`, resourceType: "invoice", resourceId: invoice._id });

    const populated = await Invoice.findById(invoice._id)
      .populate("roomId", "title roomNumber price area district")
      .populate("tenantId", "name email phone");

    return sendSuccess(res, "Đã đánh dấu thu tiền hóa đơn thành công!", {
      invoice: populated,
    });
  } catch (error) {
    return next(error);
  }
};

// Người thuê tự xác nhận thanh toán hóa đơn của phòng mình
const tenantPayInvoice = async (req, res, next) => {
  try {
    if (req.user.role !== "user") return sendError(res, "Chỉ người thuê mới được gửi yêu cầu xác nhận thanh toán", null, 403);
    const invoice = await Invoice.findById(req.params.id)
      .populate("roomId", "title roomNumber price area district tenant")
      .populate("contractId", "tenantEmail");

    if (!invoice) {
      return sendError(res, "Không tìm thấy hóa đơn", null, 404);
    }
    if (req.user.role === "landlord" && invoice.landlordId.toString() !== req.user._id.toString()) {
      return sendError(res, "Bạn không có quyền thanh toán hóa đơn này", null, 403);
    }

    if (req.user.role === "user") {
      if (!isTenantInvoiceOwner(invoice, req.user)) {
        return sendError(
          res,
          "403 Forbidden: Bạn chỉ có thể thanh toán hóa đơn của phòng mình!",
          null,
          403
        );
      }
    }

    if (invoice.status !== "unpaid" || hasPendingPaymentRequest(invoice)) return sendError(res, "Hóa đơn không ở trạng thái có thể gửi xác nhận thanh toán", null, 409);
    const submittedAt = new Date();
    const updated = await Invoice.findOneAndUpdate({ _id: invoice._id, status: "unpaid", paymentConfirmationStatus: { $ne: "pending" } }, { $set: { paymentConfirmationStatus: "pending", paymentSubmittedAt: submittedAt, paymentRejectionReason: "" }, $push: { paymentConfirmationRequests: { tenantId: req.user._id, submittedAt, status: "pending" } } }, { new: true });
    if (!updated) return sendError(res, "Đã có yêu cầu thanh toán hoặc hóa đơn đã được xử lý", null, 409);
    const roomLabel = invoice.roomId?.roomNumber || invoice.roomId?.title || "phòng thuê";
    await Promise.all([
      createNotification({ userId: invoice.landlordId, type: "invoice", title: "Có yêu cầu xác nhận chuyển khoản", message: `Người thuê phòng ${roomLabel} đã báo chuyển khoản ${Number(invoice.totalAmount).toLocaleString("vi-VN")} đồng cho hóa đơn ${invoice.invoiceCode}. Vui lòng kiểm tra tài khoản ngân hàng trước khi xác nhận.`, resourceType: "invoice", resourceId: invoice._id }),
      createNotification({ userId: req.user._id, type: "invoice", title: "Đã gửi yêu cầu xác nhận thanh toán", message: `Yêu cầu xác nhận chuyển khoản cho hóa đơn ${invoice.invoiceCode} đã được gửi. Vui lòng chờ chủ trọ kiểm tra.`, resourceType: "invoice", resourceId: invoice._id }),
    ]);

    const populated = await Invoice.findById(invoice._id)
      .populate("roomId", "title roomNumber price area district")
      .populate("tenantId", "name email phone");

    return sendSuccess(res, "Đã gửi yêu cầu xác nhận thanh toán tới chủ trọ", {
      invoice: populated,
    });
  } catch (error) {
    return next(error);
  }
};

const rejectPaymentRequest = async (req, res, next) => {
  try {
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 300) : "";
    const current = await Invoice.findById(req.params.id);
    if (!current) return sendError(res, "Không tìm thấy hóa đơn", null, 404);
    if (req.user.role === "landlord" && current.landlordId.toString() !== req.user._id.toString()) return sendError(res, "Bạn không có quyền thay đổi hóa đơn này", null, 403);
    if (!hasPendingPaymentRequest(current)) return sendError(res, "Hóa đơn không có yêu cầu chờ xác nhận", null, 409);
    const currentRequest = [...(current.paymentConfirmationRequests || [])].reverse().find((request) => request.status === "pending");
    const legacyPending = current.status === "pending_confirmation";
    const invoice = await Invoice.findOneAndUpdate({ _id: req.params.id, landlordId: req.user._id, status: legacyPending ? "pending_confirmation" : "unpaid", ...(legacyPending ? {} : { paymentConfirmationStatus: "pending" }) }, { $set: { status: "unpaid", paymentConfirmationStatus: "rejected", paymentSubmittedAt: null, paymentRejectionReason: reason }, $push: { paymentConfirmationRequests: { tenantId: currentRequest?.tenantId || current.tenantId, submittedAt: current.paymentSubmittedAt || new Date(), status: "rejected", reviewedAt: new Date(), reviewedBy: req.user._id, note: reason } } }, { new: true });
    if (!invoice) return sendError(res, "Không tìm thấy yêu cầu chờ xác nhận thuộc quyền của bạn", null, 404);
    await createNotification({ userId: currentRequest?.tenantId || invoice.tenantId, type: "invoice", title: "Yêu cầu xác nhận thanh toán chưa được chấp thuận", message: `Chủ trọ chưa thể xác nhận khoản chuyển tiền của hóa đơn ${invoice.invoiceCode}.${reason ? ` Lý do: ${reason}` : " Vui lòng kiểm tra giao dịch hoặc liên hệ chủ trọ."}`, resourceType: "invoice", resourceId: invoice._id });
    return sendSuccess(res, "Đã từ chối yêu cầu xác nhận", { invoice });
  } catch (error) { return next(error); }
};

// Gửi thông báo / email nhắc nợ (Tính năng nâng cao cộng điểm)
const sendDebtReminder = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return sendError(res, "Không tìm thấy hóa đơn", null, 404);
    }
    if (req.user.role === "landlord" && invoice.landlordId.toString() !== req.user._id.toString()) {
      return sendError(res, "Bạn không có quyền nhắc nợ hóa đơn này", null, 403);
    }

    if (invoice.status === "paid") {
      return sendError(res, "Hóa đơn này đã được thanh toán", null, 400);
    }
    return sendError(res, "Email nhắc nợ chưa được cấu hình; hệ thống chưa gửi thông báo", null, 501);
  } catch (error) {
    return next(error);
  }
};

// Thống kê Dashboard bằng MongoDB Aggregation Pipeline:
// 1. Doanh thu theo tháng (12 tháng)
// 2. Danh sách phòng nợ tiền
// 3. Thống kê phòng trống / đang thuê / đang sửa
const getDashboardAggregations = async (req, res, next) => {
  try {
    const matchStage = {};
    const roomMatchStage = { status: { $ne: "deleted" } };

    if (req.user.role === "landlord") {
      matchStage.landlordId = new mongoose.Types.ObjectId(req.user._id);
      roomMatchStage.ownerId = new mongoose.Types.ObjectId(req.user._id);
    }

    // 1. Aggregation Pipeline: Doanh thu theo tháng (từ các hóa đơn đã thu tiền)
    const monthlyRevenueAgg = await Invoice.aggregate([
      {
        $match: {
          ...matchStage,
          status: "paid",
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalRevenue: { $sum: "$totalAmount" },
          roomRevenue: { $sum: "$roomPrice" },
          electricityRevenue: { $sum: "$electricityCost" },
          waterRevenue: { $sum: "$waterCost" },
          serviceRevenue: { $sum: "$serviceFee" },
          paidInvoicesCount: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          label: {
            $concat: [
              "T",
              { $toString: "$_id.month" },
              "/",
              { $toString: "$_id.year" },
            ],
          },
          totalRevenue: 1,
          roomRevenue: 1,
          electricityRevenue: 1,
          waterRevenue: 1,
          serviceRevenue: 1,
          paidInvoicesCount: 1,
        },
      },
    ]);

    // 2. Aggregation Pipeline: Danh sách phòng nợ tiền (unpaid invoices)
    const unpaidRoomsAgg = await Invoice.aggregate([
      {
        $match: {
          ...matchStage,
          status: { $in: ["unpaid", "pending_confirmation"] },
        },
      },
      {
        $lookup: {
          from: "rooms",
          localField: "roomId",
          foreignField: "_id",
          as: "roomInfo",
        },
      },
      { $unwind: { path: "$roomInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "tenantId",
          foreignField: "_id",
          as: "tenantInfo",
        },
      },
      { $unwind: { path: "$tenantInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$roomId",
          roomTitle: { $first: "$roomInfo.title" },
          roomNumber: { $first: "$roomInfo.roomNumber" },
          district: { $first: "$roomInfo.district" },
          tenantName: {
            $first: {
              $ifNull: ["$tenantInfo.name", "$roomInfo.tenant.name"],
            },
          },
          tenantPhone: {
            $first: {
              $ifNull: ["$tenantInfo.phone", "$roomInfo.tenant.phone"],
            },
          },
          tenantEmail: {
            $first: {
              $ifNull: ["$tenantInfo.email", "$roomInfo.tenant.email"],
            },
          },
          totalDebt: { $sum: "$totalAmount" },
          unpaidCount: { $sum: 1 },
          invoices: {
            $push: {
              _id: "$_id",
              invoiceCode: "$invoiceCode",
              month: "$month",
              year: "$year",
              totalAmount: "$totalAmount",
              reminderCount: "$reminderCount",
            },
          },
        },
      },
      { $sort: { totalDebt: -1 } },
    ]);

    // 3. Aggregation Pipeline: Thống kê trạng thái phòng (Trống / Đang thuê / Đang sửa)
    const roomStatusAgg = await Room.aggregate([
      { $match: roomMatchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const availableRoomsList = await Room.find({
      ...roomMatchStage,
      status: "available",
    })
      .populate("blockId", "name")
      .select("title roomNumber price area district status blockId")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const statusCounts = {
      available: 0,
      rented: 0,
      maintenance: 0,
      total: 0,
    };

    roomStatusAgg.forEach((item) => {
      if (item._id in statusCounts) {
        statusCounts[item._id] = item.count;
      }
      statusCounts.total += item.count;
    });

    const totalRevenueAllTime = monthlyRevenueAgg.reduce(
      (sum, item) => sum + item.totalRevenue,
      0
    );
    const totalUnpaidDebt = unpaidRoomsAgg.reduce(
      (sum, item) => sum + item.totalDebt,
      0
    );

    return sendSuccess(res, "Thống kê Aggregation Pipeline thành công", {
      roomStatusCounts: statusCounts,
      availableRoomsList,
      unpaidRooms: unpaidRoomsAgg,
      monthlyRevenue: monthlyRevenueAgg.slice(-12),
      totalRevenueAllTime,
      totalUnpaidDebt,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  getPaymentInstructions,
  createInvoice,
  markInvoicePaid,
  tenantPayInvoice,
  rejectPaymentRequest,
  sendDebtReminder,
  getDashboardAggregations,
  validPeriod,
  validNonNegativeNumber,
  isTenantInvoiceOwner,
  isDuplicateKeyError,
};
