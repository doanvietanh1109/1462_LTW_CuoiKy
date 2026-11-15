const { Router } = require("express");
const {
  getRepairRequests,
  createRepairRequest,
  updateRepairStatus,
} = require("../controllers/repairRequest.controller");
const { requireAuth, requireLandlord } = require("../middlewares/auth.middleware");
const { validateObjectId } = require("../middlewares/validate.middleware");
const { upload, handleMulterError, validateImageFiles } = require("../middlewares/upload.middleware");

const router = Router();

router.use(requireAuth);
router.get("/", getRepairRequests);
router.post("/", upload.array("images", 3), handleMulterError, validateImageFiles, createRepairRequest);
router.patch("/:id/status", requireLandlord, validateObjectId("id"), updateRepairStatus);

module.exports = router;
