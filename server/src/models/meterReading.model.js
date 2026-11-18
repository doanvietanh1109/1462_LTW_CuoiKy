const mongoose = require("mongoose");

const meterReadingSchema = new mongoose.Schema(
  {
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
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2020, max: 2100 },
    oldElectricity: { type: Number, required: true, min: 0 },
    newElectricity: { type: Number, required: true, min: 0 },
    oldWater: { type: Number, required: true, min: 0 },
    newWater: { type: Number, required: true, min: 0 },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

// Giữ riêng chỉ số theo hợp đồng khi phòng bàn giao trong cùng một kỳ.
meterReadingSchema.index(
  { roomId: 1, month: 1, year: 1, contractId: 1 },
  { unique: true, name: "uniq_meter_room_period_contract" }
);

const MeterReading = mongoose.model("MeterReading", meterReadingSchema);

module.exports = { MeterReading };
