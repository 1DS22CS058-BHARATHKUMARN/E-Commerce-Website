import { api } from "./client";

export async function adminGetProducts({ categoryId } = {}) {
  const res = await api.get("/api/admin/products", {
    params: categoryId ? { categoryId } : {},
  });
  return res.data; // expects array
}

export async function adminCreateProduct(payload) {
  // payload: { name, price, categoryId, description?, stock? }
  const res = await api.post("/api/admin/products", payload);
  return res.data;
}

export async function adminUpdateProduct(productId, payload) {
  // payload: fields to update
  const res = await api.put(`/api/admin/products/${productId}`, payload);
  return res.data;
}

export async function adminDeleteProduct(productId) {
  const res = await api.delete(`/api/admin/products/${productId}`);
  return res.data;
}