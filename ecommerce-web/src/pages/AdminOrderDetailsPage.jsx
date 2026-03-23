import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminGetOrderDetails } from "../api/orders";

function money(x) {
  const n = Number(x);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

function pillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "placed") return "status-pill status-pill--placed";
  if (s === "packed") return "status-pill status-pill--packed";
  if (s === "shipped") return "status-pill status-pill--shipped";
  if (s === "delivered") return "status-pill status-pill--delivered";
  if (s === "cancelled" || s === "canceled") return "status-pill status-pill--cancelled";
  return "status-pill";
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const orderId = Number(id);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await adminGetOrderDetails(orderId);
        if (!alive) return;

        const data = res?.data ?? res;
              console.log("Order data:", data); // ← add this

        setOrder(data);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load order details");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [orderId]);

  const items = useMemo(() => {
    const arr = order?.items ?? order?.orderItems ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [order]);

  if (loading) return <div className="muted">Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return <div className="muted">Not found</div>;

  const subtotal = "subtotal" in order ? Number(order.subtotal) : null;
  const discountTotal = "discountTotal" in order ? Number(order.discountTotal) : null;
  const taxTotal = "taxTotal" in order ? Number(order.taxTotal) : null;
  const shippingTotal = "shippingTotal" in order ? Number(order.shippingTotal) : null;

  return (
    <div className="order-detail-wrap">
      {/* Header */}
      <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 mb-3 flex-wrap">
        <div>
          <h2 className="page-title mb-1">Order #{order.id}</h2>
          <div className="muted">
            {order.createdAt
              ? `Created: ${new Date(order.createdAt).toLocaleString()}`
              : "Created: —"}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className={pillClass(order.status)}>{order.status ?? "—"}</span>
          <Link className="btn btn-outline-secondary" to="/admin/orders">
            Back
          </Link>
        </div>
      </div>

      {/* Summary + Pricing */}
      <div className="row g-3">
        {/* Summary */}
        <div className="col-12 col-lg-6">
          <div className="card card-shadow h-100">
            <div className="card-body">
              <div className="fw-bold mb-3">Summary</div>

              <div className="kv-grid">
                <div className="kv">
                  <div className="label">Order ID</div>
                  <div className="value">#{order.id}</div>
                </div>

               

                <div className="kv">
                  <div className="label">Status</div>
                  <div className="value">{order.status ?? "—"}</div>
                </div>

                <div className="kv">
                  <div className="label">Coupon</div>
                  <div className="value">{order.couponCode ?? "—"}</div>
                </div>

                <div className="kv">
                  <div className="label">Grand Total</div>
                  <div className="value">{money(order.totalAmount)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="col-12 col-lg-6">
          <div className="card card-shadow h-100">
            <div className="card-body">
              <div className="fw-bold mb-3">Pricing</div>

              <div className="d-flex justify-content-between mb-2">
                <span className="muted">Subtotal</span>
                <span className="fw-bold">
                  {subtotal == null ? "—" : money(subtotal)}
                </span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="muted">Discount</span>
                <span className="fw-bold text-success">
                  {discountTotal == null ? "—" : `- ${money(discountTotal)}`}
                </span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="muted">Tax</span>
                <span className="fw-bold">
                  {taxTotal == null ? "—" : money(taxTotal)}
                </span>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="muted">Shipping</span>
                <span className="fw-bold">
                  {shippingTotal == null ? "—" : money(shippingTotal)}
                </span>
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <span className="fw-bold">Grand Total</span>
                <span className="fw-bold fs-5">{money(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      

      {/* Items */}
      <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
        <h3 className="m-0">Items</h3>
        <div className="muted small">{items.length} item(s)</div>
      </div>

      {items.length === 0 ? (
        <div className="card card-shadow">
          <div className="card-body muted">No items found for this order.</div>
        </div>
      ) : (
        <div className="order-items">
          {items.map((it, idx) => {
            const name = it.productName ?? it.name ?? `Product #${it.productId ?? "—"}`;
            const unitPrice = it.unitPrice ?? it.price ?? 0;
            const qty = it.qty ?? it.quantity ?? 0;
            const lineTotal = Number(unitPrice) * Number(qty);

            return (
              <div key={it.id ?? `${it.productId}-${idx}`} className="order-item">
                <div className="order-item__left">
                  <div className="order-item__name">{name}</div>
                  <div className="order-item__sub">
                    Unit: {money(unitPrice)} · Qty: <b>{qty}</b>
                    {it.productId != null ? ` · ProductId: #${it.productId}` : ""}
                  </div>
                </div>

                <div className="order-item__right">
                  <div className="muted small">Line total</div>
                  <div className="fw-bold fs-5">{money(lineTotal)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}