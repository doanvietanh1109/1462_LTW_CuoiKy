const { Router } = require("express");
const {
  getRepairRequests,
  createRepairRequest,
  updateRepairStatus,
} = require("../controllers/repairRequest.controller");
const { requireAuth, requireLandlord } = require("../middlewares/auth.middleware");
const { validateObjectId } = require("../middlewares/validate.middleware");

const router = Router();

router.use(requireAuth);
router.get("/", getRepairRequests);
router.post("/", createRepairRequest);
router.patch("/:id/status", requireLandlord, validateObjectId("id"), updateRepairStatus);

module.exports = router;
