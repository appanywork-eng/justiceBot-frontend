import { useState, useEffect } from "react";

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

  const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPreview("");
    setTxRef("");
    setNeedsPayment(false);

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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Server error");
      }

      const data = await res.json();
      setPreview(data.preview || "");
      setTxRef(data.tx_ref || "");
      setNeedsPayment(true);
    } catch (err) {
      setError("Connection issue. Check internet or try again.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: 1050,
          currency: "NGN",
          email: email.trim() || "user@petitiondesk.com",
          name: fullName.trim() || "User",
          phone: phone.trim() || "",
        }),
      });

      const data = await res.json();
      if (data.ok && data.link) {
        window.location.href = data.link;
      } else {
        setError(data.error || "Payment failed");
      }
    } catch (err) {
      setError("Payment error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function checkUnlock() {
    const params = new URLSearchParams(window.location.search);
    const tx_ref = params.get("tx_ref");
    if (!tx_ref) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/unlock-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_ref }),
      });

      const data = await res.json();
      if (data.ok && data.unlocked) {
        setUnlocked(true);
        setPetitionText(data.petition || "");
        setMailto(data.mailto || "");
        window.history.replaceState({}, document.title, "/");
      }
    } catch (err) {
      setError("Unlock failed. Refresh or contact support.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkUnlock();
  }, []);

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "20px", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Disclaimer */}
      <div style={{ backgroundColor: "#006600", color: "#fff", padding: "14px", borderRadius: "12px", marginBottom: "24px", textAlign: "center" }}>
        ✨ PetitionDesk is an AI-powered drafting tool. Always consult a lawyer for official use. ✨
      </div>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #006600, #009900)", color: "#fff", padding: "28px", borderRadius: "16px", textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "42px", fontWeight: "900" }}>PetitionDesk</h1>
        <p style={{ fontSize: "18px" }}>Legal AI Petition Generator</p>
      </div>

      {!unlocked ? (
        <>
          <form onSubmit={handleGenerate} style={{ background: "#fff", padding: "32px", borderRadius: "16px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "20px" }}>
            <label>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} required />

            <label>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} required />

            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

            <label>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

            <label>Your Complaint</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: "160px" }} required />

            <button type="submit" disabled={loading} style={{ padding: "16px", background: "#006600", color: "#fff", fontWeight: "bold", border: "none", borderRadius: "10px" }}>
              {loading ? "Generating..." : "Generate Petition"}
            </button>
          </form>

          {needsPayment && (
            <div style={{ marginTop: "40px", textAlign: "center" }}>
              <h2>Petition Preview</h2>
              <pre style={{ background: "#fff", padding: "20px", borderRadius: "12px", textAlign: "left", whiteSpace: "pre-wrap" }}>
                {preview}
              </pre>
              <button onClick={handlePay} disabled={loading} style={{ marginTop: "20px", padding: "16px", background: "#006600", color: "#fff", fontWeight: "bold", border: "none", borderRadius: "12px" }}>
                Pay ₦1,050 to Unlock
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ background: "#fff", padding: "32px", borderRadius: "16px" }}>
          <h2>Your Full Petition</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{petitionText}</pre>
          {mailto && <a href={mailto} style={{ display: "block", marginTop: "30px", padding: "16px", background: "#006600", color: "#fff", textAlign: "center", borderRadius: "12px" }}>Send via Email</a>}
        </div>
      )}

      {error && <div style={{ color: "red", marginTop: "20px", textAlign: "center" }}>{error}</div>}
    </div>
  );
}

const inputStyle = {
  padding: "14px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontSize: "16px",
};
