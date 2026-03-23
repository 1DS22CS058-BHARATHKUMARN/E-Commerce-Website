import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMyOrderDetails } from "../api/orders";

function money(x) {
  const n = Number(x);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

export default function MyOrderDetailsPage() {
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

        const res = await getMyOrderDetails(orderId);
        if (!alive) return;

        const data = res?.data ?? res;
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

  if (loading) return <div className="muted">Loading…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return <div className="muted">Not found</div>;

  return (
    <div>
      <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 mb-3 flex-wrap">
        <div>
          <h2 className="page-title mb-1">Order #{order.id}</h2>
          <div className="muted">
            Status: <span className="fw-semibold text-dark">{order.status ?? "—"}</span>
            {order.createdAt ? (
              <>
                {" "}
                • Placed: <span className="fw-semibold text-dark">{new Date(order.createdAt).toLocaleString()}</span>
              </>
            ) : null}
          </div>
        </div>

        <Link className="btn btn-outline-secondary" to="/my-orders">
          Back
        </Link>
      </div>

      <div className="row g-3">
        {/* Pricing */}
        <div className="col-12 col-lg-4">
          <div className="card card-shadow">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Pricing</h5>

              {order.couponCode && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">Coupon</span>
                  <span className="fw-semibold">{order.couponCode}</span>
                </div>
              )}

              {"subtotal" in order && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>
              )}

              {"discountTotal" in order && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">Discount</span>
                  <span>- {money(order.discountTotal)}</span>
                </div>
              )}

              {"taxTotal" in order && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">Tax</span>
                  <span>{money(order.taxTotal)}</span>
                </div>
              )}

              {"shippingTotal" in order && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="muted">Shipping</span>
                  <span>{money(order.shippingTotal)}</span>
                </div>
              )}

              <hr />

              <div className="d-flex justify-content-between">
                <span className="fw-bold">Grand total</span>
                <span className="fw-bold">{money(order.totalAmount)}</span>
              </div>

              <div className="muted small mt-2">
                Totals are shown as returned by the server.
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="col-12 col-lg-8">
          <div className="card card-shadow">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Items</h5>

              {items.length === 0 ? (
                <div className="muted">No items found for this order.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th className="text-center">Unit Price</th>
                        <th className="text-center">Qty</th>
                        <th className="text-center">Line Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((it, idx) => {
                        const name = it.productName ?? it.name ?? `Product #${it.productId ?? ""}`;
                        const unitPrice = it.unitPrice ?? it.price ?? 0;
                        const qty = it.qty ?? it.quantity ?? 0;
                        const lineTotal = Number(unitPrice) * Number(qty);

                        return (
                          <tr key={it.id ?? `${it.productId ?? "x"}-${idx}`}>
                            <td className="fw-semibold">{name}</td>
                            <td className="text-center">{money(unitPrice)}</td>
                            <td className="text-center">{qty}</td>
                            <td className="text-center">{money(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="muted small mt-2">
                Need help? Contact support with your Order #{order.id}.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}