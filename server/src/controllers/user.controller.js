const { User } = require("../models/user.model");
const { Room } = require("../models/room.model");
const { sendSuccess, sendError } = require("../utils/response");

let bankOptionsCache = { expiresAt: 0, banks: [] };
const fetchBankOptions = async () => {
  if (bankOptionsCache.expiresAt > Date.now()) return bankOptionsCache.banks;
  const response = await fetch("https://api.vietqr.io/v2/banks", { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error("Bank list unavailable");
  const payload = await response.json();
  bankOptionsCache = { expiresAt: Date.now() + 86400000, banks: (payload.data || []).filter((bank) => Number(bank.transferSupported) === 1).map(({ bin, shortName, name }) => ({ bin: String(bin), shortName, name })) };
  return bankOptionsCache.banks;
};
const getBankOptions = async (req, res) => {
  try {
    return sendSuccess(res, "Danh sách ngân hàng", { banks: await fetchBankOptions() });
  } catch { return sendError(res, "Không tải được danh sách ngân hàng VietQR. Hãy thử lại sau.", null, 503); }
};

const getMyBankAccount = async (req, res) => {
  const user = await User.findById(req.user._id).select("+bankAccount");
  return sendSuccess(res, "Thông tin tài khoản nhận tiền", { bankAccount: user?.bankAccount || null });
};

const updateMyBankAccount = async (req, res) => {
  try {
    if (req.user.role !== "landlord") return sendError(res, "Chỉ chủ trọ mới được cấu hình tài khoản nhận tiền", null, 403);
    const { bankBin, bankName, accountNumber, accountName } = req.body || {};
    const fieldErrors = {};
    if (!/^\d{6}$/.test(String(bankBin || "")) || typeof bankName !== "string" || !bankName.trim()) fieldErrors.bankBin = "Vui lòng chọn ngân hàng từ danh sách.";
    if (!/^[A-Za-z0-9]{6,19}$/.test(String(accountNumber || ""))) fieldErrors.accountNumber = "Số tài khoản cần có 6–19 chữ cái hoặc chữ số, không chứa khoảng trắng hay dấu phân cách.";
    const normalizedAccountName = typeof accountName === "string" ? accountName.trim() : "";
    if (normalizedAccountName.length < 5 || normalizedAccountName.length > 50 || /[\u0000-\u001f\u007f]/.test(normalizedAccountName)) fieldErrors.accountName = "Tên chủ tài khoản cần dài 5–50 ký tự và không chứa ký tự điều khiển.";
    if (Object.keys(fieldErrors).length) return sendError(res, "Vui lòng kiểm tra các trường thông tin ngân hàng.", { fieldErrors }, 400);
    const banks = await fetchBankOptions();
    const bank = banks.find((item) => item.bin === String(bankBin));
    if (!bank || ![bank.shortName, bank.name].includes(bankName.trim())) return sendError(res, "Hãy chọn ngân hàng từ danh sách VietQR hiện hành", { fieldErrors: { bankBin: "Ngân hàng không khớp với danh sách VietQR. Hãy chọn lại ngân hàng." } }, 400);
    const user = await User.findByIdAndUpdate(req.user._id, { $set: { bankAccount: { bankBin, bankName: bank.shortName || bank.name, accountNumber, accountName: normalizedAccountName, updatedAt: new Date() } } }, { new: true, runValidators: true }).select("+bankAccount");
    return sendSuccess(res, "Đã lưu thông tin tài khoản nhận tiền", { bankAccount: user.bankAccount });
  } catch { return sendError(res, "Không lưu được thông tin tài khoản", null, 400); }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return sendSuccess(res, "Users fetched successfully", { users });
  } catch (error) {
    console.error("Get all users error:", error);
    return sendError(res, "Server error while fetching users", null, 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const isSelf = req.user && req.user._id.toString() === id;
    const isAdmin = req.user && req.user.role === "admin";

    if (!isAdmin && !isSelf) {
      return sendError(res, "You do not have permission to view this user", null, 403);
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return sendError(res, "User not found", null, 404);
    }

    return sendSuccess(res, "User fetched successfully", { user });
  } catch (error) {
    console.error("Get user by id error:", error);
    return sendError(res, "Server error while fetching user", null, 500);
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "blocked"].includes(status)) {
      return sendError(res, "Invalid status", null, 400);
    }

    if (req.user && req.user._id.toString() === id) {
      return sendError(res, "You cannot update your own status", null, 400);
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-password");
    if (!user) {
      return sendError(res, "User not found", null, 404);
    }

    return sendSuccess(res, "User status updated successfully", { user });
  } catch (error) {
    console.error("Update user status error:", error);
    return sendError(res, "Server error while updating user status", null, 500);
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "landlord", "admin"].includes(role)) {
      return sendError(res, "Invalid role", null, 400);
    }

    if (req.user && req.user._id.toString() === id) {
      return sendError(res, "You cannot change your own role", null, 400);
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
    if (!user) {
      return sendError(res, "User not found", null, 404);
    }

    return sendSuccess(res, "User role updated successfully", { user });
  } catch (error) {
    console.error("Update user role error:", error);
    return sendError(res, "Server error while updating user role", null, 500);
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return sendError(res, "Room not found", null, 404);
    }

    const user = await User.findById(userId);
    const bookmarkIndex = user.bookmarkedRooms.indexOf(roomId);

    if (bookmarkIndex > -1) {
      user.bookmarkedRooms.splice(bookmarkIndex, 1);
      await user.save();
      return sendSuccess(res, "Room removed from bookmarks", {
        bookmarked: false,
        bookmarkedRooms: user.bookmarkedRooms
      });
    } else {
      user.bookmarkedRooms.push(roomId);
      await user.save();
      return sendSuccess(res, "Room added to bookmarks", {
        bookmarked: true,
        bookmarkedRooms: user.bookmarkedRooms
      });
    }
  } catch (error) {
    console.error("Toggle bookmark error:", error);
    return sendError(res, "Server error while toggling bookmark", null, 500);
  }
};

const getBookmarkedRooms = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate({
      path: 'bookmarkedRooms',
      match: { status: 'available' }
    });

    if (!user) {
      return sendError(res, "User not found", null, 404);
    }

    return sendSuccess(res, "Bookmarked rooms fetched successfully", {
      rooms: user.bookmarkedRooms
    });
  } catch (error) {
    console.error("Get bookmarked rooms error:", error);
    return sendError(res, "Server error while fetching bookmarked rooms", null, 500);
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return sendError(res, "Email is required", null, 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("-password");

    if (!user) {
      return sendError(res, "User not found", null, 404);
    }

    return sendSuccess(res, "User found", { user });
  } catch (error) {
    console.error("Get user by email error:", error);
    return sendError(res, "Server error while fetching user", null, 500);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  toggleBookmark,
  getBookmarkedRooms,
  getUserByEmail,
  getBankOptions,
  getMyBankAccount,
  updateMyBankAccount,
};
