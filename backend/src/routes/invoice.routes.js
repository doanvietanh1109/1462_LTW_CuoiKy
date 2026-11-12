const { Router } = require("express");
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  markInvoicePaid,
  tenantPayInvoice,
  sendDebtReminder,
  getDashboardAggregations,
} = require("../controllers/invoice.controller");
const { requireAuth, requireLandlord } = require("../middlewares/auth.middleware");
const { validateObjectId } = require("../middlewares/validate.middleware");

const router = Router();

router.use(requireAuth);
router.get("/stats/aggregation", requireLandlord, getDashboardAggregations);
router.get("/", getInvoices);
router.get("/:id", validateObjectId("id"), getInvoiceById);
router.post("/", requireLandlord, createInvoice);
router.patch("/:id/tenant-pay", validateObjectId("id"), tenantPayInvoice);
router.patch("/:id/pay", requireLandlord, validateObjectId("id"), markInvoicePaid);
router.post("/:id/remind", requireLandlord, validateObjectId("id"), sendDebtReminder);

module.exports = router;
