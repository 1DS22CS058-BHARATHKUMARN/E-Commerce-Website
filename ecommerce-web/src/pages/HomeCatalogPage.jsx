import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  getCategories,
  getProducts,
  getBestSellers,
  resolveImageUrl,
} from "../api/catalog";
import { addToCart } from "../cart/storage";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getDiscount(price) {
  if (price >= 100) return 20;
  if (price >= 50) return 10;
  if (price >= 25) return 5;
  return 0;
}

function SkeletonCard() {
  return (
    <div className="card card-shadow h-100">
      <div className="card-body">
        <div className="placeholder-glow">
          <div
            className="placeholder col-12 mb-3"
            style={{ height: 160, borderRadius: 12 }}
          />
          <div className="placeholder col-8 mb-2" />
          <div className="placeholder col-5 mb-3" />
          <div className="placeholder col-6 mb-2" />
          <div className="d-flex gap-2 mt-3">
            <span className="btn btn-primary disabled placeholder col-5" />
            <span className="btn btn-outline-secondary disabled placeholder col-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FiltersPanel({
  onClose,
  categoryId,
  categories,
  search,
  setSearch,
  sort,
  onSubmitSearch,
  onChangeSort,
  onChangeCategory,
  clearAll,
}) {
  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="fw-bold">Filters</div>
        {onClose && (
          <button
            className="btn btn-sm btn-outline-secondary"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label mb-1">Category</label>
        <select
          className="form-select"
          value={categoryId}
          onChange={(e) => onChangeCategory(e.target.value)}
        >
          <option value={0}>All</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={onSubmitSearch} className="mb-3">
        <label className="form-label mb-1">Search</label>
        <div className="input-group">
          <input
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
          />
          <button className="btn btn-primary" type="submit">
            Go
          </button>
        </div>
      </form>

      <div className="mb-3">
        <label className="form-label mb-1">Sort</label>
        <select className="form-select" value={sort} onChange={onChangeSort}>
          <option value="newest">Newest</option>
          <option value="bestselling">Best Selling</option>
          <option value="priceAsc">Price (Low)</option>
          <option value="priceDesc">Price (High)</option>
          <option value="nameAsc">Name (A-Z)</option>
        </select>
      </div>

      <div className="d-grid gap-2">
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={clearAll}
        >
          Clear all
        </button>
        <Link to="/cart" className="btn btn-outline-dark">
          Go to cart
        </Link>
      </div>
    </div>
  );
}

function readAuth() {
  return {
    token: localStorage.getItem("token"),
    role: (localStorage.getItem("role") || "").toLowerCase(),
  };
}

export default function HomeCatalogPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryId = useMemo(() => {
    const v = params.get("categoryId");
    const n = v ? Number(v) : 0;
    return Number.isFinite(n) ? n : 0;
  }, [params]);

  const searchQ = params.get("search") || "";
  const sortQ = params.get("sort") || "newest";
  const pageQ = Number(params.get("page") || 1) || 1;
  const limitQ = Number(params.get("limit") || 12) || 12;

  const [categories, setCategories] = useState([]);
  const [paged, setPaged] = useState(null);

  const [search, setSearch] = useState(searchQ);
  const [sort, setSort] = useState(sortQ);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [auth, setAuth] = useState(readAuth);

  useEffect(() => {
    const onAuthChanged = () => setAuth(readAuth());
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);

  const isLoggedIn = !!auth.token;
  const isAdmin = auth.role === "admin";
  const isCustomer = auth.role === "customer";

  const LOW_STOCK_LIMIT = 5;

  useEffect(() => {
    setSearch(searchQ);
  }, [searchQ]);

  useEffect(() => {
    setSort(sortQ);
  }, [sortQ]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const cats = await getCategories();
        if (!alive) return;
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        if (!alive) return;
        setCategories([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        if (sortQ === "bestselling") {
          const items = await getBestSellers(5, categoryId);

          if (!alive) return;

          const list = Array.isArray(items) ? items : [];

          setPaged({
            items: list,
            totalCount: list.length,
            page: 1,
            pageSize: list.length || 5,
          });

          return;
        }

        const res = await getProducts({
          page: pageQ,
          pageSize: limitQ,
          sort: sortQ,
          search: searchQ || undefined,
          categoryId: categoryId > 0 ? categoryId : undefined,
        });

        if (!alive) return;
        setPaged(res);
      } catch (e) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load catalog");
        setPaged(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [categoryId, searchQ, sortQ, pageQ, limitQ]);

  function updateQuery(next) {
    const merged = {
      categoryId: next.categoryId ?? (categoryId > 0 ? String(categoryId) : ""),
      search: next.search ?? searchQ,
      sort: next.sort ?? sortQ,
      page: next.page ?? String(pageQ),
      limit: next.limit ?? String(limitQ),
    };

    const cleaned = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v === "" || v === null || v === undefined) continue;
      cleaned[k] = String(v);
    }

    setParams(cleaned);
  }

  function clearAll() {
    setSearch("");
    setSort("newest");
    setParams({ sort: "newest", page: "1", limit: "12" });
  }

  function onSubmitSearch(e) {
    e.preventDefault();
    const trimmed = search.trim();

    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (matchedCategory) {
      updateQuery({ categoryId: matchedCategory.id, search: "", page: 1 });
      setSearch("");
    } else {
      updateQuery({ search: trimmed, page: 1 });
    }
  }

  function onChangeSort(e) {
    const value = e.target.value;
    setSort(value);
    updateQuery({ sort: value, page: 1 });
  }

  function onChangeCategory(value) {
    const n = Number(value);
    updateQuery({ categoryId: n > 0 ? n : "", page: 1 });
  }

  function getStockQty(product) {
    const qty =
      product.stockQty ??
      product.StockQty ??
      product.stock ??
      product.quantity ??
      product.qty;

    const n = Number(qty);
    return Number.isFinite(n) ? n : null;
  }

  function handleAddToCart(product) {
    const current = readAuth();

    if (!current.token) {
      setShowLoginModal(true);
      return;
    }

    if (current.role === "admin") return;

    const qty = getStockQty(product);
    const outOfStock = qty !== null && qty <= 0;
    if (outOfStock) return;

    const discount = getDiscount(Number(product.price));
    const finalPrice = product.price * (1 - discount / 100);

    addToCart(
      {
        productId: product.id,
        name: product.name,
        price: finalPrice,
        categoryName: product.categoryName,
        imageUrl: product.imageUrl,
      },
      1
    );

    setAddedId(product.id);
    setTimeout(() => {
      setAddedId((cur) => (cur === product.id ? null : cur));
    }, 1500);
  }

  const pageSize = paged?.pageSize ?? limitQ;
  const totalCount = paged?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = clamp(pageQ, 1, totalPages);

  function goToPage(p) {
    updateQuery({ page: clamp(p, 1, totalPages) });
  }

  const pageButtons = useMemo(() => {
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);

    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [currentPage, totalPages]);

  const selectedCategory = categories.find(
    (c) => Number(c.id) === Number(categoryId)
  );

  const pageTitle =
    sortQ === "bestselling" && categoryId > 0
      ? `${selectedCategory?.name || "Category"} Best Sellers`
      : sortQ === "bestselling"
      ? "Best Sellers"
      : sortQ === "newest" && limitQ === 5
      ? "New Arrivals"
      : "Products";

  const hidePagination = sortQ === "bestselling";

  return (
    <div>
      <div className="d-flex align-items-start align-items-md-center justify-content-between gap-2 mb-3 flex-wrap">
        <div>
          <h2 className="page-title mb-1">{pageTitle}</h2>
          <div className="muted">
            {loading
              ? "Loading..."
              : `Showing ${paged?.items?.length ?? 0} items`}
          </div>
        </div>

        <div className="d-flex gap-2 d-lg-none">
          <button
            className="btn btn-outline-secondary"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#filtersOffcanvas"
            aria-controls="filtersOffcanvas"
          >
            Filters
          </button>
          <Link to="/cart" className="btn btn-outline-dark">
            Cart
          </Link>
        </div>

        <div className="d-none d-lg-flex gap-2 flex-wrap justify-content-end">
          {categoryId > 0 && (
            <span className="catalog-filter-chip">
              Category: {selectedCategory?.name || `#${categoryId}`}
            </span>
          )}
          {searchQ && (
            <span className="catalog-filter-chip">Search: "{searchQ}"</span>
          )}
          {sortQ && (
            <span className="catalog-filter-chip">Sort: {sortQ}</span>
          )}
          {limitQ !== 12 && sortQ !== "bestselling" && (
            <span className="catalog-filter-chip">Limit: {limitQ}</span>
          )}
        </div>
      </div>

      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="filtersOffcanvas"
        aria-labelledby="filtersOffcanvasLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="filtersOffcanvasLabel">
            Filters
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body">
          <FiltersPanel
            onClose={() => {}}
            categoryId={categoryId}
            categories={categories}
            search={search}
            setSearch={setSearch}
            sort={sort}
            onSubmitSearch={onSubmitSearch}
            onChangeSort={onChangeSort}
            onChangeCategory={onChangeCategory}
            clearAll={clearAll}
          />
        </div>
      </div>

      <div className="catalog-grid">
        <aside className="d-none d-lg-block">
          <div className="card card-shadow position-sticky" style={{ top: 96 }}>
            <div className="card-body">
              <FiltersPanel
                categoryId={categoryId}
                categories={categories}
                search={search}
                setSearch={setSearch}
                sort={sort}
                onSubmitSearch={onSubmitSearch}
                onChangeSort={onChangeSort}
                onChangeCategory={onChangeCategory}
                clearAll={clearAll}
              />
            </div>
          </div>
        </aside>

        <section>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row g-3">
            {loading && !paged ? (
              Array.from({
                length: sortQ === "bestselling" ? 5 : pageSize,
              }).map((_, i) => (
                <div key={i} className="col-12 col-sm-6 col-xl-4">
                  <SkeletonCard />
                </div>
              ))
            ) : (
              (paged?.items ?? []).map((p, index) => {
                const imageSrc = resolveImageUrl(p.imageUrl);
                const stockQty = getStockQty(p);
                const stockKnown = stockQty !== null;
                const outOfStock = stockKnown && stockQty <= 0;
                const lowStock =
                  stockKnown && stockQty > 0 && stockQty <= LOW_STOCK_LIMIT;
                const added = addedId === p.id;

                const discount = getDiscount(Number(p.price));
                const original = Number(p.price);
                const discounted = original * (1 - discount / 100);

                return (
                  <div key={p.id} className="col-12 col-sm-6 col-xl-4">
                    <div className="card card-shadow h-100">
                      <div className="card-body d-flex flex-column">
                        <div
                          className="product-card__img mb-3 position-relative"
                          style={{
                            height: 260,
                            borderRadius: 12,
                            overflow: "hidden",
                            border: "1px solid rgba(0,0,0,0.08)",
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {sortQ === "bestselling" && (
                            <span
                              className="badge bg-dark position-absolute"
                              style={{ top: 10, right: 10, zIndex: 2 }}
                            >
                              #{index + 1}
                            </span>
                          )}

                          {outOfStock && (
                            <span
                              className="badge bg-danger position-absolute"
                              style={{ top: 10, left: 10, zIndex: 2 }}
                            >
                              Out of stock
                            </span>
                          )}

                          {!outOfStock && lowStock && (
                            <span
                              className="badge bg-warning text-dark position-absolute"
                              style={{ top: 10, left: 10, zIndex: 2 }}
                            >
                              Low stock
                            </span>
                          )}

                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={p.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                display: "block",
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback =
                                  e.currentTarget.parentElement?.querySelector(
                                    ".img-fallback"
                                  );
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                          ) : null}

                          <div
                            className="img-fallback muted small"
                            style={{
                              display: imageSrc ? "none" : "flex",
                              width: "100%",
                              height: "100%",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            No image
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <h5 className="mb-1 product-card__title">
                            <Link to={`/product/${p.id}`} className="text-dark">
                              {p.name}
                            </Link>
                          </h5>
                          <span className="badge text-bg-light border">
                            {p.categoryName || "General"}
                          </span>
                        </div>

                        <div className="mt-2">
                          {discount > 0 ? (
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <span className="fw-bold fs-5 text-danger">
                                ${discounted.toFixed(2)}
                              </span>
                              <span
                                className="text-muted small"
                                style={{ textDecoration: "line-through" }}
                              >
                                ${original.toFixed(2)}
                              </span>
                              <span className="badge bg-success">
                                -{discount}%
                              </span>
                            </div>
                          ) : (
                            <div className="fw-bold fs-5">
                              ${original.toFixed(2)}
                            </div>
                          )}
                          <div className="muted small mt-1">
                            Free delivery 
                          </div>

                          <div className="mt-2 small">
                            {!stockKnown ? (
                              <span className="text-muted">
                                Stock unavailable
                              </span>
                            ) : outOfStock ? (
                              <span className="text-danger fw-semibold">
                                Out of stock
                              </span>
                            ) : lowStock ? (
                              <span className="text-warning fw-semibold">
                                Only {stockQty} left
                              </span>
                            ) : (
                              <span className="text-success fw-semibold">
                                In stock ({stockQty})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-auto pt-3 d-flex gap-2">
                          <button
                            className={`btn ${
                              outOfStock || isAdmin
                                ? "btn-secondary"
                                : added
                                ? "btn-success"
                                : "btn-primary"
                            }`}
                            type="button"
                            disabled={outOfStock || isAdmin}
                            onClick={() => handleAddToCart(p)}
                            title={
                              isAdmin ? "Admin cannot add items to cart" : ""
                            }
                          >
                            {outOfStock
                              ? "Out of stock"
                              : isAdmin
                              ? "Admin cannot add"
                              : added
                              ? "Added ✓"
                              : "Add to cart"}
                          </button>

                          <Link
                            className="btn btn-outline-secondary"
                            to={`/product/${p.id}`}
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!hidePagination && (
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-4">
              <div className="muted">
                Total:{" "}
                <span className="fw-semibold text-dark">{totalCount}</span>
              </div>

              <nav aria-label="Catalog pages">
                <ul className="pagination mb-0">
                  <li
                    className={
                      "page-item " + (currentPage <= 1 ? "disabled" : "")
                    }
                  >
                    <button
                      className="page-link"
                      type="button"
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Prev
                    </button>
                  </li>

                  {pageButtons[0] > 1 && (
                    <>
                      <li className="page-item">
                        <button
                          className="page-link"
                          type="button"
                          onClick={() => goToPage(1)}
                        >
                          1
                        </button>
                      </li>
                      <li className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                    </>
                  )}

                  {pageButtons.map((p) => (
                    <li
                      key={p}
                      className={
                        "page-item " + (p === currentPage ? "active" : "")
                      }
                    >
                      <button
                        className="page-link"
                        type="button"
                        onClick={() => goToPage(p)}
                      >
                        {p}
                      </button>
                    </li>
                  ))}

                  {pageButtons[pageButtons.length - 1] < totalPages && (
                    <>
                      <li className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                      <li className="page-item">
                        <button
                          className="page-link"
                          type="button"
                          onClick={() => goToPage(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </li>
                    </>
                  )}

                  <li
                    className={
                      "page-item " +
                      (currentPage >= totalPages ? "disabled" : "")
                    }
                  >
                    <button
                      className="page-link"
                      type="button"
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </section>
      </div>

      {showLoginModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title">Login required</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLoginModal(false)}
                />
              </div>

              <div className="modal-body">
                <p className="mb-2">
                  Please login to add products to your cart.
                </p>
                <p className="text-muted small mb-0">
                  You need a customer account to continue shopping.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowLoginModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowLoginModal(false);
                    navigate("/login");
                  }}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}