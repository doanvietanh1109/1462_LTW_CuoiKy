const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["invoice", "contract", "repair", "system"], default: "system" },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  resourceType: { type: String, enum: ["invoice", "contract", "repair", null], default: null },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ userId:  1, createdAt: -1 });
const Notification = mongoose.model("Notification", notificationSchema);
module.exports = { Notification };
