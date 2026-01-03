import { useState, useEffect } from "react";

const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [petitionText, setPetitionText] = useState("");
  const [sector, setSector] = useState("");
  const [subject, setSubject] = useState("");

  const [txRef, setTxRef] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [mailto, setMailto] = useState("");

  /* ============================================================
     GENERATE PETITION
  ============================================================ */
  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnlocked(false);

    try {
      const res = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint: description.trim(),
          petitioner: {
            fullName,
            address,
            email,
            phone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Generation failed");

      setPetitionText(data.petition || "");
      setSector(data.sector || "");
      setSubject(data.subject || "");

      // Start payment immediately after generation
      await initiatePayment();
    } catch (err) {
      setError(err.message || "Failed to generate petition");
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     PAYMENT INIT
  ============================================================ */
  async function initiatePayment() {
    try {
      const res = await fetch(`${API_BASE}/pay/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1050,
          currency: "NGN",
          email: email || "user@petitiondesk.com",
          name: fullName || "PetitionDesk User",
          phone,
        }),
      });

      const data = await res.json();

      if (!data.ok || !data.link) {
        throw new Error(data.error || "Payment init failed");
      }

      setTxRef(data.tx_ref);
      setPaymentLink(data.link);

      // Redirect to Flutterwave
      window.location.href = data.link;
    } catch (err) {
      setError(err.message || "Payment error");
    }
  }

  /* ============================================================
     VERIFY PAYMENT
  ============================================================ */
  async function verifyPayment() {
    const params = new URLSearchParams(window.location.search);
    const tx_ref = params.get("tx_ref");
    const transaction_id = params.get("transaction_id");

    if (!tx_ref || !transaction_id) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE}/pay/verify?transaction_id=${transaction_id}&tx_ref=${tx_ref}`
      );

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Payment not successful");

      // Payment successful → unlock
      setUnlocked(true);

      // Build mailto locally (server already embedded emails in petition text)
      const body = encodeURIComponent(petitionText);
      setMailto(`mailto:?subject=${encodeURIComponent(subject)}&body=${body}`);

      window.history.replaceState({}, document.title, "/");
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    verifyPayment();
    // eslint-disable-next-line
  }, []);

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 20 }}>
      <h1>PetitionDesk</h1>

      {!unlocked ? (
        <form onSubmit={handleGenerate}>
          <input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea placeholder="Your complaint" value={description} onChange={(e) => setDescription(e.target.value)} />

          <button disabled={loading}>
            {loading ? "Processing..." : "Generate Petition"}
          </button>
        </form>
      ) : (
        <div>
          <h2>Petition Ready</h2>
          <pre>{petitionText}</pre>

          {mailto && (
            <a href={mailto} style={{ display: "block", marginTop: 20 }}>
              Open Email App & Send
            </a>
          )}
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
