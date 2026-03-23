import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminGetAllOrders, adminUpdateOrderStatus } from "../api/orders";

const STATUSES = ["Placed", "Packed", "Shipped", "Delivered", "Cancelled"];

function money(x) {
  const n = Number(x);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

const STATUS_CONFIG = {
  placed:    { color: "#4338ca", bg: "#eef2ff", border: "#c7d2fe", icon: "🛒", label: "Placed" },
  packed:    { color: "#c2410c", bg: "#fff7ed", border: "#fed7aa", icon: "📦", label: "Packed" },
  shipped:   { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", icon: "🚚", label: "Shipped" },
  delivered: { color: "#15803d", bg: "#ecfdf5", border: "#bbf7d0", icon: "✅", label: "Delivered" },
  cancelled: { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", icon: "❌", label: "Cancelled" },
};

function getStatusConfig(status) {
  return STATUS_CONFIG[String(status || "").toLowerCase()] ?? {
    color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", icon: "📋", label: status ?? "Unknown",
  };
}

function DeliveryNote({ status }) {
  const cfg = getStatusConfig(status);
  const messages = {
    placed:    "Payment confirmed — ready to pack & ship.",
    packed:    "Order packed — mark as Shipped when dispatched.",
    shipped:   "Out for delivery — mark as Delivered on arrival.",
    delivered: "Delivered successfully. Order complete.",
    cancelled: "This order has been cancelled.",
  };
  const msg = messages[String(status || "").toLowerCase()];
  if (!msg) return null;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: cfg.color,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 14 }}>{cfg.icon}</span>
      {msg}
    </div>
  );
}

/* ── Order Card ── */
function OrderCard({ order, onChangeStatus, updatingId }) {
  const o = order;
  
  
  const cfg = getStatusConfig(o.status);
  const statusKey   = String(o.status || "").toLowerCase();
  const isLocked    = statusKey === "delivered" || statusKey === "cancelled";
  const isCancelled = statusKey === "cancelled";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.13)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
    >

      {/* ── Coloured top bar ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}11)`,
          borderBottom: `3px solid ${cfg.color}`,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Left: icon + order id */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: cfg.bg,
              border: `2px solid ${cfg.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            {cfg.icon}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", letterSpacing: 0.2 }}>
              Order #{o.id}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
              UserId #
              {o.userEmail ?? o.userId ?? "Unknown user"}
            </div>
          </div>
        </div>

        {/* Right: status pill */}
        <span
          style={{
            background: cfg.bg,
            color: cfg.color,
            border: `1.5px solid ${cfg.border}`,
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: 12,
            fontWeight: 700,
            whiteSpace: "nowrap",
            letterSpacing: 0.3,
          }}
        >
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

          {/* Total */}
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 10,
              padding: "10px 14px",
              border: "1px solid #f3f4f6",
            }}
          >
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Total
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginTop: 2 }}>
              {money(o.totalAmount)}
            </div>
          </div>

          {/* Date */}
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 10,
              padding: "10px 14px",
              border: "1px solid #f3f4f6",
            }}
          >
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Date
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginTop: 2 }}>
              {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : ""}
            </div>
          </div>
        </div>

        {/* ── Payment badge ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: isCancelled ? "#fef2f2" : "#ecfdf5",
            border: `1px solid ${isCancelled ? "#fecaca" : "#bbf7d0"}`,
            borderRadius: 10,
            padding: "10px 14px",
          }}
        >
          <span style={{ fontSize: 18 }}>{isCancelled ? "🚫" : "💳"}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: isCancelled ? "#b91c1c" : "#15803d" }}>
              {isCancelled ? "Payment Refunded" : "Payment Received"}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {isCancelled ? "Order was cancelled" : "Paid in full via checkout"}
            </div>
          </div>
          <span
            style={{
              marginLeft: "auto",
              background: isCancelled ? "#b91c1c" : "#15803d",
              color: "#fff",
              borderRadius: 999,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {isCancelled ? "CANCELLED" : "PAID"}
          </span>
        </div>

        {/* Delivery note */}
        <DeliveryNote status={o.status} />

        {/* Status updater */}
        <div>
          <div
            style={{
              fontSize: 11,
              color: "#9ca3af",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Update Status
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              className="form-select form-select-sm"
              style={{ borderRadius: 8, fontSize: 13, flex: 1 }}
              value={o.status}
              disabled={isLocked || updatingId === o.id}
              onChange={(e) => onChangeStatus(o.id, e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {updatingId === o.id && (
              <span className="spinner-border spinner-border-sm text-secondary" style={{ flexShrink: 0 }} />
            )}
          </div>
          {isLocked && (
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
              🔒 Status locked — order is {statusKey}.
            </div>
          )}
        </div>

      </div>

      {/* ── Footer actions ── */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid #f3f4f6",
          display: "flex",
          gap: 8,
          background: "#fafafa",
        }}
      >
        <Link
          to={`/admin/orders/${o.id}`}
          style={{
            flex: 1,
            textAlign: "center",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "9px 0",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#374151"}
          onMouseLeave={e => e.currentTarget.style.background = "#111827"}
        >
          View Details →
        </Link>
      </div>

    </div>
  );
}

/* ── Main page ── */
export default function AdminOrdersPage() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res  = await adminGetAllOrders();
      const data = res?.data ?? res;
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onChangeStatus(orderId, status) {
    setUpdatingId(orderId);
    try {
      await adminUpdateOrderStatus(orderId, status);
      await load();
    } catch (e) {
      alert(e?.message || "Status update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [orders]);

  const counts = useMemo(() => {
    return sorted.reduce((acc, o) => {
      const s = String(o.status || "").toLowerCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
  }, [sorted]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0, color: "#111827" }}>
            🧾 Orders
          </h2>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>
            {sorted.length} total &nbsp;·&nbsp;
            <span style={{ color: "#15803d", fontWeight: 700 }}>{sorted.length} paid</span>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {/* ── Summary chips ── */}
      {!loading && sorted.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) =>
            counts[key] ? (
              <span
                key={key}
                style={{
                  background: cfg.bg,
                  color: cfg.color,
                  border: `1.5px solid ${cfg.border}`,
                  borderRadius: 999,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {cfg.icon} {cfg.label}: {counts[key]}
              </span>
            ) : null
          )}
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6b7280", padding: "40px 0" }}>
          <span className="spinner-border spinner-border-sm" />
          Loading orders...
        </div>
      ) : sorted.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#9ca3af",
            background: "#f9fafb",
            borderRadius: 16,
            border: "2px dashed #e5e7eb",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>No orders yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Orders will appear here once customers place them.</div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {sorted.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onChangeStatus={onChangeStatus}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}

    </div>
  );
}