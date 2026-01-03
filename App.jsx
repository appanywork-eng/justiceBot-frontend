/* ============================================================
   FILE: src/App.jsx
============================================================ */
import { useEffect, useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [preview, setPreview] = useState("");
  const [txRef, setTxRef] = useState("");
  const [needsPayment, setNeedsPayment] = useState(false);

  const [unlocked, setUnlocked] = useState(false);
  const [petitionText, setPetitionText] = useState("");
  const [mailto, setMailto] = useState("");

  // ✅ Netlify should set VITE_API_BASE
  // Fallback uses your Render URL
  const API_BASE = useMemo(() => {
    const raw = import.meta.env.VITE_API_BASE || "https://justicebot-backend-6pzy.onrender.com";
    return String(raw).replace(/\/+$/, ""); // avoid trailing slash -> prevents //generate-petition
  }, []);

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPreview("");
    setTxRef("");
    setNeedsPayment(false);
    setUnlocked(false);

    try {
      const res = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint: description.trim(),
          petitioner: {
            fullName: fullName.trim(),
            address: address.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

      setPreview(data.preview || "");
      setTxRef(data.tx_ref || "");
      setNeedsPayment(Boolean(data.needsPayment));
    } catch (err) {
      // fetch() network/CORS errors surface here as TypeError
      setError(err?.message || "Failed to generate petition (network/CORS)");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (!txRef) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/pay/initialize`, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: 1050,
          currency: "NGN",
          email: email.trim() || "user@petitiondesk.com",
          name: fullName.trim() || "PetitionDesk User",
          phone: phone.trim() || "",
        }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || `Payment init error ${res.status}`);

      if (data.ok && data.link) window.location.href = data.link;
      else throw new Error(data.error || "Payment failed");
    } catch (err) {
      setError(err?.message || "Payment error");
    } finally {
      setLoading(false);
    }
  }

  async function unlockByTxRef(returnedTxRef) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/unlock-petition`, {
        method: "POST",
        mode: "cors",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_ref: returnedTxRef }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || `Unlock error ${res.status}`);

      if (data.ok && data.unlocked) {
        setUnlocked(true);
        setPetitionText(data.petition || "");
        setMailto(data.mailto || "");
        window.history.replaceState({}, document.title, "/");
      } else {
        throw new Error(data.error || "Could not unlock petition");
      }
    } catch (err) {
      setError(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const returnedTxRef = urlParams.get("tx_ref");

    // ✅ Don't depend on `status`
    if (returnedTxRef) unlockByTxRef(returnedTxRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #006600, #009900)",
          color: "#ffffff",
          padding: "28px 20px",
          borderRadius: "16px",
          textAlign: "center",
          marginBottom: "40px",
          boxShadow: "0 6px 20px rgba(0, 102, 0, 0.3)",
          position: "relative",
        }}
      >
        <h1 style={{ fontSize: "42px", fontWeight: "900", margin: "0 0 8px 0" }}>
          PetitionDesk....
        </h1>
        <p style={{ fontSize: "18px", fontWeight: "500", margin: 0 }}>
          Legal AI Petition Generator
        </p>
      </div>

      {!unlocked ? (
        <>
          <form
            onSubmit={handleGenerate}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "22px",
              background: "#fff",
              padding: "32px",
              borderRadius: "16px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            }}
          >
            <label style={{ fontWeight: "600" }}>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} required />

            <label style={{ fontWeight: "600" }}>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} required />

            <label style={{ fontWeight: "600" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

            <label style={{ fontWeight: "600" }}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

            <label style={{ fontWeight: "600" }}>Your Complaint / Issue</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: "180px", resize: "vertical" }}
              required
            />

            <button
              disabled={loading || !description.trim()}
              style={{
                padding: "16px",
                backgroundColor: loading || !description.trim() ? "#aaa" : "#006600",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "17px",
                border: "none",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Generating..." : "Generate Petition"}
            </button>
          </form>

          {needsPayment && (
            <div style={{ marginTop: "40px" }}>
              <h2 style={{ color: "#006600", textAlign: "center", marginBottom: "20px" }}>
                Petition Preview
              </h2>

              <pre
                style={{
                  padding: "24px",
                  fontSize: "15px",
                  lineHeight: "1.65",
                  whiteSpace: "pre-wrap",
                  textAlign: "justify",
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                {preview}
              </pre>

              <button
                onClick={handlePay}
                disabled={loading}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  padding: "18px",
                  backgroundColor: "#006600",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                {loading ? "Processing..." : "Pay ₦1,050 to Unlock Full Petition"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ background: "#fff", padding: "40px", borderRadius: "16px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#006600", textAlign: "center", marginBottom: "30px" }}>
            Your Full Petition is Ready!
          </h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: "1.7", background: "#f9fff9", padding: "20px", borderRadius: "10px" }}>
            {petitionText}
          </pre>

          {mailto && (
            <a
              href={mailto}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                margin: "40px auto 0",
                padding: "18px",
                backgroundColor: "#006600",
                color: "#fff",
                textAlign: "center",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "18px",
                fontWeight: "bold",
                maxWidth: "500px",
              }}
            >
              Open Email Client & Send Petition
            </a>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: "#d32f2f", background: "#ffebee", padding: "16px", borderRadius: "8px", marginTop: "20px", textAlign: "center" }}>
          {error}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "14px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontSize: "16px",
  backgroundColor: "#fff",
};

