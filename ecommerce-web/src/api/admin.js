import { api } from "./client";

export function adminCreateProduct(payload) {
  // payload: { name, description, categoryId, price, stockQty }
  return api.post("/api/admin/products", payload);
}

export function adminAdjustInventory(payload) {
  // payload: { productId, delta, reason }
  return api.post("/api/admin/inventory/adjust", payload);
}