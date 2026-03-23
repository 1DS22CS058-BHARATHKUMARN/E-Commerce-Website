import { api } from "./client";

export function adminAdjustStock(payload) {
  return api.post("/api/admin/inventory/adjust", payload);
}