import { api } from "./client";

export async function getAvailableCoupons() {
  const res = await api.get("/api/coupons");
  return res.data;
}

export async function previewCoupon(code, subtotal) {
  const res = await api.post("/api/coupons/preview", { code, subtotal });
  return res.data;
}