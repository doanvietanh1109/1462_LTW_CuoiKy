const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    contractCode: { type: String, required: true, unique: true, trim: true },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MotelBlock",
      default: null,
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantName: { type: String, required: true, trim: true },
    tenantEmail: { type: String, required: true, trim: true, lowercase: true },
    tenantPhone: { type: String, required: true, trim: true },
    identityCard: { type: String, trim: true, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    actualEndDate: { type: Date, default: null },
    rentPrice: { type: Number, required: true, min: 0 },
    deposit: { type: Number, default: 0, min: 0 },
    electricityPrice: { type: Number, default: 3500, min: 0 },
    waterPrice: { type: Number, default: 15000, min: 0 },
    serviceFee: { type: Number, default: 100000, min: 0 },
    initialElectricity: { type: Number, default: 0, min: 0 },
    initialWater: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "terminated"],
      default: "active",
    },
  },
  { timestamps: true }
);

// A database constraint closes the race between concurrent requests that both
// pass the controller's availability check for the same room.
contractSchema.index(
  { roomId: 1 },
  { unique: true, partialFilterExpression: { status: "active" }, name: "uniq_active_contract_per_room" }
);

const Contract = mongoose.model("Contract", contractSchema);

module.exports = { Contract };
