import { api } from "./client";

export async function getCategories() {
  const res = await api.get("/api/categories");
  return res.data;
}

export async function getProducts(params) {
  const res = await api.get("/api/products", { params });
  return res.data;
}

// export async function getBestSellers(top = 5) {
//   const res = await api.get("/api/products/best-sellers", {
//     params: { top },
//   });
//   return res.data;
// }

export async function getProduct(id) {
  const res = await api.get(`/api/products/${id}`);
  return res.data;
}

export function resolveImageUrl(imageUrl) {
  if (!imageUrl || !String(imageUrl).trim()) return null;

  const raw = String(imageUrl).trim();

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const base = api.defaults.baseURL?.replace(/\/$/, "") || "";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${path}`;
}
export async function getBestSellers(top = 5, categoryId) {
  const res = await api.get("/api/products/best-sellers", {
    params: {
      top,
      categoryId: categoryId > 0 ? categoryId : undefined,
    },
  });
  return res.data;
}