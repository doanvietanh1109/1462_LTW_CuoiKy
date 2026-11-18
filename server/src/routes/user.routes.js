const { Router } = require("express");
const { getAllUsers, getUserById, updateUserStatus, updateUserRole, toggleBookmark, getBookmarkedRooms, getUserByEmail } = require("../controllers/user.controller");
const { requireAuth, requireAdmin, requireLandlord } = require("../middlewares/auth.middleware");

const router = Router();
const { getBankOptions, getMyBankAccount, updateMyBankAccount } = require("../controllers/user.controller");

router.use(requireAuth);
router.get("/bank-options", getBankOptions);
router.get("/me/bank-account", getMyBankAccount);
router.patch("/me/bank-account", requireLandlord, updateMyBankAccount);
router.get("/", requireAdmin, getAllUsers);
router.get("/search/email", requireLandlord, getUserByEmail);
router.get("/:id", getUserById);
router.patch("/:id/status", requireAdmin, updateUserStatus);
router.patch("/:id/role", requireAdmin, updateUserRole);
router.post("/bookmarks/:roomId", toggleBookmark);
router.get("/bookmarks/list/all", getBookmarkedRooms);

module.exports = router;
