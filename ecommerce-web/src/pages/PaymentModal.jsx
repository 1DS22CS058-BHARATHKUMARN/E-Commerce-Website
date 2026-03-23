import { useState } from "react";

function CardInput({ label, value, onChange, placeholder, maxLength, inputMode }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">{label}</label>
      <input
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        inputMode={inputMode || "text"}
        autoComplete="off"
      />
    </div>
  );
}

function formatCardNumber(val) {
  return val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export default function PaymentModal({ total, onPay, onClose, loading }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvv, setCvv]               = useState("");
  const [name, setName]             = useState("");
  const [errors, setErrors]         = useState({});
  const [processing, setProcessing] = useState(false);

  function validate() {
    const e = {};
    if (name.trim().length < 2)                          e.name       = "Enter cardholder name.";
    if (cardNumber.replace(/\s/g, "").length !== 16)     e.cardNumber = "Enter a valid 16-digit card number.";
    if (!/^\d{2}\/\d{2}$/.test(expiry))                  e.expiry     = "Enter expiry as MM/YY.";
    if (cvv.length < 3)                                  e.cvv        = "Enter a valid CVV.";
    return e;
  }

  async function handlePay() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setProcessing(true);
    // Simulate a 1.5s payment gateway delay
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    onPay();
  }

  const busy = processing || loading;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
          zIndex: 1040,
        }}
        onClick={!busy ? onClose : undefined}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1050,
          width: "100%",
          maxWidth: 440,
          padding: "0 16px",
        }}
      >
        <div className="card" style={{ borderRadius: 20, overflow: "hidden" }}>

          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
              padding: "20px 24px",
              color: "#fff",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Secure Payment</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  ${Number(total).toFixed(2)}
                </div>
              </div>
              <div style={{ fontSize: 28 }}>💳</div>
            </div>

            {/* Fake card chip + brand row */}
            <div
              className="d-flex align-items-center justify-content-between mt-3"
              style={{ opacity: 0.75, fontSize: 13 }}
            >
              <span>🔒 256-bit SSL encrypted</span>
              <span style={{ letterSpacing: 2 }}>VISA / MC</span>
            </div>
          </div>

          {/* Body */}
          <div className="card-body" style={{ padding: "24px" }}>

            <CardInput
              label="Cardholder Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: null })); }}
            />
            {errors.name && <div className="text-danger small mt-n2 mb-2">{errors.name}</div>}

            <CardInput
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              inputMode="numeric"
              maxLength={19}
              onChange={(e) => {
                setCardNumber(formatCardNumber(e.target.value));
                setErrors((p) => ({ ...p, cardNumber: null }));
              }}
            />
            {errors.cardNumber && <div className="text-danger small mt-n2 mb-2">{errors.cardNumber}</div>}

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label fw-semibold">Expiry</label>
                <input
                  className="form-control"
                  placeholder="MM/YY"
                  value={expiry}
                  maxLength={5}
                  inputMode="numeric"
                  onChange={(e) => {
                    setExpiry(formatExpiry(e.target.value));
                    setErrors((p) => ({ ...p, expiry: null }));
                  }}
                />
                {errors.expiry && <div className="text-danger small mt-1">{errors.expiry}</div>}
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">CVV</label>
                <input
                  className="form-control"
                  placeholder="•••"
                  value={cvv}
                  maxLength={4}
                  inputMode="numeric"
                  type="password"
                  onChange={(e) => {
                    setCvv(e.target.value.replace(/\D/g, ""));
                    setErrors((p) => ({ ...p, cvv: null }));
                  }}
                />
                {errors.cvv && <div className="text-danger small mt-1">{errors.cvv}</div>}
              </div>
            </div>

            <button
              className="btn btn-primary w-100 mt-4"
              style={{ height: 48, fontSize: 16, fontWeight: 800, borderRadius: 14 }}
              onClick={handlePay}
              disabled={busy}
            >
              {processing ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Processing payment...
                </span>
              ) : (
                `Pay $${Number(total).toFixed(2)}`
              )}
            </button>

            <button
              className="btn btn-outline-secondary w-100 mt-2"
              style={{ borderRadius: 14 }}
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>

            <div
              className="text-center mt-3"
              style={{ fontSize: 12, color: "#6b7280" }}
            >
              🔒 Your payment info is never stored. This is a demo checkout.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}