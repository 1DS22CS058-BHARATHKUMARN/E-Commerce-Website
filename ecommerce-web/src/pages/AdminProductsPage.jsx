import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadProducts,
  loadCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  clearError,
} from "../store/adminProductsSlice";

export default function AdminProducts() {
  const dispatch = useDispatch();

  const {
    products,
    categories,
    loading,
    categoriesLoading,
    busyId,
    error,
  } = useSelector((state) => state.adminProducts);

  const emptyForm = useMemo(
    () => ({
      id: "",
      name: "",
      description: "",
      categoryId: "",
      price: "",
      stockQty: "",
      imageUrl: "",
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);
  const selectedId = form.id;

  useEffect(() => {
    dispatch(loadProducts());
    dispatch(loadCategories());
  }, [dispatch]);

  const onChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const resetForm = () => {
    dispatch(clearError());
    setForm(emptyForm);
  };

  const onSelectEdit = (p) => {
    dispatch(clearError());

    const id = p.id ?? p.productId ?? "";
    setForm({
      id: String(id),
      name: p.name ?? "",
      description: p.description ?? "",
      categoryId: String(p.categoryId ?? ""),
      price: String(p.price ?? ""),
      stockQty: String(p.stockQty ?? p.stock ?? ""),
      imageUrl: p.imageUrl ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async () => {
    const payload = {
      name: form.name?.trim(),
      description: form.description?.trim(),
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      stockQty: Number(form.stockQty),
      imageUrl: form.imageUrl?.trim() || null,
    };

    const result = await dispatch(createProduct(payload));
    if (result.meta.requestStatus === "fulfilled") resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedId) return;

    const payload = {
      id: Number(selectedId),
      name: form.name?.trim(),
      description: form.description?.trim(),
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      stockQty: Number(form.stockQty),
      imageUrl: form.imageUrl?.trim() || null,
    };

    const result = await dispatch(updateProduct({ id: selectedId, payload }));
    if (result.meta.requestStatus === "fulfilled") resetForm();
  };

  const handleDelete = async (id) => {
    const ok = window.confirm(`Delete product #${id}?`);
    if (!ok) return;

    const result = await dispatch(deleteProduct(id));
    if (result.meta.requestStatus === "fulfilled") {
      if (String(form.id) === String(id)) resetForm();
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const categoryMap = useMemo(() => {
    const map = {};
    for (const c of safeCategories) {
      const id = c.id ?? c.categoryId ?? c.Id;
      const name = c.name ?? c.categoryName ?? c.Name;
      if (id != null) map[id] = name;
    }
    return map;
  }, [safeCategories]);

//   Component (AdminProducts)
//     ↓ dispatch(thunk)
// Thunk (makes API call)
//     ↓ returns result
// Slice (updates store)
//     ↓ state changes
// Component re-renders automatically

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-bold m-0">Admin Products</h2>

        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-dark btn-sm"
            onClick={() => {
              dispatch(loadProducts());
              dispatch(loadCategories());
            }}
            disabled={loading || categoriesLoading}
          >
            {loading || categoriesLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* FORM */}
      <div className="card shadow-sm mb-4 admin-form-card">
        <div className="admin-form-media">
          <div className="d-flex align-items-center gap-3">
            <div className="admin-form-icon">📦</div>
            <div>
              <div className="admin-form-title">Create / Edit Product</div>
              <p className="admin-form-sub">
                Fill details here. Use the table <b>Edit</b> button to load an
                existing product.
              </p>
            </div>
          </div>

          {selectedId ? (
            <span className="badge text-bg-primary">Editing #{selectedId}</span>
          ) : (
            <span className="badge text-bg-secondary">Create Mode</span>
          )}
        </div>

        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <div className="mb-2">
                <label className="form-label">Product Id (DB)</label>
                <input
                  className="form-control"
                  value={form.id}
                  readOnly
                  placeholder="Select a product from the table to edit"
                />
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    placeholder="e.g. iPhone 15 Pro Max"
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.categoryId}
                    onChange={(e) => onChange("categoryId", e.target.value)}
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading
                        ? "Loading categories..."
                        : "Select category"}
                    </option>

                    {safeCategories.map((c) => {
                      const id = c.id ?? c.categoryId ?? c.Id;
                      const name = c.name ?? c.categoryName ?? c.Name;

                      return (
                        <option key={id} value={id}>
                          {name} (#{id})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Short description (shown on product page)"
                    value={form.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Price</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 999.99"
                    value={form.price}
                    onChange={(e) => onChange("price", e.target.value)}
                    inputMode="decimal"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Stock Qty</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 20"
                    value={form.stockQty}
                    onChange={(e) => onChange("stockQty", e.target.value)}
                    inputMode="numeric"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Image URL </label>
                  <input
                    className="form-control"
                    placeholder="https://..."
                    value={form.imageUrl}
                    onChange={(e) => onChange("imageUrl", e.target.value)}
                  />
                </div>
              </div>

              <div className="d-flex gap-2 mt-3 flex-wrap">
                <button
                  className="btn btn-success"
                  onClick={handleCreate}
                  disabled={loading || categoriesLoading}
                >
                  Create
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleUpdate}
                  disabled={!selectedId || loading || categoriesLoading}
                >
                  Update
                </button>

                <button
                  className="btn btn-outline-secondary"
                  onClick={resetForm}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>

              <small className="text-muted d-block mt-3">
                Note: Create/Update/Delete uses admin endpoints. If you get
                401/403, your token/role is not accepted by the backend.
              </small>
            </div>

            <div className="col-12 col-lg-4">
              <div className="card border-0 bg-light h-100">
                <div className="card-body">
                  <div className="fw-bold mb-2">Preview</div>

                  <div className="mb-2">
                    <div className="text-muted small">Title</div>
                    <div className="fw-semibold">{form.name?.trim() || "—"}</div>
                  </div>

                  <div className="mb-2">
                    <div className="text-muted small">Category</div>
                    <div className="fw-semibold">
                      {form.categoryId
                        ? categoryMap[form.categoryId] ||
                          categoryMap[Number(form.categoryId)] ||
                          `#${form.categoryId}`
                        : "—"}
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-muted small">Price</div>
                    <div className="fw-semibold">
                      {form.price ? `$${form.price}` : "—"}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-muted small">Stock</div>
                    <div className="fw-semibold">{form.stockQty || "—"}</div>
                  </div>

                  <div className="text-muted small mb-1">Image</div>
                  <div
                    style={{
                      height: 140,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {form.imageUrl?.trim() ? (
                      <img
                        src={form.imageUrl.trim()}
                        alt="Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="text-muted">No image</div>
                    )}
                  </div>

                  <div className="muted small mt-3">
                    Tip: Use the table <b>Edit</b> button to load the DB Id
                    automatically.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="fw-semibold mb-3">
            All Products (from GET /api/products)
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Id</th>
                  <th>Name</th>
                  <th style={{ width: 120 }}>Price</th>
                  <th style={{ width: 120 }}>Stock</th>
                  <th style={{ width: 160 }}>Category</th>
                  <th style={{ width: 210 }} className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {safeProducts.map((p) => {
                  const id = p.id ?? p.productId;
                  const categoryId = p.categoryId;
                  const categoryName =
                    categoryMap[categoryId] || p.categoryName || categoryId;

                  return (
                    <tr key={id}>
                      <td className="fw-semibold">{id}</td>
                      <td>{p.name}</td>
                      <td>
                        {Number.isFinite(Number(p.price))
                          ? `$${Number(p.price).toFixed(2)}`
                          : "—"}
                      </td>
                      <td>{p.stockQty ?? p.stock}</td>
                      <td>{categoryName ?? "—"}</td>
                      <td className="text-end">
                        <div className="btn-group">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => onSelectEdit(p)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(id)}
                            disabled={busyId === id}
                          >
                            {busyId === id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && safeProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No products found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      Loading...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <small className="text-muted">
            This table shows the real DB <b>Id</b>. Admin can update/delete
            without typing the id manually.
          </small>
        </div>
      </div>
    </div>
  );
}