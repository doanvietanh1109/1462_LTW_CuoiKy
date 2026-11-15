const { sendError } = require("../utils/response");

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const requestsByAddress = new Map();
let lastCleanup = 0;

const contactRateLimit = (req, res, next) => {
  const now = Date.now();
  if (now - lastCleanup > WINDOW_MS) {
    for (const [address, timestamps] of requestsByAddress) {
      const active = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
      if (active.length) requestsByAddress.set(address, active);
      else requestsByAddress.delete(address);
    }
    lastCleanup = now;
  }

  const address = req.ip || req.socket?.remoteAddress || "unknown";
  const active = (requestsByAddress.get(address) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (active.length >= MAX_REQUESTS) {
    return sendError(res, "Bạn đã gửi quá nhiều yêu cầu liên hệ. Vui lòng thử lại sau ít phút.", null, 429);
  }
  active.push(now);
  requestsByAddress.set(address, active);
  return next();
};

module.exports = { contactRateLimit };
