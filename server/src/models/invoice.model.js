const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceCode: { type: String, required: true, unique: true, trim: true },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meterReadingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeterReading",
      default: null,
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2020, max: 2100 },
    roomPrice: { type: Number, required: true, min: 0 },
    oldElectricity: { type: Number, required: true, min: 0 },
    newElectricity: { type: Number, required: true, min: 0 },
    electricityUsage: { type: Number, required: true, min: 0 },
    electricityPrice: { type: Number, required: true, min: 0 },
    electricityCost: { type: Number, required: true, min: 0 },
    useTieredElectricity: { type: Boolean, default: false },
    oldWater: { type: Number, required: true, min: 0 },
    newWater: { type: Number, required: true, min: 0 },
    waterUsage: { type: Number, required: true, min: 0 },
    waterPrice: { type: Number, required: true, min: 0 },
    waterCost: { type: Number, required: true, min: 0 },
    serviceFee: { type: Number, required: true, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["unpaid", "pending_confirmation", "paid"],
      default: "unpaid",
    },
    paymentConfirmationStatus: { type: String, enum: ["none", "pending", "confirmed", "rejected"], default: "none" },
    paymentMethod: { type: String, enum: ["bank_transfer", "cash", null], default: null },
    paymentRejectionReason: { type: String, default: "", maxlength: 300 },
    paymentSubmittedAt: { type: Date, default: null },
    paymentConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    paymentConfirmationRequests: [{ tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, submittedAt: { type: Date, default: Date.now }, status: { type: String, enum: ["pending", "confirmed", "rejected"] }, reviewedAt: Date, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, note: { type: String, maxlength: 300 } }],
    paidAt: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    reminderSentAt: { type: Date, default: null },
    reminderCount: { type: Number, default: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Một hợp đồng có tối đa một hóa đơn cho mỗi kỳ; phòng có thể đổi người thuê giữa tháng.
invoiceSchema.index(
  { roomId: 1, month: 1, year: 1, contractId: 1 },
  { unique: true, name: "uniq_invoice_room_period_contract" }
);

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = { Invoice };
