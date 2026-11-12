const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const formatVND = (amount) => {
  const num = Number(amount) || 0;
  return `${num.toLocaleString("vi-VN")} đ`;
};

export const formatDateVN = (dateStr) => {
  if (!dateStr) return "Chưa xác định";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Chưa xác định";
  return d.toLocaleDateString("vi-VN");
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("authToken");
  const { headers = {}, body, ...restOptions } = options;

  const isFormData = body instanceof FormData;
  const requestHeaders = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: requestHeaders,
    body: isFormData
      ? body
      : body && typeof body === "object"
      ? JSON.stringify(body)
      : body,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    const error = new Error(
      payload.message || `Lỗi HTTP ${response.status}`
    );
    error.status = response.status;
    error.details = payload.errors || payload.data || null;
    throw error;
  }

  return payload;
};
