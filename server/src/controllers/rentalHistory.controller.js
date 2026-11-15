const { RentalHistory } = require("../models/rentalHistory.model");
const { sendSuccess, sendError } = require("../utils/response");

const getRentalHistory = async (req, res, next) => {
    try {
        if (!req.user || !["admin", "landlord", "user"].includes(req.user.role)) {
            return sendError(res, "Bạn không có quyền xem lịch sử thuê", null, 403);
        }
        const { status } = req.query;
        if (status && !["active", "completed"].includes(status)) {
            return sendError(res, "Trạng thái lịch sử thuê không hợp lệ", null, 400);
        }

        const query = {};
        if (req.user.role === "landlord") query.landlordId = req.user._id;
        if (req.user.role === "user") {
            const tenantClauses = [{ tenantId: req.user._id }];
            if (req.user.email) tenantClauses.push({ tenantEmail: req.user.email });
            query.$or = tenantClauses;
        }
        // Only admins may request another landlord's history explicitly.
        if (req.user.role === "admin" && req.query.landlordId) query.landlordId = req.query.landlordId;
        if (status) query.status = status;

        const history = await RentalHistory.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return sendSuccess(res, "Lấy lịch sử thuê thành công", { history });
    } catch (error) {
        return next(error);
    }
};

// Get rental history by ID
const getRentalHistoryById = async (req, res, next) => {
    try {
        const history = await RentalHistory.findById(req.params.id);

        if (!history) {
            return sendError(res, "Rental history not found", null, 404);
        }

        const isLandlord = req.user.role === "landlord" && req.user._id.toString() === history.landlordId.toString();
        const isTenant = req.user.role === "user" && (
            (history.tenantId && req.user._id.toString() === history.tenantId.toString()) ||
            (history.tenantEmail && req.user.email?.toLowerCase() === history.tenantEmail.toLowerCase())
        );
        if (req.user.role !== "admin" && !isLandlord && !isTenant) {
            return sendError(res, "You do not have permission to view this history", null, 403);
        }

        return sendSuccess(res, "Rental history fetched successfully", { history });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getRentalHistory,
    getRentalHistoryById,
};
