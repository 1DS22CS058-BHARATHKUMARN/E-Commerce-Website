




// import { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import { api } from "../api/client";

// // ─── helpers ────────────────────────────────────────────────────────────────

// function money(x) {
//   const n = Number(x);
//   return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
// }

// const STEPS = ["placed", "packed", "shipped", "delivered"];

// /**
//  * Returns the 0-based index of the current status in the STEPS array.
//  * Returns -1 for cancelled / unknown.
//  */
// function getStepIndex(status) {
//   const s = String(status || "").toLowerCase().trim();
//   if (s === "cancelled" || s === "canceled") return -1;
//   const idx = STEPS.indexOf(s);
//   return idx; // -1 if not found
// }

// // ─── OrderStepper ────────────────────────────────────────────────────────────

// function OrderStepper({ status }) {
//   const s = String(status || "").toLowerCase().trim();
//   const isCancelled = s === "cancelled" || s === "canceled";
//   const activeIdx = getStepIndex(status); // -1 if cancelled

//   if (isCancelled) {
//     return (
//       <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
//         <span
//           style={{
//             display: "inline-flex",
//             alignItems: "center",
//             gap: 6,
//             background: "#fff1f1",
//             border: "1px solid #f5c6c6",
//             color: "#c0392b",
//             borderRadius: 20,
//             padding: "4px 14px",
//             fontWeight: 600,
//             fontSize: 13,
//           }}
//         >
//           <span style={{ fontSize: 16 }}>✕</span> Order Cancelled
//         </span>
//       </div>
//     );
//   }

//   return (
//     <div style={{ marginTop: 14 }}>
//       {/* Step row */}
//       <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
//         {STEPS.map((step, idx) => {
//           const isCompleted = idx <= activeIdx;
//           const isActive = idx === activeIdx;
//           const isLast = idx === STEPS.length - 1;

//           return (
//             <div
//               key={step}
//               style={{
//                 flex: 1,
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "center",
//                 position: "relative",
//               }}
//             >
//               {/* Connector line (drawn to the right of each step except last) */}
//               {!isLast && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: 14,
//                     left: "50%",
//                     width: "100%",
//                     height: 3,
//                     background: idx < activeIdx ? "#22c55e" : "#e2e8f0",
//                     zIndex: 0,
//                   }}
//                 />
//               )}

//               {/* Circle */}
//               <div
//                 style={{
//                   width: 28,
//                   height: 28,
//                   borderRadius: "50%",
//                   background: isCompleted ? "#22c55e" : "#e2e8f0",
//                   border: isActive ? "3px solid #16a34a" : "3px solid transparent",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   zIndex: 1,
//                   position: "relative",
//                   flexShrink: 0,
//                   boxShadow: isActive ? "0 0 0 3px #bbf7d0" : "none",
//                   transition: "all 0.3s ease",
//                 }}
//               >
//                 {isCompleted ? (
//                   <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>
//                 ) : (
//                   <span
//                     style={{
//                       width: 8,
//                       height: 8,
//                       borderRadius: "50%",
//                       background: "#cbd5e1",
//                       display: "block",
//                     }}
//                   />
//                 )}
//               </div>

//               {/* Label */}
//               <div
//                 style={{
//                   marginTop: 6,
//                   fontSize: 11,
//                   fontWeight: isActive ? 700 : isCompleted ? 600 : 400,
//                   color: isCompleted ? "#15803d" : "#94a3b8",
//                   textTransform: "capitalize",
//                   textAlign: "center",
//                   lineHeight: 1.3,
//                 }}
//               >
//                 {step}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─── MyOrdersPage ─────────────────────────────────────────────────────────────

// export default function MyOrdersPage() {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const token = localStorage.getItem("token");

//   useEffect(() => {
//     if (!token) {
//       setLoading(false);
//       setError("");
//       return;
//     }

//     let alive = true;

//     async function loadOrders() {
//       try {
//         setLoading(true);
//         setError("");
//         const res = await api.get("/api/orders/my");
//         if (!alive) return;
//         setOrders(Array.isArray(res.data) ? res.data : []);
//       } catch (e) {
//         if (!alive) return;
//         const status = e?.response?.status;
//         if (status === 401 || status === 403) {
//           setError("LOGIN_REQUIRED");
//         } else {
//           setError(e?.message || "Failed to load orders");
//         }
//       } finally {
//         if (alive) setLoading(false);
//       }
//     }

//     loadOrders();
//     return () => { alive = false; };
//   }, [token]);

