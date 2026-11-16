const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["user", "landlord", "admin"],
      default: "user",
    },
    phone: { type: String, trim: true },
    bankAccount: {
      type: new mongoose.Schema({
        bankBin: { type: String, required: true, match: /^\d{6}$/ },
        bankName: { type: String, required: true, trim: true, maxlength: 120 },
        accountNumber: { type: String, required: true, match: /^[A-Za-z0-9]{6,19}$/ },
        accountName: { type: String, required: true, trim: true, minlength: 5, maxlength: 50 },
        updatedAt: { type: Date, default: Date.now },
      }, { _id: false }),
      default: undefined,
      select: false,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    bookmarkedRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Room" }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
