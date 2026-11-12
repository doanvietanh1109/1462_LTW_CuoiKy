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

const FALLBACK_ROOMS = [
  {
    _id: "1",
    id: 1,
    title: "Phòng ban công thoáng sáng A107",
    roomNumber: "107",
    price: 3400000,
    area: 32,
    type: "Phòng trọ",
    district: "Hà Đông, Hà Nội",
    status: "available",
    amenities: ["Wifi", "Điều hòa", "Nóng lạnh", "Ban công", "Chỗ để xe"],
    desc: "Phòng ban công thoáng sáng, đầy đủ nội thất, giờ giấc tự do.",
    img: "/images/room1.jpg",
    images: ["/images/room1.jpg", "/images/room2.jpg", "/images/room3.jpg"],
    daysPosted: 3,
  },
  {
    _id: "2",
    id: 2,
    title: "Phòng đầy đủ tiện nghi A106",
    roomNumber: "106",
    price: 3200000,
    area: 30,
    type: "Phòng trọ",
    district: "Hà Đông, Hà Nội",
    status: "available",
    amenities: ["Wifi", "Điều hòa", "Nóng lạnh", "Tủ lạnh", "Máy giặt"],
    desc: "Phòng khép kín hiện đại, an ninh vân tay 24/7.",
    img: "/images/room2.jpg",
    images: ["/images/room2.jpg", "/images/room1.jpg"],
    daysPosted: 4,
  },
  {
    _id: "3",
    id: 3,
    title: "Phòng ban công thoáng sáng A105",
    roomNumber: "105",
    price: 3000000,
    area: 28,
    type: "Phòng trọ",
    district: "Hà Đông, Hà Nội",
    status: "available",
    amenities: ["Wifi", "Điều hòa", "Nóng lạnh", "Chỗ để xe"],
    desc: "Phòng rộng thoáng, gần trường đại học và trạm xe buýt.",
    img: "/images/room3.jpg",
    images: ["/images/room3.jpg"],
    daysPosted: 4,
  },
  {
    _id: "4",
    id: 4,
    title: "Phòng đầy đủ tiện nghi A104",
    roomNumber: "104",
    price: 2800000,
    area: 26,
    type: "Phòng trọ",
    district: "Hà Đông, Hà Nội",
    status: "available",
    amenities: ["Wifi", "Điều hòa", "Nóng lạnh"],
    desc: "Phòng sạch đẹp, yên tĩnh, phù hợp sinh viên và người đi làm.",
    img: "/images/room4.jpg",
    images: ["/images/room4.jpg"],
    daysPosted: 3,
  },
  {
    _id: "5",
    id: 5,
    title: "Phòng ban công thoáng sáng A103",
    roomNumber: "103",
    price: 2600000,
    area: 24,
    type: "Phòng trọ",
    district: "Hà Đông, Hà Nội",
    status: "available",
    amenities: ["Wifi", "Điều hòa", "Nóng lạnh"],
    desc: "Phòng thoáng mát, có cửa sổ lớn và khu phơi đồ riêng.",
    img: "/images/room5.jpg",
    images: ["/images/room5.jpg"],
    daysPosted: 1,
  },
  {
    _id: "6",
    id: 6,
    title: "Phòng đầy đủ tiện nghi A102",
    roomNumber: "102",
    price: 2400000,
    area: 22,
    type: "Phòng trọ",
    district: "Hà Đông, Hà Nội",
    status: "available",
    amenities: ["Wifi", "Nóng lạnh", "Chỗ để xe"],
    desc: "Phòng tiện nghi giá tiết kiệm cho sinh viên.",
    img: "/images/room1.jpg",
    images: ["/images/room1.jpg"],
    daysPosted: 4,
  },
];

export const fetchRooms = createAsyncThunk(
  "rooms/fetchRooms",
  async (params = {}) => {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== null && v !== "" && v !== "all"
        )
      );
      const qs = new URLSearchParams(cleanParams).toString();
      const res = await apiRequest(`/rooms${qs ? `?${qs}` : ""}`);
      const list =
        res.data?.rooms && res.data.rooms.length > 0
          ? res.data.rooms
          : FALLBACK_ROOMS;
      return {
        rooms: list,
        pagination: res.data?.pagination || {
          page: 1,
          limit: 20,
          total: list.length,
          totalPages: 1,
        },
      };
    } catch {
      return {
        rooms: FALLBACK_ROOMS,
        pagination: {
          page: 1,
          limit: 20,
          total: FALLBACK_ROOMS.length,
          totalPages: 1,
        },
      };
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
        state.error = action.payload;
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
