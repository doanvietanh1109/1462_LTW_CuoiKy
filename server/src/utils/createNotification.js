const { Notification } = require("../models/notification.model");

const createNotification = async (data) => {
  if (!data.userId) return null;
  try { return await Notification.create(data); }
  catch (error) { console.error("Notification persistence failed:", error.message); return null; }
};

module.exports = { createNotification };
