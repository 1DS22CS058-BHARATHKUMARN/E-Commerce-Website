import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProduct, resolveImageUrl } from "../api/catalog.js";
import { addToCart } from "../cart/storage";

function getDiscount(price) {
  if (price >= 100) return 20;
  if (price >= 50) return 10;
  if (price >= 25) return 5;
  return 0;
}

export default function ProductDetailPage() {
  const { productId } = useParams();
  const nav = useNavigate();
  const id = Number(productId);

  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [added, setAdded] = useState(false);

  const LOW_STOCK_LIMIT = 5;

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setImageFailed(false);
        setAdded(false);

        const data = await getProduct(id);
        if (!alive) return;
        setP(data);
      } catch (e) {
        if (!alive) return;
        const status = e?.response?.status;
        setError(
          status === 404
            ? "Product not found"
            : (e?.message ?? "Failed to load product")
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (Number.isFinite(id) && id > 0) load();
    else {
      setError("Invalid product id");
      setLoading(false);
    }

    return () => {
      alive = false;
    };
  }, [id]);

  const ui = useMemo(() => {
    const name = p?.name ?? "Product";
    const categoryId = Number(p?.categoryId);
    const categoryName = p?.categoryName?.trim() || null;
    const categoryLabel =
      categoryName ||
      (Number.isFinite(categoryId) && categoryId > 0
        ? `Category #${categoryId}`
        : "Category");

    const price = typeof p?.price === "number" ? p.price : Number(p?.price);
    const priceText = Number.isFinite(price) ? `$${price.toFixed(2)}` : "—";

    const discount = Number.isFinite(price) ? getDiscount(price) : 0;
    const discountedPrice =
      discount > 0 ? price * (1 - discount / 100) : price;
    const discountedPriceText = Number.isFinite(discountedPrice)
      ? `$${discountedPrice.toFixed(2)}`
      : "—";

    const rawStock =
      p?.stockQty ??
      p?.StockQty ??
      p?.stock ??
      p?.quantity ??
      p?.qty;

    const stockQty = Number(rawStock);
    const stockKnown = Number.isFinite(stockQty);
    const outOfStock = stockKnown ? stockQty <= 0 : false;
    const lowStock = stockKnown
      ? stockQty > 0 && stockQty <= LOW_STOCK_LIMIT
      : false;

    const backTo =
      Number.isFinite(categoryId) && categoryId > 0
        ? `/products?categoryId=${categoryId}&sort=newest&page=1`
        : `/products?sort=newest&page=1`;

    const imageSrc = resolveImageUrl(p?.imageUrl);

    return {
      name,
      categoryId,
      categoryLabel,
      price,
      priceText,
      discount,
      discountedPrice,
      discountedPriceText,
      stockQty,
      stockKnown,
      outOfStock,
      lowStock,
      backTo,
      imageSrc,
    };
  }, [p]);

  function handleAddToCart() {
    if (ui.outOfStock) return;

    addToCart(
      {
        productId: id,
        name: p.name,
        price: ui.discount > 0 ? ui.discountedPrice : ui.price,
        imageUrl: p.imageUrl,
      },
      1
    );

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  if (loading) return <div className="muted">Loading…</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!p) return <div className="muted">Not found</div>;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <Link className="btn btn-outline-secondary btn-sm" to={ui.backTo}>
          ← Back to products
        </Link>

        <button
          className="btn btn-outline-dark btn-sm"
          type="button"
          onClick={() => nav("/cart")}
        >
          Go to cart
        </button>
      </div>

      <div className="pdp-grid">
        {/* Left: details */}
        <div className="card card-shadow">
          <div className="card-body">
            <div className="pdp-image mb-3 d-flex align-items-center justify-content-center bg-light rounded border overflow-hidden position-relative">
              {ui.outOfStock && (
                <span
                  className="badge bg-danger position-absolute"
                  style={{ top: 12, left: 12, zIndex: 2 }}
                >
                  Out of stock
                </span>
              )}

              {!ui.outOfStock && ui.lowStock && (
                <span
                  className="badge bg-warning text-dark position-absolute"
                  style={{ top: 12, left: 12, zIndex: 2 }}
                >
                  Low stock
                </span>
              )}

              {ui.imageSrc && !imageFailed ? (
                <img
                  src={ui.imageSrc}
                  alt={ui.name}
                  className="img-fluid"
                  style={{
                    maxHeight: "380px",
                    width: "100%",
                    objectFit: "contain",
                  }}
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="text-center py-5">
                  <div className="fw-bold">No image available</div>
                  <div className="muted small">
                    Upload an image for this product from admin.
                  </div>
                </div>
              )}
            </div>

            <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
              <div>
                <h2 className="pdp-title mb-1">{ui.name}</h2>
                <div className="muted">
                  <span className="me-2">{ui.categoryLabel}</span>
                  <span className="badge text-bg-light border">ID: {id}</span>
                </div>
              </div>

              <div className="text-end">
                {ui.discount > 0 ? (
                  <>
                    <div className="fs-3 fw-bold text-danger">
                      {ui.discountedPriceText}
                    </div>
                    <div
                      className="text-muted small"
                      style={{ textDecoration: "line-through" }}
                    >
                      {ui.priceText}
                    </div>
                    <span className="badge bg-success mt-1">
                      -{ui.discount}% off
                    </span>
                  </>
                ) : (
                  <div className="fs-3 fw-bold">{ui.priceText}</div>
                )}
                <div className="muted small mt-1">Inclusive of all taxes</div>
              </div>
            </div>

            <hr />

            <h6 className="fw-bold mb-2">About this item</h6>
            <div className="muted" style={{ whiteSpace: "pre-wrap" }}>
              {p.description?.trim() ? p.description : "No description provided."}
            </div>
          </div>
        </div>

        {/* Right: buy box */}
        <aside className="card card-shadow">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="fw-bold">Buy</div>
              <span className="badge text-bg-success">Fast delivery</span>
            </div>

            {ui.discount > 0 ? (
              <div className="mb-2">
                <div className="fs-3 fw-bold text-danger">
                  {ui.discountedPriceText}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span
                    className="text-muted small"
                    style={{ textDecoration: "line-through" }}
                  >
                    {ui.priceText}
                  </span>
                  <span className="badge bg-success">-{ui.discount}% off</span>
                </div>
              </div>
            ) : (
              <div className="fs-3 fw-bold mb-2">{ui.priceText}</div>
            )}

            <div className="mb-3">
              <div className="muted small">Stock</div>

              {!ui.stockKnown ? (
                <div className="fw-semibold">Available</div>
              ) : ui.outOfStock ? (
                <div className="fw-semibold text-danger">Out of stock</div>
              ) : ui.lowStock ? (
                <div className="fw-semibold text-warning">
                  Only {ui.stockQty} left
                </div>
              ) : (
                <div className="fw-semibold text-success">
                  {ui.stockQty} in stock
                </div>
              )}
            </div>

            <button
              className={`btn w-100 ${
                ui.outOfStock
                  ? "btn-secondary"
                  : added
                  ? "btn-success"
                  : "btn-primary"
              }`}
              type="button"
              disabled={ui.outOfStock}
              onClick={handleAddToCart}
            >
              {ui.outOfStock ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
            </button>

            <button
              className="btn btn-outline-secondary w-100 mt-2"
              type="button"
              onClick={() => nav("/cart")}
            >
              View cart
            </button>

            
          </div>
        </aside>
      </div>
    </div>
  );
}