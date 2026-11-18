export const getPaymentResponseData = (response) => response?.data ?? null;

export const getInvoicePaymentLines = (invoice) => {
  if (!invoice) return [];
  return [
    ["Tiền thuê phòng", invoice.roomPrice],
    ["Tiền điện", invoice.electricityCost],
    ["Tiền nước", invoice.waterCost],
    ["Phí dịch vụ", invoice.serviceFee],
  ]
    .filter(([, amount]) => Number.isFinite(Number(amount)) && Number(amount) > 0)
    .map(([label, amount]) => ({ label, amount: Number(amount) }));
};
