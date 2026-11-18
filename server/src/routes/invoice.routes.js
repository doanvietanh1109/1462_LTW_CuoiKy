const { Router } = require("express");
const {
  getInvoices,
  getInvoiceById,
  getPaymentInstructions,
  createInvoice,
  markInvoicePaid,
  tenantPayInvoice,
  rejectPaymentRequest,
  sendDebtReminder,
  getDashboardAggregations,
} = require("../controllers/invoice.controller");
const { requireAuth, requireLandlord } = require("../middlewares/auth.middleware");
const { validateObjectId } = require("../middlewares/validate.middleware");

const router = Router();

router.use(requireAuth);
router.get("/stats/aggregation", requireLandlord, getDashboardAggregations);
router.get("/:id/payment-instructions", validateObjectId("id"), getPaymentInstructions);
router.get("/", getInvoices);
router.get("/:id", validateObjectId("id"), getInvoiceById);
router.post("/", requireLandlord, createInvoice);
router.patch("/:id/tenant-pay", validateObjectId("id"), tenantPayInvoice);
router.patch("/:id/pay", requireLandlord, validateObjectId("id"), markInvoicePaid);
router.patch("/:id/payment-reject", requireLandlord, validateObjectId("id"), rejectPaymentRequest);
router.post("/:id/remind", requireLandlord, validateObjectId("id"), sendDebtReminder);

module.exports = router;
