import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { checkout } from "../api/orders";
import { clearCart } from "../cart/storage";

function loadCheckoutDraft() {
  try {
    const raw = sessionStorage.getItem("checkoutDraft");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function extractApiError(e) {
  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors && typeof data.errors === "object") {
    const flat = Object.values(data.errors).flat();
    if (flat.length) return flat.join(", ");
  }
  if (e?.message) return e.message;
  return "Checkout failed";
}

function formatCardNumber(val) {
  return val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export default function CheckoutPage() {
  const nav = useNavigate();
  const draft = loadCheckoutDraft();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState({
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const [payment, setPayment] = useState({
    cardHolderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const items = draft?.items ?? [];
  const couponCode = draft?.couponCode ?? null;
  const subtotal = Number(draft?.subtotal ?? 0);
  const couponDiscount = Number(draft?.couponDiscount ?? 0);

  const previewTotal = useMemo(
    () => Math.max(0, subtotal - couponDiscount),
    [subtotal, couponDiscount]
  );

  function updateAddress(name, value) {
    setAddress((prev) => ({ ...prev, [name]: value }));
  }

  function updatePayment(name, value) {
    setPayment((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (!items.length) return "No checkout items found. Please return to cart.";

    if (!address.fullName.trim()) return "Full name is required.";
    if (!address.phoneNumber.trim()) return "Phone number is required.";
    if (!address.addressLine1.trim()) return "Address line 1 is required.";
    if (!address.city.trim()) return "City is required.";
    if (!address.state.trim()) return "State is required.";
    if (!address.postalCode.trim()) return "Postal code is required.";
    if (!address.country.trim()) return "Country is required.";

    if (!payment.cardHolderName.trim()) return "Cardholder name is required.";
    if (payment.cardNumber.replace(/\s/g, "").length !== 16) return "Card number must be 16 digits.";
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) return "Expiry must be MM/YY.";
    if (payment.cvv.length < 3 || payment.cvv.length > 4) return "CVV must be 3 or 4 digits.";

    return "";
  }

  async function placeOrder() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await checkout({
        items: items.map((x) => ({
          productId: x.productId,
          qty: x.qty,
        })),
        couponCode,
        address: {
          fullName: address.fullName.trim(),
          phoneNumber: address.phoneNumber.trim(),
          addressLine1: address.addressLine1.trim(),
          addressLine2: address.addressLine2.trim() || null,
          city: address.city.trim(),
          state: address.state.trim(),
          postalCode: address.postalCode.trim(),
          country: address.country.trim(),
        },
        payment: {
          cardHolderName: payment.cardHolderName.trim(),
          cardNumber: payment.cardNumber.replace(/\s/g, ""),
          expiry: payment.expiry.trim(),
          cvv: payment.cvv.trim(),
        },
      });

      clearCart();
      sessionStorage.removeItem("checkoutDraft");

      nav("/my-orders", {
        replace: true,
        state: {
          checkoutSuccess: true,
          orderId: result?.orderId,
          message: result?.message,
        },
      });
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }

  if (!draft || !items.length) {
    return (
      <div className="container py-4">
        <div className="alert alert-info">
          No checkout data found. Please go back to your cart.
        </div>
        <Link className="btn btn-primary" to="/cart">
          Back to Cart
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="page-title mb-0">Checkout</h2>
        <Link className="btn btn-outline-secondary" to="/cart">
          Back to Cart
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card card-shadow mb-4">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Shipping Address</h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={address.fullName} onChange={(e) => updateAddress("fullName", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  <input className="form-control" value={address.phoneNumber} onChange={(e) => updateAddress("phoneNumber", e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label">Address Line 1</label>
                  <input className="form-control" value={address.addressLine1} onChange={(e) => updateAddress("addressLine1", e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label">Address Line 2</label>
                  <input className="form-control" value={address.addressLine2} onChange={(e) => updateAddress("addressLine2", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">City</label>
                  <input className="form-control" value={address.city} onChange={(e) => updateAddress("city", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">State</label>
                  <input className="form-control" value={address.state} onChange={(e) => updateAddress("state", e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Postal Code</label>
                  <input className="form-control" value={address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Country</label>
                  <input className="form-control" value={address.country} onChange={(e) => updateAddress("country", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div className="card card-shadow">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Payment Details</h5>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Cardholder Name</label>
                  <input
                    className="form-control"
                    value={payment.cardHolderName}
                    onChange={(e) => updatePayment("cardHolderName", e.target.value)}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Card Number</label>
                  <input
                    className="form-control"
                    maxLength={19}
                    value={payment.cardNumber}
                    onChange={(e) => updatePayment("cardNumber", formatCardNumber(e.target.value))}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Expiry</label>
                  <input
                    className="form-control"
                    maxLength={5}
                    value={payment.expiry}
                    onChange={(e) => updatePayment("expiry", formatExpiry(e.target.value))}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">CVV</label>
                  <input
                    className="form-control"
                    type="password"
                    maxLength={4}
                    value={payment.cvv}
                    onChange={(e) => updatePayment("cvv", e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div className="mt-3 text-muted small">
                Your full card number and CVV are not shown in order history.
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card card-shadow">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Order Summary</h5>

              {items.map((item) => (
                <div key={item.productId} className="d-flex justify-content-between mb-2">
                  <span>{item.name} × {item.qty}</span>
                  <span>${(Number(item.price) * Number(item.qty)).toFixed(2)}</span>
                </div>
              ))}

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span className="muted">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="muted">Discount</span>
                <span className="text-success">- ${couponDiscount.toFixed(2)}</span>
              </div>

              {couponCode && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">Coupon</span>
                  <span>{couponCode}</span>
                </div>
              )}

              <hr />

              <div className="d-flex justify-content-between mb-3">
                <span className="fw-bold">Preview Total</span>
                <span className="fw-bold fs-5">${previewTotal.toFixed(2)}</span>
              </div>

              <button
                className="btn btn-success w-100"
                onClick={placeOrder}
                disabled={loading}
                style={{ height: 46, fontWeight: 800, borderRadius: 14 }}
              >
                {loading ? "Placing Order..." : "Pay & Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}