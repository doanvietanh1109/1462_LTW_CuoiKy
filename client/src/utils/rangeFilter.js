export const moveRangeEndpoint = ({ min, max, value, endpoint, step, lowerBound, upperBound }) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return { min, max };
  const safeStep = Math.min(step, upperBound - lowerBound);

  if (endpoint === "min") {
    return {
      min: Math.min(Math.max(numericValue, lowerBound), max - safeStep),
      max,
    };
  }

  return {
    min,
    max: Math.max(Math.min(numericValue, upperBound), min + safeStep),
  };
};

export const isWithinRange = (value, min, max) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= min && numericValue <= max;
};

export const formatPriceFilterValue = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "0 đ";
  if (amount < 1000000) return `${amount.toLocaleString("vi-VN")} đ`;
  const millions = amount / 1000000;
  const formatted = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(millions);
  return `${formatted} triệu đồng`;
};
