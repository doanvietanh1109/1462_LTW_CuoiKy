import { configureStore } from "@reduxjs/toolkit";
import roomReducer from "./slices/roomSlice";
import invoiceReducer from "./slices/invoiceSlice";

export const store = configureStore({
  reducer: {
    rooms: roomReducer,
    invoices: invoiceReducer,
  },
});
