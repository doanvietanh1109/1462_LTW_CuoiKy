import { apiRequest } from "../api/apiClient";

// Booking data is authoritative only after the backend creates the real order and contract.
export const createContractFromBooking = async ({
  room,
  user,
  tenantPhone,
  identityCard,
  startDate,
  durationMonths = 6,
  finalPrice,
  couponCode,
}) => {
  if (!room?._id && !room?.id) throw new Error("Vui lòng chọn phòng còn trống trước khi đặt.");
  if (!user?._id) throw new Error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");

  const response = await apiRequest("/contracts/self-book", {
    method: "POST",
    body: {
      roomId: room._id || room.id,
      tenantPhone: tenantPhone || user.phone || "",
      identityCard: identityCard || "",
      startDate: startDate || new Date().toISOString().slice(0, 10),
      durationMonths: Number(durationMonths) || 6,
      finalPrice,
      couponCode,
    },
  });

  if (!response?.data?.contract) throw new Error("Máy chủ không trả về hợp đồng đã tạo.");
  return { contract: response.data.contract, fromApi: true };
};
