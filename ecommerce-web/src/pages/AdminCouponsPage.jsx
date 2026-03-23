import { useEffect, useMemo, useState } from "react";
import {
  adminCreateCoupon,
  adminGetCoupons,
  adminUpdateCoupon,
} from "../api/adminCoupons";

function emptyForm() {
  return {
    code: "",
    isActive: true,
    expiresAtUtc: "",
    minSubtotal: "",
    discountType: "Percent",
    discountValue: "",
    maxDiscount: "",
    usageLimitTotal: "",
    usageLimitPerUser: "",
  };
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
  return e?.message || "Request failed";
}

function toPayload(form) {
  return {
    code: form.code.trim().toUpperCase(),
    isActive: !!form.isActive,
    expiresAtUtc: form.expiresAtUtc ? new Date(form.expiresAtUtc).toISOString() : null,
    minSubtotal: form.minSubtotal === "" ? null : Number(form.minSubtotal),
    discountType: form.discountType,
    discountValue: form.discountValue === "" ? 0 : Number(form.discountValue),
    maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
    usageLimitTotal: form.usageLimitTotal === "" ? null : Number(form.usageLimitTotal),
    usageLimitPerUser: form.usageLimitPerUser === "" ? null : Number(form.usageLimitPerUser),
  };
}

function toForm(coupon) {
  return {
    code: coupon.code ?? "",
    isActive: !!coupon.isActive,
    expiresAtUtc: coupon.expiresAtUtc ? coupon.expiresAtUtc.slice(0, 16) : "",
    minSubtotal: coupon.minSubtotal ?? "",
    discountType: coupon.discountType ?? "Percent",
    discountValue: coupon.discountValue ?? "",
    maxDiscount: coupon.maxDiscount ?? "",
    usageLimitTotal: coupon.usageLimitTotal ?? "",
    usageLimitPerUser: coupon.usageLimitPerUser ?? "",
  };
}

export default function AdminCouponsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  async function loadCoupons() {
    try {
      setLoading(true);
      setError("");
      const data = await adminGetCoupons();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function onChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = toPayload(form);

      if (editingId) {
        await adminUpdateCoupon(editingId, payload);
        setSuccess("Coupon updated successfully.");
      } else {
        await adminCreateCoupon(payload);
        setSuccess("Coupon created successfully.");
      }

      resetForm();
      await loadCoupons();
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setSaving(false);
    }
  }

  function onEdit(coupon) {
    setEditingId(coupon.id);
    setForm(toForm(coupon));
    setSuccess("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }, [items]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title mb-0">Manage Coupons</h1>
        <button className="btn btn-outline-secondary" onClick={loadCoupons} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="card card-shadow border-0 mb-4">
        <div className="card-body">
          <h5 className="mb-3">{editingId ? `Edit Coupon #${editingId}` : "Create Coupon"}</h5>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={onSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Code</label>
                <input
                  className="form-control"
                  value={form.code}
                  onChange={(e) => onChange("code", e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Discount Type</label>
                <select
                  className="form-select"
                  value={form.discountType}
                  onChange={(e) => onChange("discountType", e.target.value)}
                >
                  <option value="Percent">Percent</option>
                  <option value="Fixed">Fixed</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Discount Value</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => onChange("discountValue", e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Min Subtotal</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minSubtotal}
                  onChange={(e) => onChange("minSubtotal", e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Max Discount</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxDiscount}
                  onChange={(e) => onChange("maxDiscount", e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Expires At</label>
                <input
                  className="form-control"
                  type="datetime-local"
                  value={form.expiresAtUtc}
                  onChange={(e) => onChange("expiresAtUtc", e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Usage Limit Total</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={form.usageLimitTotal}
                  onChange={(e) => onChange("usageLimitTotal", e.target.value)}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Usage Limit Per User</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={form.usageLimitPerUser}
                  onChange={(e) => onChange("usageLimitPerUser", e.target.value)}
                />
              </div>

              <div className="col-md-4 d-flex align-items-end">
                <div className="form-check">
                  <input
                    id="isActive"
                    className="form-check-input"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => onChange("isActive", e.target.checked)}
                  />
                  <label htmlFor="isActive" className="form-check-label">
                    Active
                  </label>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Coupon" : "Create Coupon"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card card-shadow border-0">
        <div className="card-body">
          <h5 className="mb-3">Coupons List</h5>

          {loading ? (
            <div className="text-muted">Loading coupons...</div>
          ) : sortedItems.length === 0 ? (
            <div className="text-muted">No coupons found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min Subtotal</th>
                    <th>Expires</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((x) => (
                    <tr key={x.id}>
                      <td>{x.id}</td>
                      <td className="fw-semibold">{x.code}</td>
                      <td>
                        <span className={`badge ${x.isActive ? "bg-success" : "bg-secondary"}`}>
                          {x.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{x.discountType}</td>
                      <td>{x.discountValue}</td>
                      <td>{x.minSubtotal ?? "-"}</td>
                      <td>{x.expiresAtUtc ? new Date(x.expiresAtUtc).toLocaleString() : "-"}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(x)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}