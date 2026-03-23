import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import { getAvailableCoupons, previewCoupon as previewCouponApi } from "../api/coupons";
import {
  getCart,
  updateQty,
  removeFromCart,
} from "../cart/storage";

function getAuthToken() {
  return localStorage.getItem("token");
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
  return "Request failed";
}

function saveCheckoutDraft(data) {
  sessionStorage.setItem("checkoutDraft", JSON.stringify(data));
}

export default function CartPage() {
  const [items, setItems] = useState(getCart());
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const nav = useNavigate();
  const location = useLocation();

  // Refresh cart on change event
  useEffect(() => {
    const refresh = () => setItems(getCart());
    window.addEventListener("cart:changed", refresh);
    return () => window.removeEventListener("cart:changed", refresh);
  }, []);

  // Load available coupons
  useEffect(() => {
    async function loadCoupons() {
      const token = getAuthToken();
      if (!token) {
        setAvailableCoupons([]);
        return;
      }
      try {
        setLoadingCoupons(true);
        const data = await getAvailableCoupons();
        setAvailableCoupons(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load coupons", e);
        setAvailableCoupons([]);
      } finally {
        setLoadingCoupons(false);
      }
    }
    loadCoupons();
  }, []);

  // Derive subtotal directly from items state
  const subtotal = useMemo(() => {
    return items.reduce((sum, x) => sum + x.price * x.qty, 0);
  }, [items]);

  const totalPreview = useMemo(
    () => Math.max(0, subtotal - (couponDiscount || 0)),
    [subtotal, couponDiscount]
  );

  // Only clear the message when coupon selection changes, NOT the discount
  useEffect(() => {
    setCouponMsg(null);
  }, [couponCode]);

  // Reset everything when cart items change
  useEffect(() => {
    setCouponMsg(null);
    setCouponDiscount(0);
    setAppliedCouponCode("");
  }, [items]);

  async function handlePreviewCoupon() {
    const code = couponCode.trim();

    if (!code) {
      setCouponMsg({ type: "error", text: "Select a coupon code." });
      setCouponDiscount(0);
      setAppliedCouponCode("");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setCouponMsg({ type: "error", text: "Please login to apply a coupon." });
      setCouponDiscount(0);
      setAppliedCouponCode("");
      return;
    }

    setApplying(true);
    try {
      const data = await previewCouponApi(code, subtotal);

      // API returns { isValid, code, message, subtotal, discount }
      if (data?.isValid) {
        setCouponMsg({ type: "success", text: data.message || "Coupon applied." });
        setCouponDiscount(Number(data.discount || 0));
        setAppliedCouponCode(data.code?.toUpperCase() || code.toUpperCase());
      } else {
        setCouponMsg({ type: "error", text: data?.message || "Coupon not eligible." });
        setCouponDiscount(0);
        setAppliedCouponCode("");
      }
    } catch (e) {
      const status = e?.response?.status;
      setCouponMsg({
        type: "error",
        text: extractApiError(e) || `Server error (${status || "unknown"})`,
      });
      setCouponDiscount(0);
      setAppliedCouponCode("");
    } finally {
      setApplying(false);
    }
  }

  function clearCouponState() {
    setCouponCode("");
    setCouponMsg(null);
    setCouponDiscount(0);
    setAppliedCouponCode("");
  }

  function onProceedToCheckout() {
    if (items.length === 0) return;

    const token = getAuthToken();
    if (!token) {
      alert("Please login to checkout.");
      nav("/login", { state: { from: location.pathname } });
      return;
    }

    saveCheckoutDraft({
      items: items.map((x) => ({
        productId: x.productId,
        qty: x.qty,
        name: x.name,
        price: x.price,
        imageUrl: x.imageUrl,
        categoryName: x.categoryName,
      })),
      couponCode: appliedCouponCode || null,
      couponDiscount,
      subtotal,
      totalPreview,
    });

    nav("/checkout");
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="page-title mb-0">Cart</h2>
        <Link className="btn btn-outline-secondary" to="/products">
          Continue shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="alert alert-info">
          Your cart is empty. <Link to="/products">Go shopping</Link>
        </div>
      ) : (
        <div className="row g-3">

          {/* ── Left: cart items + coupon ── */}
          <div className="col-12 col-lg-8">
            <div className="card card-shadow">
              <div className="card-body">

                {/* Cart items table */}
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-center">Price</th>
                        <th className="text-center" style={{ width: 140 }}>Qty</th>
                        <th className="text-center">Subtotal</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((x) => (
                        <tr key={x.productId}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              {x.imageUrl ? (
                                <img
                                  src={x.imageUrl}
                                  alt={x.name}
                                  style={{
                                    width: 60,
                                    height: 60,
                                    objectFit: "contain",
                                    borderRadius: 8,
                                    border: "1px solid #e2e8f0",
                                    background: "#fff",
                                    flexShrink: 0,
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 8,
                                    border: "1px solid #e2e8f0",
                                    background: "#f8fafc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 11,
                                    color: "#94a3b8",
                                    flexShrink: 0,
                                  }}
                                >
                                  No img
                                </div>
                              )}
                              <div>
                                <div className="fw-semibold">{x.name}</div>
                                {x.categoryName && (
                                  <div className="muted small">{x.categoryName}</div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="text-center">
                            ${Number(x.price).toFixed(2)}
                          </td>

                          <td className="text-center">
                            <input
                              className="form-control form-control-sm text-center"
                              type="number"
                              min={1}
                              value={x.qty}
                              onChange={(e) =>
                                updateQty(x.productId, Number(e.target.value))
                              }
                            />
                          </td>

                          <td className="text-center">
                            ${(x.price * x.qty).toFixed(2)}
                          </td>

                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-danger"
                              type="button"
                              onClick={() => removeFromCart(x.productId)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <hr />

                {/* ── Coupon section ── */}
                <div className="d-flex flex-wrap gap-2 align-items-end">
                  <div style={{ minWidth: 320, flex: "1 1 320px" }}>
                    <label className="form-label mb-1">Coupon</label>
                    <select
                      className="form-select"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={loadingCoupons}
                    >
                      <option value="">
                        {loadingCoupons ? "Loading coupons..." : "Select coupon"}
                      </option>
                      {availableCoupons.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handlePreviewCoupon}
                    disabled={applying || items.length === 0 || loadingCoupons}
                  >
                    {applying ? "Checking..." : "Apply"}
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={clearCouponState}
                    disabled={applying}
                  >
                    Clear Coupon
                  </button>
                </div>

                {/* Applied coupon inline confirmation */}
                {appliedCouponCode && (
                  <div className="text-success small mt-2">
                    Applied coupon: <strong>{appliedCouponCode}</strong> (- ${couponDiscount.toFixed(2)})
                  </div>
                )}

                {availableCoupons.length > 0 && (
                  <div className="text-muted small mt-2">
                    Available coupons are shown based on active offers. Final
                    eligibility is checked at checkout.
                  </div>
                )}

                {/* Coupon alert message */}
                {couponMsg && (
                  <div
                    className={
                      "alert mt-3 " +
                      (couponMsg.type === "success" ? "alert-success" : "alert-danger")
                    }
                  >
                    {couponMsg.text}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Right: order summary ── */}
          <div className="col-12 col-lg-4">
            <div className="card card-shadow">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Order summary</h5>

                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {appliedCouponCode ? (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="muted">Coupon</span>
                      <span className="text-primary fw-semibold">
                        {appliedCouponCode}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between mb-2">
                      <span className="muted">Discount</span>
                      <span className="text-success fw-semibold">
                        - ${Number(couponDiscount || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Applied coupon confirmation box */}
                    <div
                      className="d-flex align-items-center justify-content-between rounded px-3 py-2 mb-2"
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span style={{ fontSize: 16 }}>🎉</span>
                        <div>
                          <div
                            className="fw-semibold text-success"
                            style={{ fontSize: 13 }}
                          >
                            Coupon applied!
                          </div>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            {appliedCouponCode} — You save $
                            {couponDiscount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-link text-danger p-0"
                        type="button"
                        onClick={clearCouponState}
                        title="Remove coupon"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="d-flex justify-content-between mb-2">
                    <span className="muted">Discount</span>
                    <span className="text-muted">—</span>
                  </div>
                )}

                <hr />

                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-bold">
                    {appliedCouponCode ? "Total after discount" : "Preview Total"}
                  </span>
                  <span
                    className={`fw-bold fs-5 ${
                      appliedCouponCode ? "text-success" : ""
                    }`}
                  >
                    ${totalPreview.toFixed(2)}
                  </span>
                </div>

                {appliedCouponCode && (
                  <div className="text-success text-center small mb-2 fw-semibold">
                    🛍️ You're saving ${couponDiscount.toFixed(2)} on this order!
                  </div>
                )}

                <button
                  className="btn btn-success w-100"
                  style={{ height: 46, fontWeight: 800, borderRadius: 14 }}
                  type="button"
                  disabled={applying}
                  onClick={onProceedToCheckout}
                >
                  Proceed to Checkout →
                </button>

                <div className="muted small mt-2 text-center">
                  Address and payment will be entered on the next page.
                </div>

              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}