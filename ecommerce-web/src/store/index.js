import { configureStore } from "@reduxjs/toolkit";
import adminProductsReducer from "./adminProductsSlice";

export const store = configureStore({
  reducer: {
    adminProducts: adminProductsReducer,
  },
});