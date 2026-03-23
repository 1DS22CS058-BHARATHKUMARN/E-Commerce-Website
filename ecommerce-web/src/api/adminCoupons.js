import { api } from "./client";

export async function adminGetCoupons() {
  const res = await api.get("/api/admin/coupons");
  return res.data;
}

export async function adminGetCouponById(id) {
  const res = await api.get(`/api/admin/coupons/${id}`);
  return res.data;
}

export async function adminCreateCoupon(payload) {
  const res = await api.post("/api/admin/coupons", payload);
  return res.data;
}

export async function adminUpdateCoupon(id, payload) {
  const res = await api.put(`/api/admin/coupons/${id}`, payload);
  return res.data;
}