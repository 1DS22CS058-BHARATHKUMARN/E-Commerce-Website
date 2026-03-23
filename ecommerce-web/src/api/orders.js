import { api } from "./client";

export async function getMyOrders() {
  const res = await api.get("/api/orders/my");
  return res.data;
}

export async function getMyOrderDetails(orderId) {
  const res = await api.get(`/api/orders/my/${orderId}`);
  return res.data;
}
export async function checkout(payload) {
  const res = await api.post("/api/orders/checkout", payload);
  return res.data;
}
export async function cancelMyOrder(orderId) {
  const res = await api.post(`/api/orders/my/${orderId}/cancel`);
  return res.data;
}

// admin
export async function adminGetAllOrders() {
  const res = await api.get("/api/admin/orders");
  return res.data;
}

export async function adminUpdateOrderStatus(orderId, status) {
  const res = await api.patch(`/api/admin/orders/${orderId}/status`, { status });
  return res.data;
}



export async function adminGetOrderDetails(orderId) {
  const res = await api.get(`/api/admin/orders/${orderId}`);
  return res.data;
}

