const { Router } = require("express");
const {
  getMeterSheet,
  saveBatchMeterReadings,
} = require("../controllers/meterReading.controller");
const { requireAuth, requireLandlord } = require("../middlewares/auth.middleware");

const router = Router();

router.use(requireAuth, requireLandlord);
router.get("/sheet", getMeterSheet);
router.post("/batch", saveBatchMeterReadings);

module.exports = router;
