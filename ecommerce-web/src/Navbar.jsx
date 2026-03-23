import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { logout } from "./api/auth";
import { cartCount } from "./cart/storage";

export default function Navbar() {
  const navigate = useNavigate();

  const [auth, setAuth] = useState(() => ({
    token: localStorage.getItem("token"),
    role: (localStorage.getItem("role") || "").toLowerCase(),
  }));

  const isAdmin = auth.role === "admin";
  const token = auth.token;

  const [count, setCount] = useState(cartCount());
  const [q, setQ] = useState("");

  useEffect(() => {
    const refresh = () => setCount(cartCount());
    window.addEventListener("cart:changed", refresh);
    return () => window.removeEventListener("cart:changed", refresh);
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      setAuth({
        token: localStorage.getItem("token"),
        role: (localStorage.getItem("role") || "").toLowerCase(),
      });
    };
    window.addEventListener("auth:changed", onAuthChanged);
    return () => window.removeEventListener("auth:changed", onAuthChanged);
  }, []);
  //lazy initializer
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }) =>
    "nav-link px-2" + (isActive ? " active" : "");

  const cartLabel = useMemo(() => {
    const safe = Number.isFinite(count) ? count : 0;
    return safe > 99 ? "99+" : String(safe);
  }, [count]);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const value = q.trim();

    if (!value) {
      navigate("/products?sort=newest&page=1");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(value)}&sort=newest&page=1`);
  };

  return (
    <header className="amz-header sticky-top">
      <nav className="navbar navbar-expand-lg amz-navbar">
        <div className="container">
          <Link className="navbar-brand amz-brand" to="/">
            <span className="amz-brand__logo">Ecommerce</span>
            <span className="amz-brand__dot">.in</span>
          </Link>

          <button
            className="navbar-toggler amz-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse gap-3" id="mainNavbar">
            {!isAdmin && (
              <form className="amz-search ms-lg-2" onSubmit={onSubmitSearch}>
                <input
                  className="form-control amz-search__input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                />
                <button className="btn amz-search__btn" type="submit">
                  Search
                </button>
              </form>
            )}

            <ul className="navbar-nav ms-lg-auto mb-2 mb-lg-0 align-items-lg-center">
              {!isAdmin && (
                <>
                  <li className="nav-item">
                    <NavLink className={navLinkClass} to="/products">
                      Products
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink className={navLinkClass} to="/my-orders">
                      My Orders
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink className="nav-link px-2 amz-cartlink" to="/cart">
                      <span className="amz-cartlink__icon" aria-hidden="true">
                        🛒
                      </span>
                      <span className="amz-cartlink__text">Cart</span>
                      <span className="amz-cartlink__badge">{cartLabel}</span>
                    </NavLink>
                  </li>
                </>
              )}

              {isAdmin && (
                <>
                  <li className="nav-item">
                    <NavLink className={navLinkClass} to="/admin">
                      Dashboard
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink className={navLinkClass} to="/admin/products">
                      Manage Products
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink className={navLinkClass} to="/admin/inventory">
                      Inventory
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink className={navLinkClass} to="/admin/categories">
                      Categories
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink className={navLinkClass} to="/admin/coupons">
                      Manage Coupons
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink className={navLinkClass} to="/admin/orders">
                      Orders
                    </NavLink>
                  </li>
                </>
              )}
            </ul>

            <div className="d-flex gap-2">
              {!token ? (
                <>
                  <button
                    className="btn amz-btn amz-btn--ghost"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </button>

                  <button
                    className="btn amz-btn amz-btn--primary"
                    onClick={() => navigate("/register")}
                  >
                    Register
                  </button>
                </>
              ) : (
                <button className="btn amz-btn amz-btn--warn" onClick={handleLogout}>
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {!isAdmin && (
        <div className="amz-subnav">
          <div className="container d-flex gap-3 flex-wrap">
            <Link className="amz-subnav__link" to="/products?sort=newest&page=1">
              All
            </Link>

            <Link
              className="amz-subnav__link"
              to="/products?sort=newest&page=1&limit=8"
            >
              New Arrivals
            </Link>

            <Link
              className="amz-subnav__link"
              to="/products?sort=bestselling&page=1"
            >
              🔥 Best Sellers
            </Link>

            <Link
              className="amz-subnav__link"
              to="/products?categoryId=1&sort=newest&page=1"
            >
              💻 Electronics
            </Link>

            <Link
              className="amz-subnav__link"
              to="/products?categoryId=2&sort=newest&page=1"
            >
              📚 Books
            </Link>

            <Link
              className="amz-subnav__link"
              to="/products?categoryId=3&sort=newest&page=1"
            >
              👕 Clothing
            </Link>

            <Link
              className="amz-subnav__link"
              to="/products?categoryId=4&sort=newest&page=1"
            >
              🏏 Sports
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}