//   const sorted = useMemo(
//     () =>
//       [...orders].sort((a, b) => {
//         const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
//         const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
//         return tb - ta;
//       }),
//     [orders]
//   );

//   // ── not logged in ──
//   if (!token || error === "LOGIN_REQUIRED") {
//     return (
//       <div className="container py-4">
//         <h2 className="page-title mb-3">My Orders</h2>
//         <div className="alert alert-warning">
//           <div className="fw-bold mb-2">Please login to view your orders.</div>
//           <div>If you are a new user, please register first.</div>
//         </div>
//         <div className="d-flex gap-2 flex-wrap">
//           <Link to="/login" className="btn btn-primary">Login</Link>
//           <Link to="/register" className="btn btn-outline-secondary">Register</Link>
//           <Link to="/products" className="btn btn-outline-dark">Continue shopping</Link>
//         </div>
//       </div>
//     );
//   }

//   if (loading) return <div className="container py-4">Loading...</div>;

//   if (error) {
//     return (
//       <div className="container py-4">
//         <div className="alert alert-danger">{error}</div>
//       </div>
//     );
//   }

//   return (
//     <div className="container py-4">
//       {/* Header */}
//       <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
//         <div>
//           <h2 className="page-title mb-1">My Orders</h2>
//           <div className="muted">Track, view totals, and see delivery status.</div>
//         </div>
//         <Link to="/products" className="btn btn-outline-secondary">
//           Continue shopping
//         </Link>
//       </div>

//       {/* Empty state */}
//       {sorted.length === 0 && (
//         <div className="alert alert-info">You have no orders yet.</div>
//       )}

//       {/* Order cards */}
//       <div className="d-grid gap-3">
//         {sorted.map((o) => (
//           <div key={o.id} className="card card-shadow">
//             <div className="card-body">
//               {/* Top row: order id + amount */}
//               <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
//                 <div>
//                   <div className="fw-bold fs-5">Order #{o.id}</div>
//                   {o.createdAt && (
//                     <div className="muted small mt-1">
//                       Placed: {new Date(o.createdAt).toLocaleString()}
//                     </div>
//                   )}
//                 </div>
//                 <div className="text-end">
//                   <div className="muted small">Order total</div>
//                   <div className="fw-bold fs-5">{money(o.totalAmount)}</div>
//                 </div>
//               </div>

//               {/* ── Flipkart-style stepper ── */}
//               <OrderStepper status={o.status} />

//               <hr className="my-3" />

//               {/* Actions */}
//               <div className="d-flex gap-2 flex-wrap">
//                 <Link className="btn btn-primary btn-sm" to={`/my-orders/${o.id}`}>
//                   View details
//                 </Link>
//                 <button className="btn btn-outline-secondary btn-sm" disabled>
//                   Invoice (UI)
//                 </button>
//                 <button className="btn btn-outline-dark btn-sm" disabled>
//                   Reorder (UI)
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { cancelMyOrder } from "../api/orders";

// ─── helpers ────────────────────────────────────────────────────────────────

