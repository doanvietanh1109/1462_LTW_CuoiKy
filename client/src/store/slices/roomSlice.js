import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../api/apiClient";

export const fetchMotelBlocks = createAsyncThunk(
  "rooms/fetchMotelBlocks",
  async (params = {}, { rejectWithValue }) => {
    try {
      const qs = new URLSearchParams(params).toString();
      const res = await apiRequest(`/motel-blocks${qs ? `?${qs}` : ""}`);
      return res.data.blocks || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createMotelBlockThunk = createAsyncThunk(
  "rooms/createMotelBlock",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiRequest("/motel-blocks", {
        method: "POST",
        body: payload,
      });
      return res.data.block;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMotelBlockThunk = createAsyncThunk(
  "rooms/updateMotelBlock",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiRequest(`/motel-blocks/${id}`, {
        method: "PUT",
        body: payload,
      });
      return res.data.block;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteMotelBlockThunk = createAsyncThunk(
  "rooms/deleteMotelBlock",
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/motel-blocks/${id}`, { method: "DELETE" });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchRooms = createAsyncThunk(
  "rooms/fetchRooms",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"
        )
      );
      const qs = new URLSearchParams(cleanParams).toString();
      const res = await apiRequest(`/rooms${qs ? `?${qs}` : ""}`);
      const list = Array.isArray(res.data?.rooms) ? res.data.rooms : [];
      return {
        rooms: list,
        pagination: res.data?.pagination || {
          page: 1,
          limit: 20,
          total: list.length,
          totalPages: 1,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message || "Không thể tải danh sách phòng");
    }
  }
);

export const fetchRoomsThunk = fetchRooms;

export const createRoomThunk = createAsyncThunk(
  "rooms/createRoom",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiRequest("/rooms", {
        method: "POST",
        body: payload,
      });
      return res.data.room;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateRoomThunk = createAsyncThunk(
  "rooms/updateRoom",
  async ({ id, payload, roomData }, { rejectWithValue }) => {
    try {
      const res = await apiRequest(`/rooms/${id}`, {
        method: "PUT",
        body: payload || roomData,
      });
      return res.data.room;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteRoomThunk = createAsyncThunk(
  "rooms/deleteRoom",
  async (id, { rejectWithValue }) => {
    try {
      await apiRequest(`/rooms/${id}`, { method: "DELETE" });
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchContracts = createAsyncThunk(
  "rooms/fetchContracts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"
        )
      );
      const qs = new URLSearchParams(cleanParams).toString();
      const res = await apiRequest(`/contracts${qs ? `?${qs}` : ""}`);
      return res.data.contracts || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createContractThunk = createAsyncThunk(
  "rooms/createContract",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiRequest("/contracts", {
        method: "POST",
        body: payload,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const terminateContractThunk = createAsyncThunk(
  "rooms/terminateContract",
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiRequest(`/contracts/${id}/terminate`, {
        method: "PATCH",
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  blocks: [],
  rooms: [],
  items: [],
  contracts: [],
  pagination: { page: 1, limit: 9, total: 0, totalPages: 1 },
  filters: {
    search: "",
    minPrice: "",
    maxPrice: "",
    minArea: "",
    maxArea: "",
    blockId: "all",
    status: "all",
    category: "all",
  },
  loading: false,
  error: null,
};

const roomSlice = createSlice({
  name: "rooms",
  initialState,
  reducers: {
    setRoomFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetRoomFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearRoomError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMotelBlocks.fulfilled, (state, action) => {
        state.blocks = action.payload;
      })
      .addCase(createMotelBlockThunk.fulfilled, (state, action) => {
        state.blocks = [action.payload, ...state.blocks];
      })
      .addCase(updateMotelBlockThunk.fulfilled, (state, action) => {
        state.blocks = state.blocks.map((b) =>
          b._id === action.payload._id ? { ...b, ...action.payload } : b
        );
      })
      .addCase(deleteMotelBlockThunk.fulfilled, (state, action) => {
        state.blocks = state.blocks.filter((b) => b._id !== action.payload);
      })
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload.rooms;
        state.items = action.payload.rooms;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.rooms = [];
        state.items = [];
        state.pagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
      })
      .addCase(createRoomThunk.fulfilled, (state, action) => {
        state.rooms = [action.payload, ...state.rooms];
        state.items = state.rooms;
      })
      .addCase(updateRoomThunk.fulfilled, (state, action) => {
        state.rooms = state.rooms.map((r) =>
          r._id === action.payload._id ? action.payload : r
        );
        state.items = state.rooms;
      })
      .addCase(deleteRoomThunk.fulfilled, (state, action) => {
        state.rooms = state.rooms.filter((r) => r._id !== action.payload);
        state.items = state.rooms;
      })
      .addCase(fetchContracts.fulfilled, (state, action) => {
        state.contracts = action.payload;
      })
      .addCase(createContractThunk.fulfilled, (state, action) => {
        state.contracts = [action.payload.contract, ...state.contracts];
        if (action.payload.room) {
          state.rooms = state.rooms.map((r) =>
            r._id === action.payload.room._id ? action.payload.room : r
          );
        }
      })
      .addCase(terminateContractThunk.fulfilled, (state, action) => {
        state.contracts = state.contracts.map((c) =>
          c._id === action.payload.contract._id ? action.payload.contract : c
        );
        if (action.payload.room) {
          state.rooms = state.rooms.map((r) =>
            r._id === action.payload.room._id ? action.payload.room : r
          );
        }
      });
  },
});

export const { setRoomFilters, resetRoomFilters, clearRoomError } = roomSlice.actions;
export default roomSlice.reducer;
