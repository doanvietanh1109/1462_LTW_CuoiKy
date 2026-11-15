const { Router } = require("express");
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  seedRooms,
  getSearchSuggestions,
  addTenant,
  removeTenant,
} = require("../controllers/room.controller");
const { requireAuth, requireAdmin, requireLandlord, optionalAuth } = require("../middlewares/auth.middleware");
const { upload, handleMulterError, validateImageFiles } = require("../middlewares/upload.middleware");

const router = Router();

router.get("/", optionalAuth, getRooms);
router.get("/suggestions", getSearchSuggestions);
router.get("/:id", optionalAuth, getRoomById);
router.post("/seed", requireAuth, requireAdmin, seedRooms);
router.post("/", requireAuth, requireLandlord, upload.array("images", 8), handleMulterError, validateImageFiles, createRoom);
router.put("/:id", requireAuth, requireLandlord, upload.array("images", 8), handleMulterError, validateImageFiles, updateRoom);
router.delete("/:id", requireAuth, requireLandlord, deleteRoom);
router.post("/:id/tenant", requireAuth, requireLandlord, addTenant);
router.delete("/:id/tenant", requireAuth, requireLandlord, removeTenant);
router.post("/:id/release", requireAuth, requireLandlord, removeTenant);

module.exports = router;
