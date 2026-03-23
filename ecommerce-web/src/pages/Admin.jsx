import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function Admin() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const LOW_STOCK_LIMIT = 5;

  function extractArray(responseData, possibleKeys = []) {
    if (Array.isArray(responseData)) return responseData;

    for (const key of possibleKeys) {
      if (Array.isArray(responseData?.[key])) return responseData[key];
    }

    return [];
  }

  function getProductQty(product) {
    const qty =
      product.StockQty ??
      product.stockQty ??
      product.stock ??
      product.quantity ??
      product.qty ??
      0;

    return Number(qty) || 0;
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        api.get("/api/products", {
          params: {
            page: 1,
            pageSize: 200,
            sort: "nameAsc",
          },
        }),
        api.get("/api/categories"),
        api.get("/api/admin/orders"),
      ]);

      const products = extractArray(productsRes.data, ["products", "data", "items"]);
      const categories = extractArray(categoriesRes.data, ["categories", "data", "items"]);
      const orders = extractArray(ordersRes.data, ["orders", "data", "items"]);

      const outOfStockProducts = products.filter((p) => getProductQty(p) <= 0);

      const lowStockProducts = products.filter((p) => {
        const qty = getProductQty(p);
        return qty > 0 && qty <= LOW_STOCK_LIMIT;
      });

      setStats({
        products: productsRes.data?.totalCount ?? products.length,
        categories: categories.length,
        orders: orders.length,
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function testAdmin() {
    try {
      const res = await api.get("/api/v1/auth/admin-ping");
      alert(res.data);
    } catch (err) {
      console.error(err);
      alert("Admin ping failed");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="page-title mb-4">Admin Dashboard</h1>
        <div className="text-muted">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title mb-0">Admin Dashboard</h1>
        <button className="btn btn-outline-secondary" onClick={loadDashboard}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-shadow h-100 border-0">
            <div className="card-body">
              <div className="text-muted small mb-1">Total Products</div>
              <div className="fs-3 fw-bold">{stats.products}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-shadow h-100 border-0">
            <div className="card-body">
              <div className="text-muted small mb-1">Low Stock Items</div>
              <div className="fs-3 fw-bold text-warning">{stats.lowStock}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-shadow h-100 border-0">
            <div className="card-body">
              <div className="text-muted small mb-1">Out of Stock</div>
              <div className="fs-3 fw-bold text-danger">{stats.outOfStock}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-shadow h-100 border-0">
            <div className="card-body">
              <div className="text-muted small mb-1">Total Orders</div>
              <div className="fs-3 fw-bold text-primary">{stats.orders}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card card-shadow h-100 border-0">
            <div className="card-body">
              <div className="text-muted small mb-1">Categories</div>
              <div className="fs-3 fw-bold text-success">{stats.categories}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card card-shadow border-0 mb-4">
        <div className="card-body">
          <h5 className="mb-3">Quick Actions</h5>
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/admin/products")}
            >
              Manage Products
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/admin/inventory")}
            >
              Update Inventory
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/admin/orders")}
            >
              View Orders
            </button>

            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/admin/categories")}
            >
              Manage Categories
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/admin/coupons")}
            >
              Manage Coupons
            </button>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card card-shadow h-100 border-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Alerts</h5>
                <span className="badge bg-danger-subtle text-danger">
                  Inventory
                </span>
              </div>

              {stats.lowStock === 0 && stats.outOfStock === 0 ? (
                <div className="d-flex align-items-center gap-3 p-3 rounded bg-light">
                  <div style={{ fontSize: "1.5rem" }}>✅</div>
                  <div>
                    <div className="fw-semibold">All good</div>
                    <div className="text-muted small">
                      No low-stock or out-of-stock alerts right now.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {stats.outOfStock > 0 && (
                    <div className="d-flex align-items-center gap-3 p-3 rounded bg-danger bg-opacity-10 border border-danger-subtle">
                      <div style={{ fontSize: "1.5rem" }}>⛔</div>
                      <div>
                        <div className="fw-semibold">
                          {stats.outOfStock} product(s) out of stock
                        </div>
                        <div className="text-muted small">
                          These items are unavailable and need restocking.
                        </div>
                      </div>
                    </div>
                  )}

                  {stats.lowStock > 0 && (
                    <div className="d-flex align-items-center gap-3 p-3 rounded bg-warning bg-opacity-10 border border-warning-subtle">
                      <div style={{ fontSize: "1.5rem" }}>⚠️</div>
                      <div>
                        <div className="fw-semibold">
                          {stats.lowStock} product(s) running low
                        </div>
                        <div className="text-muted small">
                          Please review inventory and restock soon.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="card card-shadow h-100 border-0">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Recent Orders</h5>
                <span className="badge bg-primary">Latest</span>
              </div>

              {recentOrders.length === 0 ? (
                <div className="d-flex align-items-center gap-3 p-3 rounded bg-light">
                  <div style={{ fontSize: "1.5rem" }}>📭</div>
                  <div>
                    <div className="fw-semibold">No orders yet</div>
                    <div className="text-muted small">
                      Recent orders will appear here.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recentOrders.map((order, index) => {
                    const orderId = order.Id || order.id || order._id || index + 1;
                    const status = order.Status || order.status || "Unknown";

                    return (
                      <div
                        key={orderId}
                        className="list-group-item px-0 py-3 border-bottom"
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold">Order #{orderId}</div>
                          </div>

                          <span
                            className={`badge ${
                              status === "Pending"
                                ? "bg-warning text-dark"
                                : status === "Delivered"
                                ? "bg-success"
                                : status === "Cancelled"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <button className="btn btn-outline-secondary mt-4" onClick={testAdmin}>
        Test admin ping
      </button>
    </div>
  );
}

// Page loads
//     ↓
// useEffect triggers loadDashboard()
//     ↓
// 3 API calls fire simultaneously
//     ↓
// Data processed → stats calculated
//     ↓
// Stats cards, alerts, recent orders rendered
//     ↓
// Admin clicks "Refresh" → loadDashboard() runs again