const { Router } = require("express");
const {
  getContracts,
  getMyActiveContract,
  getContractById,
  createContract,
  selfBookRoomAndCreateContract,
  extendContract,
  terminateContract,
} = require("../controllers/contract.controller");
const { requireAuth, requireLandlord } = require("../middlewares/auth.middleware");
const { validateObjectId } = require("../middlewares/validate.middleware");

const router = Router();

router.use(requireAuth);
router.get("/", getContracts);
router.get("/my-active", getMyActiveContract);
router.post("/self-book", selfBookRoomAndCreateContract);
router.get("/:id", validateObjectId("id"), getContractById);
router.post("/", requireLandlord, createContract);
router.patch("/:id/extend", validateObjectId("id"), extendContract);
router.patch("/:id/tenant-terminate", validateObjectId("id"), terminateContract);
router.patch("/:id/terminate", requireLandlord, validateObjectId("id"), terminateContract);

module.exports = router;
