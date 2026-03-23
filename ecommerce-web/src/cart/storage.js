const BASE_KEY = "cart:v1";

// dynamically get key based on who is logged in
function getKey() {
  const email = localStorage.getItem("email");
  return email ? `${BASE_KEY}:${email}` : null;
}

export function getCart() {
  try {
    const key = getKey();
    if (!key) return []; // not logged in, return empty
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCart(items) {
  const key = getKey();
  if (!key) return; // not logged in, do nothing
  localStorage.setItem(key, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:changed"));
}

export function clearCart() {
  setCart([]);
}

export function addToCart(item, qty = 1) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.productId === item.productId);

  if (idx >= 0) cart[idx] = { ...cart[idx], qty: cart[idx].qty + qty };
  else cart.push({ ...item, qty });

  setCart(cart);
}

export function updateQty(productId, qty) {
  const cart = getCart()
    .map((x) => (x.productId === productId ? { ...x, qty } : x))
    .filter((x) => x.qty > 0);

  setCart(cart);
}

export function removeFromCart(productId) {
  setCart(getCart().filter((x) => x.productId !== productId));
}

export function cartCount() {
  return getCart().reduce((sum, x) => sum + (x.qty || 0), 0);
}

export function cartTotal() {
  return getCart().reduce((sum, x) => sum + (x.price || 0) * (x.qty || 0), 0);
}

// User clicks "Add to Cart"
//         ↓
// addToCart({ productId: 1, name: "Shoes", price: 100 })
//         ↓
// getCart() → reads current cart from localStorage
//         ↓
// Product already exists? → increase qty
// Product is new?        → push to array
//         ↓
// setCart(updatedCart) → saves to localStorage
//         ↓
// fires "cart:changed" event
//         ↓
// Cart icon updates automatically 