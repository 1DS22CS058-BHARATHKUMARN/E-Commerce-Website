import { api } from "./client";

export async function login(email, password) {
  const res = await api.post("/api/v1/auth/login", { email, password });
  const { accessToken, role, email: returnedEmail } = res.data;

  localStorage.setItem("token", accessToken);
  localStorage.setItem("role", role);
  localStorage.setItem("email", returnedEmail);

  // after email is set, fire cart:changed so navbar re-reads the correct user's cart
  window.dispatchEvent(new Event("cart:changed"));
  window.dispatchEvent(new Event("auth:changed"));

  return res.data;
}

export async function register(email, password) {
  const res = await api.post("/api/v1/auth/register", { email, password });
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email"); // email removed first, so getKey() returns null

  window.dispatchEvent(new Event("cart:changed")); // navbar badge resets to 0
  window.dispatchEvent(new Event("auth:changed"));
}