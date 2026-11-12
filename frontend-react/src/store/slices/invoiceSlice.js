import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/apiClient";

export const fetchDashboardAggregations = createAsyncThunk(
  "invoices/fetchDashboardAggregations",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiRequest("/invoices/stats/aggregation");
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchMeterSheet = createAsyncThunk(
  "invoices/fetchMeterSheet",
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const res = await apiRequest(`/meter-readings/sheet?month=${month}&year=${year}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveBatchMetersThunk = createAsyncThunk(
  "invoices/saveBatchMeters",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiRequest("/meter-readings/batch", {
        method: "POST",
        body: payload,
      });
      return res;
    } catch (error) {
      return rejectWithValue({
        message: error.message,
        rowErrors: error.details?.rowErrors || {},
      });
    }
  }
);

export const fetchInvoices = createAsyncThunk(
  "invoices/fetchInvoices",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"
        )
      );
      const qs = new URLSearchParams(cleanParams).toString();
      const res = await apiRequest(`/invoices${qs ? `?${qs}` : ""}`);
      return res.data;
    } catch (error) {
      return rejectWithValue({
        message: error.message,
        status: error.status,
      });
    }
  }
);

export const markInvoicePaidThunk = createAsyncThunk(
  "invoices/markPaid",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiRequest(`/invoices/${id}/pay`, { method: "PATCH" });
      return res.data.invoice;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const sendReminderThunk = createAsyncThunk(
  "invoices/sendReminder",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiRequest(`/invoices/${id}/remind`, { method: "POST" });
      return { id, message: res.message, data: res.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  invoices: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  meterSheet: {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    rows: [],
  },
  dashboardStats: {
    roomStatusCounts: { available: 0, rented: 0, maintenance: 0, total: 0 },
    availableRoomsList: [],
    unpaidRooms: [],
    monthlyRevenue: [],
    totalRevenueAllTime: 0,
    totalUnpaidDebt: 0,
  },
  loading: false,
  error: null,
  serverRowErrors: {},
};

const invoiceSlice = createSlice({
  name: "invoices",
  initialState,
  reducers: {
    updateMeterRowField: (state, action) => {
      const { roomId, field, value } = action.payload;
      state.meterSheet.rows = state.meterSheet.rows.map((row) =>
        row.roomId === roomId ? { ...row, [field]: value } : row
      );
    },
    clearInvoiceError: (state) => {
      state.error = null;
      state.serverRowErrors = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardAggregations.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      .addCase(fetchMeterSheet.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.serverRowErrors = {};
      })
      .addCase(fetchMeterSheet.fulfilled, (state, action) => {
        state.loading = false;
        state.meterSheet = action.payload;
      })
      .addCase(fetchMeterSheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveBatchMetersThunk.rejected, (state, action) => {
        state.error = action.payload?.message || "Lỗi lưu chỉ số điện nước";
        state.serverRowErrors = action.payload?.rowErrors || {};
      })
      .addCase(fetchInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.invoices || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Không thể tải danh sách hóa đơn";
      })
      .addCase(markInvoicePaidThunk.fulfilled, (state, action) => {
        state.invoices = state.invoices.map((inv) =>
          inv._id === action.payload._id ? action.payload : inv
        );
      });
  },
});

export const { updateMeterRowField, clearInvoiceError } = invoiceSlice.actions;
export default invoiceSlice.reducer;
