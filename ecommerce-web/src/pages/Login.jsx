import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, logout } from "../api/auth";

const STATIC_ADMIN_EMAIL = "bharath@gmail.com";
const STATIC_ADMIN_PASSWORD = "Bha@2003";
const LS_TOKEN_KEY = "token";
const LS_ROLE_KEY = "role";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Static admin
      if (
        normalizedEmail === STATIC_ADMIN_EMAIL.toLowerCase() &&
        password === STATIC_ADMIN_PASSWORD
      ) {
        logout?.();
        localStorage.setItem(LS_ROLE_KEY, "Admin");
        localStorage.setItem(LS_TOKEN_KEY, "STATIC_ADMIN");
        window.dispatchEvent(new Event("auth:changed"));
        navigate("/admin", { replace: true });
        return;
      }

      // Customer via API
      const data = await login(email, password);

      // notify navbar/app immediately
      window.dispatchEvent(new Event("auth:changed"));

      if ((data?.role || "").toLowerCase() === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });//Prevent back-to-login
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-5">
        <div className="card card-shadow">
          <div className="card-body p-4">
            <h2 className="page-title mb-1">Sign in</h2>
            <div className="muted mb-3">Login as admin or customer.</div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  className="form-control"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                />
              </div>

              <button
                className="btn btn-primary w-100"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="mt-3 text-center">
              New customer? <Link to="/register">Create account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}