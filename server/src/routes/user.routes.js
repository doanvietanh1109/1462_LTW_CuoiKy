const { Router } = require("express");
const { getAllUsers, getUserById, updateUserStatus, updateUserRole, toggleBookmark, getBookmarkedRooms, getUserByEmail } = require("../controllers/user.controller");
const { requireAuth, requireAdmin, requireLandlord } = require("../middlewares/auth.middleware");

const router = Router();

router.use(requireAuth);
router.get("/", requireAdmin, getAllUsers);
router.get("/search/email", requireLandlord, getUserByEmail);
router.get("/:id", getUserById);
router.patch("/:id/status", requireAdmin, updateUserStatus);
router.patch("/:id/role", requireAdmin, updateUserRole);
router.post("/bookmarks/:roomId", toggleBookmark);
router.get("/bookmarks/list/all", getBookmarkedRooms);

module.exports = router;