function money(x) {
  const n = Number(x);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

const STEPS = ["placed", "packed", "shipped", "delivered"];

function getStepIndex(status) {
  const s = String(status || "").toLowerCase().trim();
  if (s === "cancelled" || s === "canceled") return -1;
  return STEPS.indexOf(s);
}

function canCancelOrder(status) {
  const s = String(status || "").toLowerCase().trim();
  return s === "placed" || s === "packed";
}

// ─── OrderStepper ────────────────────────────────────────────────────────────

function OrderStepper({ status }) {
  const s = String(status || "").toLowerCase().trim();
  const isCancelled = s === "cancelled" || s === "canceled";
  const activeIdx = getStepIndex(status);

  if (isCancelled) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#fff1f1",
            border: "1px solid #f5c6c6",
            color: "#c0392b",
            borderRadius: 20,
            padding: "4px 14px",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 16 }}>✕</span> Order Cancelled
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
        {STEPS.map((step, idx) => {
          const isCompleted = idx <= activeIdx;
          const isActive = idx === activeIdx;
          const isLast = idx === STEPS.length - 1;

          return (
            <div
              key={step}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
            >
              {!isLast && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: "50%",
                    width: "100%",
                    height: 3,
                    background: idx < activeIdx ? "#22c55e" : "#e2e8f0",
                    zIndex: 0,
                  }}
                />
              )}

              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: isCompleted ? "#22c55e" : "#e2e8f0",
                  border: isActive ? "3px solid #16a34a" : "3px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                  position: "relative",
                  flexShrink: 0,
                  boxShadow: isActive ? "0 0 0 3px #bbf7d0" : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {isCompleted ? (
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>
                ) : (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#cbd5e1",
                      display: "block",
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 400,
                  color: isCompleted ? "#15803d" : "#94a3b8",
                  textTransform: "capitalize",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {step}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MyOrdersPage ─────────────────────────────────────────────────────────────

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [popup, setPopup] = useState({
    show: false,
    type: "",
    message: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("");
      return;
    }

    let alive = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/api/orders/my");
        if (!alive) return;
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!alive) return;
        const status = e?.response?.status;
        if (status === 401 || status === 403) {
          setError("LOGIN_REQUIRED");
        } else {
          setError(e?.response?.data || e?.message || "Failed to load orders");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      alive = false;
    };
  }, [token]);

  const sorted = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      }),
    [orders]
  );

  async function handleCancelOrderConfirmed() {
    if (!cancelTarget) return;

    try {
      setCancellingId(cancelTarget.id);
      setError("");

      await cancelMyOrder(cancelTarget.id);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelTarget.id ? { ...o, status: "Cancelled" } : o
        )
      );

      setPopup({
        show: true,
        type: "success",
        message: `Order #${cancelTarget.id} cancelled successfully.`,
      });

      setCancelTarget(null);
    } catch (e) {
      setPopup({
        show: true,
        type: "error",
        message: e?.response?.data || e?.message || "Failed to cancel order",
      });
    } finally {
      setCancellingId(null);
    }
  }

  if (!token || error === "LOGIN_REQUIRED") {
    return (
      <div className="container py-4">
        <h2 className="page-title mb-3">My Orders</h2>
        <div className="alert alert-warning">
          <div className="fw-bold mb-2">Please login to view your orders.</div>
          <div>If you are a new user, please register first.</div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-outline-secondary">Register</Link>
          <Link to="/products" className="btn btn-outline-dark">Continue shopping</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="container py-4">Loading...</div>;

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="page-title mb-1">My Orders</h2>
          <div className="muted">Track, view totals, and see delivery status.</div>
        </div>
        <Link to="/products" className="btn btn-outline-secondary">
          Continue shopping
        </Link>
      </div>

      {error && <div className="alert alert-danger">{String(error)}</div>}

      {sorted.length === 0 && (
        <div className="alert alert-info">You have no orders yet.</div>
      )}

      <div className="d-grid gap-3">
        {sorted.map((o) => (
          <div key={o.id} className="card card-shadow">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <div className="fw-bold fs-5">Order #{o.id}</div>
                  {o.createdAt && (
                    <div className="muted small mt-1">
                      Placed: {new Date(o.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="text-end">
                  <div className="muted small">Order total</div>
                  <div className="fw-bold fs-5">{money(o.totalAmount)}</div>
                </div>
              </div>

              <OrderStepper status={o.status} />

              <hr className="my-3" />

              <div className="d-flex gap-2 flex-wrap">
                <Link className="btn btn-primary btn-sm" to={`/my-orders/${o.id}`}>
                  View details
                </Link>

                {canCancelOrder(o.status) && (
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setCancelTarget(o)}
                    disabled={cancellingId === o.id}
                  >
                    {cancellingId === o.id ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Cancel Modal */}
      {cancelTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card shadow"
            style={{
              width: "100%",
              maxWidth: 420,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div className="card-body p-4">
              <h5 className="mb-3">Cancel Order</h5>
              <p className="mb-4 text-muted">
                Are you sure you want to cancel{" "}
                <strong>Order #{cancelTarget.id}</strong>?
              </p>

              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setCancelTarget(null)}
                  disabled={cancellingId === cancelTarget.id}
                >
                  No
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleCancelOrderConfirmed}
                  disabled={cancellingId === cancelTarget.id}
                >
                  {cancellingId === cancelTarget.id ? "Cancelling..." : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success / Error Popup */}
      {popup.show && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 10000,
            minWidth: 320,
            maxWidth: 420,
          }}
        >
          <div
            className={`alert ${
              popup.type === "success" ? "alert-success" : "alert-danger"
            } shadow`}
            style={{ borderRadius: 12 }}
          >
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>{popup.message}</div>
              <button
                type="button"
                className="btn-close"
                onClick={() => setPopup({ show: false, type: "", message: "" })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}