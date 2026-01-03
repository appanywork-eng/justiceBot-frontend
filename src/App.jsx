// src/App.jsx
import { useEffect, useState } from "react";

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

  // Your live Render backend
  const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

      setPreview(data.preview || "");
      setTxRef(data.tx_ref || "");
      setNeedsPayment(data.needsPayment !== false);

      // keep latest tx_ref available (helps in weird reload cases)
      if (data.tx_ref) localStorage.setItem("pd_last_tx_ref", data.tx_ref);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to generate petition");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (!txRef) return;
    setLoading(true);
    setError("");

    try {
      // ✅ store tx_ref before redirecting away
      localStorage.setItem("pd_pending_tx_ref", txRef);

      const res = await fetch(`${API_BASE}/pay/initialize`, {
        method: "POST",
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

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Payment init error ${res.status}`);

      if (data.ok && data.link) {
        window.location.href = data.link;
      } else {
        throw new Error(data.error || "Could not start payment");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Payment failed. Try again.");
      setLoading(false);
    }
  }

  async function unlockByTxRef(ref) {
    if (!ref) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/unlock-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_ref: ref }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Unlock error ${res.status}`);

      if (data.ok && data.unlocked) {
        setUnlocked(true);
        setPetitionText(data.petition || "");
        setMailto(data.mailto || "");

        // ✅ clear pending tx_ref after successful unlock
        localStorage.removeItem("pd_pending_tx_ref");
        localStorage.removeItem("pd_last_tx_ref");

        // ✅ clean URL but keep you on the SAME page
        window.history.replaceState({}, document.title, "/");
      } else {
        throw new Error(data.error || "Could not unlock petition");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Verification failed. If charged, contact support.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // ✅ Option A: unlock if tx_ref exists (do NOT depend on status)
    const returnedTxRef = urlParams.get("tx_ref");

    // ✅ fallback: if Flutterwave redirect doesn’t include tx_ref, use saved one
    const pending = localStorage.getItem("pd_pending_tx_ref");
    const last = localStorage.getItem("pd_last_tx_ref");

    const refToUse = returnedTxRef || pending || last;

    if (refToUse) unlockByTxRef(refToUse);
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
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Moving Disclaimer */}
      <div
        style={{
          backgroundColor: "#006600",
          color: "#ffffff",
          padding: "14px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
          marginBottom: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0, 102, 0, 0.2)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            paddingLeft: "100%",
            animation: "marquee 35s linear infinite",
            fontSize: "15px",
            fontWeight: "500",
          }}
        >
          ✨ PetitionDesk is an advanced AI-powered tool designed to help you draft
          professional petitions quickly and clearly. It provides structured drafts
          based on your input. For official submission, always review with a qualified
          lawyer. Your peace of mind matters to us. ✨ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ✨ PetitionDesk — Empowering your voice with smart, professional drafting assistance...
        </div>
      </div>

      {/* Header */}
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
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            backgroundColor: "#ffffff",
            color: "#006600",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
        >
          PD
        </div>

        <h1
          style={{
            fontSize: "42px",
            fontWeight: "900",
            margin: "0 0 8px 0",
            letterSpacing: "-1px",
          }}
        >
          PetitionDesk
        </h1>

        <p style={{ fontSize: "18px", fontWeight: "500", margin: 0, opacity: 0.95 }}>
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
              backgroundColor: "#ffffff",
              padding: "32px",
              borderRadius: "16px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            }}
          >
            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={inputStyle}
            />

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={inputStyle}
            />

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>
              Email
            </label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>
              Phone
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>
              Your Complaint
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
            />

            <button
              disabled={loading || !description.trim()}
              style={{
                padding: "16px",
                backgroundColor: loading ? "#aaa" : "#006600",
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

              <div
                style={{
                  position: "relative",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <pre
                  style={{
                    padding: "32px",
                    margin: 0,
                    fontSize: "15px",
                    lineHeight: "1.65",
                    whiteSpace: "pre-wrap",
                    textAlign: "justify",
                    background:
                      "linear-gradient(to bottom, #ffffff 0%, #f8fff8 65%, #e8f5e8 100%)",
                    minHeight: "520px",
                    borderRadius: "12px",
                  }}
                >
                  {preview}
                </pre>

                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "200px",
                    background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                style={{
                  marginTop: "30px",
                  width: "100%",
                  padding: "16px",
                  backgroundColor: loading ? "#ccc" : "#006600",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Processing..." : "Pay ₦1,050 to Unlock Full Petition"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            background: "#ffffff",
            padding: "32px",
            borderRadius: "16px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "#006600", textAlign: "center" }}>Your Generated Petition</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: "1.6" }}>
            {petitionText}
          </pre>

          {mailto && (
            <a
              href={mailto}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                margin: "30px auto 0",
                padding: "16px",
                backgroundColor: "#006600",
                color: "#fff",
                textAlign: "center",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "17px",
                fontWeight: "bold",
                maxWidth: "400px",
              }}
            >
              Open Email & Send Petition
            </a>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: "red", textAlign: "center", marginTop: "20px", fontWeight: "bold" }}>
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
