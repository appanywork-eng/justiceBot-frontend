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
  const [amount, setAmount] = useState(1000); // default ₦1000 – user can change to 1500, etc.

  const hasResult = !!petitionText;

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

  const handleCopy = async () => {
    if (!petitionText) return;
    try {
      await navigator.clipboard.writeText(petitionText);
      alert("Petition copied to clipboard.");
    } catch (err) {
      console.error(err);
      alert("Unable to copy. Please select and copy manually.");
    }
  };

  const handleEmail = () => {
    if (!petitionText) return;

    // Build mailto with all known emails (primary + through + CC)
    const emails = new Set();

    const addEmail = (obj) => {
      if (!obj || !obj.email) return;
      obj.email
        .split(/[;,]/)
        .map((e) => e.trim())
        .filter(Boolean)
        .forEach((e) => emails.add(e));
    };

    addEmail(primaryInstitution);
    addEmail(throughInstitution);
    (ccList || []).forEach(addEmail);

    const to = Array.from(emails).join(",");
    const subject = encodeURIComponent("Formal Petition");
    const body = encodeURIComponent(petitionText);

    const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const handleDownload = () => {
    if (!petitionText) return;
    const blob = new Blob([petitionText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "petition.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePay = async () => {
    setError("");
    if (!email || !fullName) {
      setError("Please enter your full name and email before payment.");
      return;
    }
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount (e.g. 1000 or 1500).");
      return;
    }

    setPayLoading(true);
    try:
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
          description: description || "PetitionDesk – Petition drafting fee",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.paymentLink) {
        console.error("Payment init error:", data);
        setError(data?.error || "Unable to start payment. Please try again.");
        return;
      }

      // Redirect to Flutterwave checkout
      window.location.href = data.paymentLink;
    } catch (err) {
      console.error(err);
      setError("Network error while starting payment.");
    } finally {
      setPayLoading(false);
    }
  };

  // --- simple styles (green & white, clean) ---
  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #ffffff, #ecfdf3)",
    padding: "20px",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    outline: "none",
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
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
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
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  };

  const disabledBtn = {
    opacity: 0.6,
    cursor: "not-allowed",
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* HEADER */}
        <header style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#065f46" }}>
                PetitionDesk.com
              </h1>
              <p style={{ fontSize: "0.9rem", color: "#374151", marginTop: 4 }}>
                AI-powered petition writer for{" "}
                <strong>banks, police, telecoms, government, human rights and more.</strong>
              </p>
            </div>

            {/* moving pricing banner (simple, non-animated) */}
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
              ✉️{" "}
              <strong>
                Write SAN-grade petitions and send them directly by email for just ₦1,000–₦1,500 per petition
              </strong>{" "}
              (amount depends on your country / location).
            </div>
          </div>
        </header>

        {/* BODY LAYOUT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: 24,
          }}
        >
          {/* LEFT: FORM */}
          <div>
            <section
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                border: "1px solid #e5e7eb",
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
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 8 }}>
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

            <section
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 14,
                border: "1px solid #e5e7eb",
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
                Describe your complaint
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#4b5563", marginBottom: 6 }}>
                Explain what happened, where, when, who is involved, and what you want. The more facts you give,
                the stronger your petition.
              </p>
              <textarea
                style={textareaStyle}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: On 7 December 2025, officers attached to XYZ Division in Kubwa unlawfully arrested me..."
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={handleGenerate}
                  style={{
                    ...buttonPrimary,
                    ...(loading ? disabledBtn : {}),
                  }}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Petition"}
                </button>

                {/* simple error line */}
                {error && (
                  <span style={{ fontSize: "0.8rem", color: "#b91c1c" }}>
                    {error}
                  </span>
                )}
              </div>
            </section>

            {/* PAYMENT SECTION */}
            <section
              style={{
                marginTop: 16,
                background: "#ecfdf5",
                borderRadius: 12,
                padding: 12,
                border: "1px solid #bbf7d0",
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
                Payment (unlock full sending power)
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#065f46", marginBottom: 6 }}>
                Pay once per petition to support the platform and help us keep improving access to justice.  
                Most Nigerian users pay <strong>around ₦1,000</strong>; users in other countries typically pay
                <strong> around ₦1,500</strong>. You can set the exact amount below.
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
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
                  {payLoading ? "Connecting to Flutterwave..." : "Pay with Flutterwave"}
                </button>
              </div>

              <p style={{ fontSize: "0.75rem", color: "#4b5563" }}>
                ✅ You can still review and edit your petition text here.  
                💡 After payment, you’ll be able to confidently send it by email to the correct institutions.
              </p>
            </section>
          </div>

          {/* RIGHT: RESULT / ROUTING */}
          <div>
            <section
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 14,
                border: "1px solid #e5e7eb",
                marginBottom: 12,
                minHeight: 220,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <h2
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Generated petition
                </h2>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    style={{
                      ...buttonSecondary,
                      ...(hasResult ? {} : disabledBtn),
                    }}
                    disabled={!hasResult}
                    onClick={handleCopy}
                  >
                    📋 Copy
                  </button>
                  <button
                    style={{
                      ...buttonSecondary,
                      ...(hasResult ? {} : disabledBtn),
                    }}
                    disabled={!hasResult}
                    onClick={handleEmail}
                  >
                    ✉️ Email
                  </button>
                  <button
                    style={{
                      ...buttonSecondary,
                      ...(hasResult ? {} : disabledBtn),
                    }}
                    disabled={!hasResult}
                    onClick={handleDownload}
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  padding: 10,
                  fontSize: "0.85rem",
                  color: "#111827",
                  whiteSpace: "pre-wrap",
                  minHeight: 140,
                  maxHeight: 360,
                  overflow: "auto",
                }}
              >
                {hasResult ? (
                  petitionText
                ) : (
                  <span style={{ color: "#9ca3af" }}>
                    Your SAN-grade petition will appear here after you click{" "}
                    <strong>“Generate Petition”</strong>.
                  </span>
                )}
              </div>
            </section>

            <section
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 12,
                border: "1px solid #e5e7eb",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                Routing summary (who your petition is going to)
              </h3>

              {!primaryInstitution && !throughInstitution && (!ccList || ccList.length === 0) ? (
                <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                  Once you generate a petition, PetitionDesk will try to route it to the{" "}
                  <strong>most appropriate primary institution</strong>, any{" "}
                  <strong>supervising regulators</strong>, plus key watchdogs like PCC and NHRC.
                </p>
              ) : (
                <div style={{ fontSize: "0.8rem", color: "#111827" }}>
                  {primaryInstitution && (
                    <div style={{ marginBottom: 6 }}>
                      <strong>Primary institution:</strong>
                      <div>{primaryInstitution.org}</div>
                      {primaryInstitution.address && (
                        <div style={{ color: "#4b5563" }}>{primaryInstitution.address}</div>
                      )}
                      {primaryInstitution.email && (
                        <div style={{ color: "#047857" }}>{primaryInstitution.email}</div>
                      )}
                    </div>
                  )}

                  {throughInstitution && (
                    <div style={{ marginBottom: 6 }}>
                      <strong>Through:</strong>
                      <div>{throughInstitution.org}</div>
                      {throughInstitution.address && (
                        <div style={{ color: "#4b5563" }}>{throughInstitution.address}</div>
                      )}
                      {throughInstitution.email && (
                        <div style={{ color: "#047857" }}>{throughInstitution.email}</div>
                      )}
                    </div>
                  )}

                  {ccList && ccList.length > 0 && (
                    <div>
                      <strong>CC:</strong>
                      <ul style={{ paddingLeft: "1rem", marginTop: 4 }}>
                        {ccList.map((cc, idx) => (
                          <li key={idx} style={{ marginBottom: 2 }}>
                            <span>{cc.org}</span>
                            {cc.email && (
                              <span style={{ color: "#047857" }}> – {cc.email}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* DISCLAIMER */}
            <section
              style={{
                background: "#fefce8",
                borderRadius: 12,
                padding: 10,
                border: "1px solid #facc15",
              }}
            >
              <h4
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#854d0e",
                  marginBottom: 4,
                }}
              >
                Disclaimer
              </h4>
              <p style={{ fontSize: "0.75rem", color: "#854d0e", lineHeight: 1.4 }}>
                PetitionDesk.com is <strong>not a law firm</strong> and does not provide legal advice.
                It is an AI-powered drafting tool that helps you generate professional petition letters
                based on the facts you provide. Using this app does not create a lawyer–client relationship.
                You remain responsible for reviewing, editing, and approving any petition before you submit
                it to any institution or court. For complex or urgent matters, please consult a qualified lawyer.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
