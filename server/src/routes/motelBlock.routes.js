const { Router } = require("express");
const {
  getMotelBlocks,
  getMotelBlockById,
  createMotelBlock,
  updateMotelBlock,
  deleteMotelBlock,
} = require("../controllers/motelBlock.controller");
const {
  requireAuth,
  optionalAuth,
  requireLandlord,
} = require("../middlewares/auth.middleware");
const { validateObjectId } = require("../middlewares/validate.middleware");

const router = Router();

router.get("/", optionalAuth, getMotelBlocks);
router.get("/:id", optionalAuth, validateObjectId("id"), getMotelBlockById);
router.post("/", requireAuth, requireLandlord, createMotelBlock);
router.put("/:id", requireAuth, requireLandlord, validateObjectId("id"), updateMotelBlock);
router.delete("/:id", requireAuth, requireLandlord, validateObjectId("id"), deleteMotelBlock);

module.exports = router;
