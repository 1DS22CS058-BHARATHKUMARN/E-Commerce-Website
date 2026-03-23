


import { useEffect, useMemo, useState } from "react";
import { adminAdjustStock } from "../api/adminInventory";
import { api } from "../api/client";

function extractApiError(e) {
  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (e?.message) return e.message;
  return "Adjust failed";
}

function toArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.products)) return raw.products;
  if (Array.isArray(raw?.$values)) return raw.$values;
  return [];
}

function stockStatus(stockQty) {
  const qty = Number(stockQty);
  if (!Number.isFinite(qty) || qty <= 0) return "out";
  if (qty <= 5) return "low";
  return "in";
}

export default function AdminInventoryPage() {
  const [productId, setProductId] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState("");
  const [search, setSearch] = useState("");

  const parsed = useMemo(() => {
    const pid = Number(productId);
    const d = Number(delta);
    return {
      pid,
      d,
      pidOk: Number.isFinite(pid) && pid > 0,
      dOk: Number.isFinite(d) && d !== 0,
    };
  }, [productId, delta]);

  async function loadProducts() {
    setLoadingProducts(true);
    setProductError("");

    try {
      const res = await api.get("/api/products", {
        params: {
          page: 1,
          pageSize: 200,
          sort: "nameAsc",
        },
      });

      const list = toArray(res.data?.items ?? res.data);
      setProducts(list);
    } catch (e) {
      setProducts([]);
      setProductError(extractApiError(e) || "Failed to load inventory products");
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function submit(e) {
    e?.preventDefault?.();
    setMsg(null);

    if (!parsed.pidOk) {
      return setMsg({ type: "error", text: "Enter a valid Product Id." });
    }

    if (!parsed.dOk) {
      return setMsg({
        type: "error",
        text: "Delta must be a non-zero number (e.g., 10 or -3).",
      });
    }

    setSubmitting(true);
    try {
      await adminAdjustStock({
        productId: parsed.pid,
        delta: parsed.d,
        reason: reason?.trim() || null,
      });

      setMsg({ type: "success", text: "Stock adjusted successfully." });
      setDelta("");
      setReason("");

      await loadProducts();
    } catch (e2) {
      setMsg({ type: "error", text: extractApiError(e2) });
    } finally {
      setSubmitting(false);
    }
  }

  function fillExample(pid, d, r) {
    setMsg(null);
    setProductId(String(pid));
    setDelta(String(d));
    setReason(r);
  }

  function selectProduct(p) {
    setMsg(null);
    setProductId(String(p.id ?? p.productId ?? ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const id = String(p.id ?? p.productId ?? "");
      const name = String(p.name ?? "").toLowerCase();
      const category = String(p.categoryName ?? "").toLowerCase();
      return id.includes(q) || name.includes(q) || category.includes(q);
    });
  }, [products, search]);

  return (
    <div>
      <div className="amz-pagehead d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h2 className="page-title mb-0">Inventory</h2>

        <button
          className="btn btn-outline-dark btn-sm"
          onClick={loadProducts}
          disabled={loadingProducts}
        >
          {loadingProducts ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="row g-3">
        
        <div className="col-12 col-lg-5">
          <div className="card card-shadow admin-box admin-box--hover">
            <div className="admin-box__media">
              <div className="admin-box__icon">📦</div>
            </div>

            <div className="card-body">
              <div className="fw-bold mb-1">Adjust stock</div>
              <div className="muted mb-3">
                Positive delta = add stock. Negative delta = reduce stock.
              </div>

              <form onSubmit={submit} className="row g-3">
                <div className="col-12">
                  <label className="form-label">Product Id</label>
                  <input
                    className={"form-control " + (productId && !parsed.pidOk ? "is-invalid" : "")}
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    inputMode="numeric"
                    placeholder="e.g. 101"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Delta</label>
                  <input
                    className={"form-control " + (delta && !parsed.dOk ? "is-invalid" : "")}
                    value={delta}
                    onChange={(e) => setDelta(e.target.value)}
                    placeholder="e.g. 10 or -3"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Reason (optional)</label>
                  <input
                    className="form-control"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Supplier delivery"
                  />
                </div>

                <div className="col-12 d-flex gap-2 flex-wrap">
                  <button className="btn btn-primary" type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit"}
                  </button>

                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      setProductId("");
                      setDelta("");
                      setReason("");
                      setMsg(null);
                    }}
                    disabled={submitting}
                  >
                    Clear
                  </button>
                </div>
              </form>

              {msg && (
                <div
                  className={
                    "alert mt-3 " + (msg.type === "success" ? "alert-success" : "alert-danger")
                  }
                >
                  {msg.text}
                </div>
              )}

              <hr />

              <div className="fw-bold mb-2">Quick examples</div>

              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-sm btn-outline-primary"
                  type="button"
                  onClick={() => fillExample(101, 10, "Supplier delivery")}
                >
                  +10 stock
                </button>

                <button
                  className="btn btn-sm btn-outline-primary"
                  type="button"
                  onClick={() => fillExample(101, -3, "Damaged/return")}
                >
                  -3 stock
                </button>
              </div>

              <div className="muted small mt-3">
                Tip: Click any product row from the table to auto-fill Product Id.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Inventory Table */}
        <div className="col-12 col-lg-7">
          <div className="card card-shadow admin-box admin-box--hover h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3 flex-wrap">
                <div>
                  <div className="fw-bold">Current inventory</div>
                  <div className="muted small">
                    View product stock and select a product to adjust.
                  </div>
                </div>

                <input
                  className="form-control"
                  style={{ maxWidth: 260 }}
                  placeholder="Search by id, name, category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {productError && <div className="alert alert-danger">{productError}</div>}

              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Id</th>
                      <th>Name</th>
                      <th style={{ width: 130 }}>Category</th>
                      <th style={{ width: 110 }}>Price</th>
                      <th style={{ width: 110 }}>Stock Qty</th>
                      <th style={{ width: 130 }}>Status</th>
                      <th style={{ width: 120 }} className="text-end">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingProducts ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          Loading inventory...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No products found.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const id = p.id ?? p.productId;
                        const qty = Number(p.stockQty ?? p.stock ?? 0);
                        const status = stockStatus(qty);

                        return (
                          <tr key={id}>
                            <td className="fw-semibold">{id}</td>
                            <td>{p.name}</td>
                            <td>{p.categoryName || p.categoryId || "—"}</td>
                            <td>${Number(p.price ?? 0).toFixed(2)}</td>
                            <td>{qty}</td>
                            <td>
                              {status === "in" && (
                                <span className="badge text-bg-success">In Stock</span>
                              )}
                              {status === "low" && (
                                <span className="badge text-bg-warning">Low Stock</span>
                              )}
                              {status === "out" && (
                                <span className="badge text-bg-danger">Out of Stock</span>
                              )}
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                type="button"
                                onClick={() => selectProduct(p)}
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="muted small mt-2">
                Low Stock = 5 or less. Out of Stock = 0.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}