const mongoose = require("mongoose");

const contactRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  subject: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["new", "in_review", "resolved"], default: "new" },
}, { timestamps: true, collection: "contactrequests" });

const ContactRequest = mongoose.models.ContactRequest || mongoose.model("ContactRequest", contactRequestSchema);
module.exports = { ContactRequest };
