const mongoose = require("mongoose");

const motelBlockSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ownerName: { type: String },
    defaultElectricityPrice: { type: Number, default: 3500, min: 0 },
    defaultWaterPrice: { type: Number, default: 15000, min: 0 },
    defaultServiceFee: { type: Number, default: 100000, min: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const MotelBlock = mongoose.model("MotelBlock", motelBlockSchema);

module.exports = { MotelBlock };
