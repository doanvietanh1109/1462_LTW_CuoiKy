const integerVnd = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

export const formatRevenueVnd = (amount) => `${integerVnd.format(Number(amount) || 0)} ₫`;

export const formatRevenueAxisVnd = (amount) => {
  const value = Number(amount) || 0;
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tỷ`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} tr`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} nghìn`;
  return `${integerVnd.format(value)} ₫`;
};

export const getRevenueChartData = (records) => {
  const validRecords = Array.isArray(records) ? records.filter((item) => item && item.label != null && item.totalRevenue !== null && item.totalRevenue !== "" && Number.isFinite(Number(item.totalRevenue))) : [];
  return {
    labels: validRecords.map((item) => String(item.label)),
    values: validRecords.map((item) => Number(item.totalRevenue)),
  };
};
