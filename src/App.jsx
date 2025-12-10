import React, { useState } from "react";

const API_BASE = "https://justicebot-backend-6pzy.onrender.com"; // your Render backend

function App() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [petitionText, setPetitionText] = useState("");
  const [primaryInstitution, setPrimaryInstitution] = useState(null);
  const [throughInstitution, setThroughInstitution] = useState(null);
  const [ccList, setCcList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(1000); // default amount

  const hasResult = !!petitionText;

  // ---------------------------------------------------
  // Generate Petition
  // ---------------------------------------------------
  const handleGenerate = async () => {
    setError("");
    setPetitionText("");
    setPrimaryInstitution(null);
    setThroughInstitution(null);
    setCcList([]);

    if (!description.trim()) {
      setError("Please describe your complaint in detail.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          address,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to generate petition.");
      } else {
        setPetitionText(data.petitionText || "");
        setPrimaryInstitution(data.primaryInstitution || null);
        setThroughInstitution(data.throughInstitution || null);
        setCcList(Array.isArray(data.ccList) ? data.ccList : []);
      }
    } catch (err) {
      console.error(err);
      setError("Network error while generating petition.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // Copy Petition
  // ---------------------------------------------------
  const handleCopy = async () => {
    if (!petitionText) return;

    try {
      await navigator.clipboard.writeText(petitionText);
      alert("Petition copied to clipboard.");
    } catch (err) {
      console.error(err);
      alert("Unable to copy. Please copy manually.");
    }
  };

  // ---------------------------------------------------
  // Email Petition
  // ---------------------------------------------------
  const handleEmail = () => {
    if (!petitionText) return;

    const emails = new Set();

    const add = (obj) => {
      if (!obj || !obj.email) return;
      obj.email
        .split(/[;,]/)
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((e) => emails.add(e));
    };

    add(primaryInstitution);
    add(throughInstitution);
    (ccList || []).forEach(add);

    const to = Array.from(emails).join(",");
    const subject = encodeURIComponent("Formal Petition");
    const body = encodeURIComponent(petitionText);

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  // ---------------------------------------------------
  // Download Petition
  // ---------------------------------------------------
  const handleDownload = () => {
    if (!petitionText) return;
    const blob = new Blob([petitionText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "petition.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------
  // Payment (Flutterwave)
  // ---------------------------------------------------
  const handlePay = async () => {
    setError("");

    if (!email || !fullName) {
      setError("Please enter your full name and email before payment.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount (₦1000–₦1500).");
      return;
    }

    setPayLoading(true);

    try {
      const res = await fetch(`${API_BASE}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "NGN",
          fullName,
          email,
          description:
            description || "PetitionDesk – Petition drafting fee",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.paymentLink) {
        console.error("Payment error:", data);
        setError(data?.error || "Payment failed, please try again.");
        return;
      }

      // Redirect to Flutterwave Checkout
      window.location.href = data.paymentLink;
    } catch (err) {
      console.error(err);
      setError("Network error while starting payment.");
    } finally {
      setPayLoading(false);
    }
  };

  // ---------------------------------------------------
  // UI STYLES
  // ---------------------------------------------------
  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #ffffff, #ecfdf3)",
    padding: "20px",
    fontFamily: "system-ui, sans-serif",
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    border: "1px solid #e5e7eb",
  };

  const labelStyle = { fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "0.9rem",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "160px",
    resize: "vertical",
  };

  const buttonPrimary = {
    backgroundColor: "#047857",
    color: "#ffffff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 18px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  };

  const buttonSecondary = {
    backgroundColor: "#ffffff",
    color: "#047857",
    border: "1px solid #047857",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
  };

  const disabledBtn = {
    opacity: 0.6,
    cursor: "not-allowed",
  };

  // ---------------------------------------------------
  // UI RENDER
  // ---------------------------------------------------
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* HEADER */}
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#065f46" }}>
                PetitionDesk.com
              </h1>
              <p style={{ fontSize: "0.9rem", color: "#374151", marginTop: 4 }}>
                AI-powered petition writer for{" "}
                <strong>police, banks, government, telecoms, employers & more.</strong>
              </p>
            </div>

            <div
              style={{
                background: "#ecfdf3",
                borderRadius: "999px",
                padding: "8px 14px",
                border: "1px solid #bbf7d0",
                fontSize: "0.8rem",
                color: "#065f46",
                maxWidth: 360,
              }}
            >
              ✉️ <strong>Write SAN-grade petitions for just ₦1,000–₦1,500.</strong>  
              Price depends on your country/location.
            </div>
          </div>
        </header>

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: 24,
          }}
        >
          {/* LEFT FORM */}
          <div>
            {/* COMPLAINANT DETAILS */}
            <section
              style={{
                background: "#f9fafb",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#065f46",
                  marginBottom: 8,
                }}
              >
                Complainant details
              </h2>

              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <div style={labelStyle}>Full name</div>
                  <input
                    style={inputStyle}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Nelson Ononivami Oniwon"
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={labelStyle}>Email</div>
                    <input
                      style={inputStyle}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <div style={labelStyle}>Phone</div>
                    <input
                      style={inputStyle}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="080..."
                    />
                  </div>
                </div>

                <div>
                  <div style={labelStyle}>Address (optional)</div>
                  <input
                    style={inputStyle}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House No, Street, Area, State"
                  />
                </div>
              </div>
            </section>

            {/* DESCRIPTION */}
            <section
              style={{
                background: "#f9fafb",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}
            >
              <h2
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "#065f46",
                  marginBottom: 6,
                }}
              >
                Describe your complaint
              </h2>

              <textarea
                style={textareaStyle}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain exactly what happened…"
              ></textarea>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <button
                  onClick={handleGenerate}
                  style={{ ...buttonPrimary, ...(loading ? disabledBtn : {}) }}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Petition"}
                </button>

                {error && (
                  <span style={{ fontSize: "0.8rem", color: "#b91c1c" }}>
                    {error}
                  </span>
                )}
              </div>
            </section>

            {/* PAYMENT */}
            <section
              style={{
                background: "#ecfdf5",
                borderRadius: 12,
                padding: 12,
                border: "1px solid #bbf7d0",
                marginTop: 16,
              }}
            >
              <h3
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#065f46",
                  marginBottom: 6,
                }}
              >
                Payment (unlock full sending features)
              </h3>

              <p style={{ fontSize: "0.8rem", color: "#065f46" }}>
                Most Nigerians pay around <strong>₦1,000</strong>, and users outside Nigeria  
                typically pay <strong>₦1,500</strong>.
              </p>

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <div>
                  <div style={labelStyle}>Amount (₦)</div>
                  <input
                    type="number"
                    min={500}
                    style={{ ...inputStyle, width: 120 }}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>

                <button
                  onClick={handlePay}
                  style={{ ...buttonPrimary, ...(payLoading ? disabledBtn : {}) }}
                  disabled={payLoading}
                >
                  {payLoading ? "Connecting..." : "Pay with Flutterwave"}
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT SIDE */}
          <div>
            {/* PETITION OUTPUT */}
            <section
              style={{
                background: "#f9fafb",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Generated Petition
              </h2>

              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <button
                  onClick={handleCopy}
                  disabled={!hasResult}
                  style={{
                    ...buttonSecondary,
                    ...(hasResult ? {} : disabledBtn),
                  }}
                >
                  📋 Copy
                </button>

                <button
                  onClick={handleEmail}
                  disabled={!hasResult}
                  style={{
                    ...buttonSecondary,
                    ...(hasResult ? {} : disabledBtn),
                  }}
                >
                  ✉️ Email
                </button>

                <button
                  onClick={handleDownload}
                  disabled={!hasResult}
                  style={{
                    ...buttonSecondary,
                    ...(hasResult ? {} : disabledBtn),
                  }}
                >
                  ⬇️ Download
                </button>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 8,
                  padding: 10,
                  border: "1px solid #e5e7eb",
                  whiteSpace: "pre-wrap",
                  maxHeight: 360,
                  overflow: "auto",
                }}
              >
                {hasResult ? (
                  petitionText
                ) : (
                  <span style={{ color: "#9ca3af" }}>
                    Your SAN-grade petition will appear here…
                  </span>
                )}
              </div>
            </section>

            {/* ROUTING */}
            <section
              style={{
                background: "#f9fafb",
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Routing Summary
              </h3>

              {!primaryInstitution &&
              !throughInstitution &&
              (!ccList || ccList.length === 0) ? (
                <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  After generating your petition, PetitionDesk automatically routes it
                  to the correct institution, supervisory regulators, and watchdogs.
                </p>
              ) : (
                <>
                  {primaryInstitution && (
                    <div style={{ marginBottom: 6 }}>
                      <strong>Primary:</strong> {primaryInstitution.org}
                      <br />
                      {primaryInstitution.address}
                      <br />
                      <span style={{ color: "#047857" }}>
                        {primaryInstitution.email}
                      </span>
                    </div>
                  )}

                  {throughInstitution && (
                    <div style={{ marginBottom: 6 }}>
                      <strong>Through:</strong> {throughInstitution.org}
                      <br />
                      {throughInstitution.address}
                      <br />
                      <span style={{ color: "#047857" }}>
                        {throughInstitution.email}
                      </span>
                    </div>
                  )}

                  {ccList && ccList.length > 0 && (
                    <div>
                      <strong>CC:</strong>
                      <ul style={{ paddingLeft: 16 }}>
                        {ccList.map((cc, i) => (
                          <li key={i}>
                            {cc.org}{" "}
                            <span style={{ color: "#047857" }}>
                              {cc.email}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* DISCLAIMER */}
            <section
              style={{
                background: "#fefce8",
                padding: 10,
                borderRadius: 12,
                border: "1px solid #facc15",
              }}
            >
              <h4
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  marginBottom: 4,
                  color: "#854d0e",
                }}
              >
                Disclaimer
              </h4>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#854d0e",
                  lineHeight: 1.4,
                }}
              >
                PetitionDesk.com is not a law firm and does not provide legal
                advice. It is an automated drafting tool that generates
                professional petitions based on your input. Always review your
                petition before submitting it. For complex matters, consult a
                qualified lawyer.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
