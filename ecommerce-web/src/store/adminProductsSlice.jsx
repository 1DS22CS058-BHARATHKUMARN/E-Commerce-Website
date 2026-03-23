import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../api/client";

const toArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.products)) return raw.products;
  if (Array.isArray(raw?.categories)) return raw.categories;
  if (Array.isArray(raw?.$values)) return raw.$values;
  return [];
};

// ── Thunks ──
export const loadProducts = createAsyncThunk(
  "adminProducts/loadProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/products");
      return toArray(res.data);
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          e.message ||
          "Failed to load products"
      );
    }
  }
);

export const loadCategories = createAsyncThunk(
  "adminProducts/loadCategories",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/categories");
      return toArray(res.data);
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          e.message ||
          "Failed to load categories"
      );
    }
  }
);

export const createProduct = createAsyncThunk(
  "adminProducts/create",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      await api.post("/api/admin/products", payload);
      await dispatch(loadProducts());
      return true;
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          e.message ||
          "Create failed"
      );
    }
  }
);

export const updateProduct = createAsyncThunk(
  "adminProducts/update",
  async ({ id, payload }, { rejectWithValue, dispatch }) => {
    try {
      await api.put(`/api/admin/products/${id}`, payload);
      await dispatch(loadProducts());
      return true;
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          e.message ||
          "Update failed"
      );
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "adminProducts/delete",
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/api/admin/products/${id}`);
      await dispatch(loadProducts());
      return id;
    } catch (e) {
      return rejectWithValue(
        e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          e.message ||
          "Delete failed"
      );
    }
  }
);

// ── Slice ──
const adminProductsSlice = createSlice({
  name: "adminProducts",
  initialState: {
    products: [],
    categories: [],
    loading: false,
    categoriesLoading: false,
    busyId: null,
    error: "",
  },
  reducers: {
    clearError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // loadProducts
      .addCase(loadProducts.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.loading = false;
        state.products = [];
        state.error = action.payload;
      })

      // loadCategories
      .addCase(loadCategories.pending, (state) => {
        state.categoriesLoading = true;
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(loadCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categories = [];
        state.error = action.payload || "Failed to load categories";
      })

      // create
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // update
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // delete
      .addCase(deleteProduct.pending, (state, action) => {
        state.busyId = action.meta.arg;
        state.error = "";
      })
      .addCase(deleteProduct.fulfilled, (state) => {
        state.busyId = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.busyId = null;
        state.error = action.payload;
      });
  },
});

export const { clearError } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;

// User opens AdminProducts page
//         ↓
// useEffect fires → dispatch(loadProducts())
//         ↓
// Thunk starts → fires loadProducts.pending
//         ↓
// Slice sets: loading = true, error = ""
//         ↓
// API call happens → api.get("/api/products")
//         ↓
//       ┌─────────────────┐
//    Success?           Failed?
//       ↓                  ↓
// fulfilled            rejected
// loading=false        loading=false
// products=[...data]   products=[]
//                      error="Failed to load"