import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(email.trim().toLowerCase(), password);
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6 col-lg-5">
        <div className="card card-shadow">
          <div className="card-body p-4">
            <h2 className="page-title mb-1">Create account</h2>
            <div className="muted mb-3">Register as a customer.</div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  className="form-control"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input
                  className={`form-control ${
                    confirmPassword
                      ? password === confirmPassword
                        ? "is-valid"
                        : "is-invalid"
                      : ""
                  }`}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <div className="invalid-feedback">Passwords do not match.</div>
                )}
                {confirmPassword && password === confirmPassword && (
                  <div className="valid-feedback">Passwords match!</div>
                )}
              </div>

              <button
                className="btn btn-primary w-100"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Register"}
              </button>
            </form>

            <div className="mt-3 text-center">
              Already have an account? <Link to="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}