import React, { useState } from "react";

const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

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
  const [amount, setAmount] = useState(1000); // user can change between 1000–1500 etc.

  const hasResult = !!petitionText;

  // -------------------- HANDLERS --------------------

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
          description: description || "PetitionDesk – Petition drafting fee",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.paymentLink) {
        console.error("Payment init error:", data);
        setError(data?.error || "Unable to start payment. Please try again.");
        return;
      }

      window.location.href = data.paymentLink;
    } catch (err) {
      console.error(err);
      setError("Network error while starting payment.");
    } finally {
      setPayLoading(false);
    }
  };

  // -------------------- STYLES --------------------

  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #ffffff, #ecfdf3)",
    padding: "16px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 12px 35px rgba(0,0,0,0.06)",
    padding: "18px",
    maxWidth: "1200px",
    margin: "0 auto",
    border: "1px solid #e5e7eb",
  };

  const labelStyle = {
    fontSize: "0.8rem",
    fontWeight: 600,
    marginBottom: 4,
  };

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
    <>
      {/* Small CSS block for responsive grid + animations */}
      <style>{`
        .pd-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 24px;
        }

        .pd-petition-box {
          max-height: 460px;
        }

        @media (max-width: 900px) {
          .pd-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .pd-petition-box {
            max-height: 650px;
          }
        }

        .pd-banner-shell {
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid #bbf7d0;
          background: #ecfdf3;
          padding: 6px 10px;
          font-size: 0.8rem;
          color: #065f46;
          white-space: nowrap;
        }

        .pd-banner-inner {
          display: inline-block;
          padding-left: 100%;
          animation: pd-scroll 22s linear infinite;
        }

        .pd-disclaimer-bar {
          margin-top: 14px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          overflow: hidden;
          border-radius: 999px;
          border: 1px solid #facc15;
          background: #fefce8;
          padding: 6px 10px;
          font-size: 0.72rem;
          color: #854d0e;
          white-space: nowrap;
        }

        .pd-disclaimer-inner {
          display: inline-block;
          padding-left: 100%;
          animation: pd-scroll 26s linear infinite;
        }

        @keyframes pd-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      <div style={pageStyle}>
        <div style={cardStyle}>
          {/* HEADER */}
          <header style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "#065f46",
                  }}
                >
                  PetitionDesk.com
                </h1>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#374151",
                    marginTop: 4,
                  }}
                >
                  AI-powered petition writer for{" "}
                  <strong>
                    police, banks, telecoms, government, human rights and more.
                  </strong>
                </p>
              </div>

              {/* Moving payment message */}
              <div className="pd-banner-shell">
                <span className="pd-banner-inner">
                  ✉️ Write SAN-grade petitions and send them directly by email
                  for just <strong>₦1,000–₦1,500</strong> per petition (amount
                  depends on your country / location). | Secure Flutterwave
                  payment • Instant petition preview • Professional routing to
                  the right institutions.
                </span>
              </div>
            </div>
          </header>

          {/* MAIN GRID */}
          <div className="pd-grid">
            {/* LEFT: FORM + PAYMENT */}
            <div>
              {/* Complainant details */}
              <section
                style={{
                  background: "#f9fafb",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
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

              {/* Complaint description */}
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
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#4b5563",
                    marginBottom: 6,
                  }}
                >
                  Explain what happened, where, when, who is involved, and what
                  you want. The more facts you give, the stronger your petition.
                </p>
                <textarea
                  style={textareaStyle}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Example: On 7 December 2025, officers attached to Okene Division unlawfully arrested me while I was travelling to Ekpoma..."
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

                  {error && (
                    <span
                      style={{ fontSize: "0.8rem", color: "#b91c1c" }}
                    >
                      {error}
                    </span>
                  )}
                </div>
              </section>

              {/* Payment box (smaller, not choking UI) */}
              <section
                style={{
                  marginTop: 12,
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
                  Payment (unlock full sending features)
                </h3>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#065f46",
                    marginBottom: 6,
                  }}
                >
                  Pay once per petition to support the platform and keep access
                  to justice affordable. Most users in Nigeria pay around{" "}
                  <strong>₦1,000</strong>; users in other countries typically
                  pay <strong>around ₦1,500</strong>.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
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
                    style={{
                      ...buttonPrimary,
                      ...(payLoading ? disabledBtn : {}),
                    }}
                    disabled={payLoading}
                  >
                    {payLoading
                      ? "Connecting to Flutterwave..."
                      : "Pay with Flutterwave"}
                  </button>
                </div>

                <p style={{ fontSize: "0.75rem", color: "#4b5563" }}>
                  ✅ You can still review and edit your petition text here. After
                  payment, you can confidently send it by email to the correct
                  institutions.
                </p>
              </section>
            </div>

            {/* RIGHT: PETITION + ROUTING */}
            <div>
              {/* Generated petition (clean white letter style) */}
              <section
                style={{
                  background: "#f9fafb",
                  borderRadius: 12,
                  padding: 14,
                  border: "1px solid #e5e7eb",
                  marginBottom: 12,
                  minHeight: 260,
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
                    Generated Petition
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
                  className="pd-petition-box"
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    padding: 14,
                    fontSize: "0.86rem",
                    color: "#111827",
                    whiteSpace: "pre-wrap",
                    overflow: "auto",
                    lineHeight: 1.55,
                  }}
                >
                  {hasResult ? (
                    petitionText
                  ) : (
                    <span style={{ color: "#9ca3af" }}>
                      Your SAN-grade petition will appear here after you click{" "}
                      <strong>“Generate Petition”</strong>. It will be formatted
                      like a clean official letter that you can print or send by
                      email.
                    </span>
                  )}
                </div>
              </section>

              {/* Routing summary */}
              <section
                style={{
                  background: "#f9fafb",
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  marginBottom: 4,
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

                {!primaryInstitution &&
                !throughInstitution &&
                (!ccList || ccList.length === 0) ? (
                  <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    Once you generate a petition, PetitionDesk will route it to
                    the <strong>most appropriate primary institution</strong>,
                    any <strong>supervising regulators</strong>, and key
                    watchdogs such as the Public Complaints Commission and the
                    National Human Rights Commission.
                  </p>
                ) : (
                  <div style={{ fontSize: "0.8rem", color: "#111827" }}>
                    {primaryInstitution && (
                      <div style={{ marginBottom: 6 }}>
                        <strong>Primary institution:</strong>
                        <div>{primaryInstitution.org}</div>
                        {primaryInstitution.address && (
                          <div style={{ color: "#4b5563" }}>
                            {primaryInstitution.address}
                          </div>
                        )}
                        {primaryInstitution.email && (
                          <div style={{ color: "#047857" }}>
                            {primaryInstitution.email}
                          </div>
                        )}
                      </div>
                    )}

                    {throughInstitution && (
                      <div style={{ marginBottom: 6 }}>
                        <strong>Through:</strong>
                        <div>{throughInstitution.org}</div>
                        {throughInstitution.address && (
                          <div style={{ color: "#4b5563" }}>
                            {throughInstitution.address}
                          </div>
                        )}
                        {throughInstitution.email && (
                          <div style={{ color: "#047857" }}>
                            {throughInstitution.email}
                          </div>
                        )}
                      </div>
                    )}

                    {ccList && ccList.length > 0 && (
                      <div>
                        <strong>CC:</strong>
                        <ul
                          style={{
                            paddingLeft: "1rem",
                            marginTop: 4,
                            marginBottom: 0,
                          }}
                        >
                          {ccList.map((cc, idx) => (
                            <li key={idx} style={{ marginBottom: 2 }}>
                              <span>{cc.org}</span>
                              {cc.email && (
                                <span style={{ color: "#047857" }}>
                                  {" "}
                                  – {cc.email}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Moving disclaimer bar at bottom */}
        <div className="pd-disclaimer-bar">
          <span className="pd-disclaimer-inner">
            ⚠️ PetitionDesk.com is not a law firm and does not provide legal
            advice. It is an AI-powered drafting tool that helps you generate
            professional petition letters based on the facts you provide. Using
            this app does not create a lawyer–client relationship. Always review,
            edit and approve your petition before submitting it to any
            institution or court. For complex or urgent cases, please consult a
            qualified lawyer.
          </span>
        </div>
      </div>
    </>
  );
}

export default App;
