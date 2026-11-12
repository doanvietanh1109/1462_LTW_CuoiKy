const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    district: { type: String, required: true, trim: true },
    image: { type: String }, // Main image (backward compatible)
    images: { type: [String], default: [] }, // Multiple images array
    description: { type: String },
    amenities: { type: [String], default: [] },
    // bedrooms: { type: Number, default: 1 },
    // bathrooms: { type: Number, default: 1 },
    area: { type: Number, default: 25, min: 0 }, // m²
    roomNumber: { type: String, trim: true, default: "" },
    blockId: { type: mongoose.Schema.Types.ObjectId, ref: "MotelBlock", default: null },
    electricityPrice: { type: Number, default: 3500, min: 0 },
    waterPrice: { type: Number, default: 15000, min: 0 },
    serviceFee: { type: Number, default: 100000, min: 0 },
    currentElectricity: { type: Number, default: 0, min: 0 },
    currentWater: { type: Number, default: 0, min: 0 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ownerName: { type: String },
    tenant: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
    },
    status: {
      type: String,
      enum: ["available", "rented", "maintenance", "hidden", "deleted"],
      default: "available",
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

module.exports = { Room };
