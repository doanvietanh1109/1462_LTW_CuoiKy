const mongoose = require("mongoose");

const contactInquirySchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    landlordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["new", "contacted"],
      default: "new",
    },
  },
  { timestamps: true }
);

const ContactInquiry = mongoose.model("ContactInquiry", contactInquirySchema);

module.exports = { ContactInquiry };
