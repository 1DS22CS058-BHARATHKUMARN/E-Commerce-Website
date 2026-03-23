import { useEffect, useState } from "react";
import { getCategories, createCategory } from "../api/categories";

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

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const data = await getCategories();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg({ type: "error", text: extractApiError(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setMsg({ type: "error", text: "Category name is required." });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      await createCategory({ name: trimmed });
      setName("");
      setMsg({ type: "success", text: "Category added successfully." });
      await load();
    } catch (e) {
      setMsg({ type: "error", text: extractApiError(e) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="page-title mb-0">Manage Categories</h2>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="card card-shadow">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Add Category</h5>

              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label">Category Name</label>
                  <input
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>

                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Add Category"}
                </button>
              </form>

              {msg && (
                <div
                  className={
                    "alert mt-3 " +
                    (msg.type === "success" ? "alert-success" : "alert-danger")
                  }
                >
                  {msg.text}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card card-shadow">
            <div className="card-body">
              <h5 className="fw-bold mb-3">Existing Categories</h5>

              {loading ? (
                <div>Loading...</div>
              ) : items.length === 0 ? (
                <div className="muted">No categories found.</div>
              ) : (
                <ul className="list-group">
                  {items.map((x) => (
                    <li
                      key={x.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span>{x.name}</span>
                      <span className="badge bg-secondary">#{x.id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}