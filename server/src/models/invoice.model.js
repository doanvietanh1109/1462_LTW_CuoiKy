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
    paymentSubmittedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    reminderSentAt: { type: Date, default: null },
    reminderCount: { type: Number, default: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Mỗi phòng chỉ có 1 hóa đơn cho mỗi tháng
invoiceSchema.index({ roomId: 1, month: 1, year: 1 }, { unique: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = { Invoice };
