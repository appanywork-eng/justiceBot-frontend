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
  const [amount, setAmount] = useState(1000);

  // Payment lock: only paid users see full petition + tools
  const [isPaid, setIsPaid] = useState(false);

  // Routing modal (PDPS-2.0 preview before commit)
  const [showRoutingModal, setShowRoutingModal] = useState(false);
  const [pendingPetitionText, setPendingPetitionText] = useState("");
  const [pendingPrimary, setPendingPrimary] = useState(null);
  const [pendingThrough, setPendingThrough] = useState(null);
  const [pendingCcList, setPendingCcList] = useState([]);

  const hasResult = !!petitionText;

  // --- helpers ---
  const getPetitionPreview = (text) => {
    if (!text) return "";
    const maxChars = 1400; // show enough to judge quality but not full
    if (text.length <= maxChars || isPaid) return text;
    return (
      text.slice(0, maxChars) +
      "\n\n[...] Full petition text is locked. Complete payment to unlock the full SAN-grade petition."
    );
  };

  const resetOutput = () => {
    setPetitionText("");
    setPrimaryInstitution(null);
    setThroughInstitution(null);
    setCcList([]);
  };

  const handleGenerate = async () => {
    setError("");
    resetOutput();
    setPendingPetitionText("");
    setPendingPrimary(null);
    setPendingThrough(null);
    setPendingCcList([]);

    if (!description.trim()) {
      setError("Please describe your complaint in detail.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        // Put everything into PENDING state first (modal will confirm)
        setPendingPetitionText(data.petitionText || "");
        setPendingPrimary(data.primaryInstitution || null);
        setPendingThrough(data.throughInstitution || null);
        setPendingCcList(Array.isArray(data.ccList) ? data.ccList : []);
        setShowRoutingModal(true);
      }
    } catch (err) {
      console.error(err);
      setError("Network error while generating petition.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRouting = () => {
    // Commit pending routing + petition to "live" state
    setPetitionText(pendingPetitionText || "");
    setPrimaryInstitution(pendingPrimary || null);
    setThroughInstitution(pendingThrough || null);
    setCcList(Array.isArray(pendingCcList) ? pendingCcList : []);
    setShowRoutingModal(false);
  };

  const handleCancelRouting = () => {
    // Allow user to cancel and adjust description / try again
    setShowRoutingModal(false);
  };

  const handleCopy = async () => {
    if (!petitionText) return;
    if (!isPaid) {
      alert("Please complete payment to unlock full copy access to this petition.");
      return;
    }
    try {
      await navigator.clipboard.writeText(petitionText);
      alert("Full petition copied to clipboard.");
    } catch (err) {
      console.error(err);
      alert("Unable to copy. Please select and copy manually.");
    }
  };

  const handleEmail = () => {
    if (!petitionText) return;
    if (!isPaid) {
      alert("Please complete payment to unlock direct email sending.");
      return;
    }

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
    if (!isPaid) {
      alert("Please complete payment to unlock full download.");
      return;
    }
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
        headers: { "Content-Type": "application/json" },
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

      // Mark as paid on our side (real verification can be added later with webhook/tx check)
      setIsPaid(true);

      window.location.href = data.paymentLink;
    } catch (err) {
      console.error(err);
      setError("Network error while starting payment.");
    } finally {
      setPayLoading(false);
    }
  };

  // --- styles ---
  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #ffffff, #ecfdf3)",
    padding: "20px 12px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    padding: "18px",
    maxWidth: "1200px",
    margin: "0 auto",
    border: "1px solid #e5e7eb",
  };

  const labelStyle = {
    fontSize: "0.85rem",
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
    minHeight: "170px",
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

  const canUseTools = hasResult && isPaid;
  const displayPetition = getPetitionPreview(petitionText);

  return (
    <div style={pageStyle}>
      {/* marquee styles for top + bottom strips */}
      <style>{`
        .pd-marquee {
          overflow: hidden;
          white-space: nowrap;
        }
        .pd-marquee-content {
          display: inline-block;
          padding-left: 100%;
          animation: pd-marquee-keyframes 18s linear infinite;
        }
        @keyframes pd-marquee-keyframes {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      <div style={cardStyle}>
        {/* HEADER */}
        <header style={{ marginBottom: 12 }}>
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
                  fontSize: "1.6rem",
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
                  maxWidth: 520,
                }}
              >
                AI-powered petition writer for{" "}
                <strong>
                  banks, police, telecoms, government, human rights and more.
                </strong>
              </p>
            </div>
          </div>

          {/* TOP MOVING PAYMENT STRIP */}
          <div
            style={{
              marginTop: 10,
              background: "#ecfdf3",
              borderRadius: "999px",
              border: "1px solid #bbf7d0",
              padding: "4px 10px",
              fontSize: "0.8rem",
              color: "#065f46",
            }}
            className="pd-marquee"
          >
            <div className="pd-marquee-content">
              ✉️ Write SAN-grade petitions and send them directly by email to
              the right institutions for just <strong>₦1,000–₦1,500</strong> per
              petition (depending on your location). —{" "}
              <strong>
                Pay once, use the letter for police, banks, agencies, regulators
                and watchdogs.
              </strong>
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT – single column for more space */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* LEFT: FORM + PAYMENT */}
          <div>
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
                    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
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

                {error && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#b91c1c",
                    }}
                  >
                    {error}
                  </span>
                )}
              </div>
            </section>

            {/* PAYMENT SECTION */}
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
                Payment (unlock full petition)
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#065f46",
                  marginBottom: 6,
                }}
              >
                Most Nigerian users pay <strong>around ₦1,000</strong>; users in
                other countries typically pay <strong>around ₦1,500</strong>.
                You can set the exact amount below.
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 6,
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

                {isPaid && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#047857",
                      fontWeight: 600,
                    }}
                  >
                    ✅ Payment unlocked for this session.
                  </span>
                )}
              </div>

              <p style={{ fontSize: "0.75rem", color: "#4b5563" }}>
                After payment, you&apos;ll unlock the full petition text, copy,
                email, and download tools.
              </p>
            </section>
          </div>

          {/* RIGHT: RESULT + ROUTING + DISCLAIMER (but full width now) */}
          <div>
            <section
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 14,
                border: "1px solid #e5e7eb",
                marginBottom: 12,
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

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    style={{
                      ...buttonSecondary,
                      ...(canUseTools ? {} : disabledBtn),
                    }}
                    disabled={!canUseTools}
                    onClick={handleCopy}
                  >
                    📋 Copy
                  </button>
                  <button
                    style={{
                      ...buttonSecondary,
                      ...(canUseTools ? {} : disabledBtn),
                    }}
                    disabled={!canUseTools}
                    onClick={handleEmail}
                  >
                    ✉️ Email
                  </button>
                  <button
                    style={{
                      ...buttonSecondary,
                      ...(canUseTools ? {} : disabledBtn),
                    }}
                    disabled={!canUseTools}
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
                  minHeight: 220,
                  maxHeight: 460,
                  overflow: "auto",
                }}
              >
                {petitionText ? (
                  <span>{displayPetition}</span>
                ) : (
                  <span style={{ color: "#9ca3af" }}>
                    Your SAN-grade petition will appear here after you click{" "}
                    <strong>“Generate Petition”</strong> and confirm the routing.
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
                marginBottom: 10,
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
                  the <strong>most appropriate primary institution</strong>, any{" "}
                  <strong>supervising regulators</strong>, plus key watchdogs
                  like PCC and NHRC. You will see and confirm this in a routing
                  preview modal before the petition is created.
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

            {/* BOTTOM MOVING DISCLAIMER STRIP */}
            <div
              style={{
                background: "#fefce8",
                borderRadius: 999,
                border: "1px solid #facc15",
                padding: "4px 10px",
                fontSize: "0.75rem",
                color: "#854d0e",
              }}
              className="pd-marquee"
            >
              <div className="pd-marquee-content">
                ⚠️ Disclaimer: PetitionDesk.com is not a law firm and does not
                provide legal advice. It is an AI-powered drafting tool that
                helps you generate professional petition letters based on the
                facts you provide. Using this app does not create a
                lawyer–client relationship. You remain responsible for
                reviewing, editing, and approving any petition before submitting
                it to any institution or court. For complex or urgent matters,
                please consult a qualified lawyer.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROUTING MODAL (PDPS-2.0) */}
      {showRoutingModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 12,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 700,
              width: "100%",
              padding: 16,
              boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
              border: "1px solid #e5e7eb",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#065f46",
                marginBottom: 8,
              }}
            >
              Confirm routing before generating petition
            </h2>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#4b5563",
                marginBottom: 10,
              }}
            >
              Please confirm that these institutions are correct. This helps
              ensure your petition goes to the right authority and watchdogs.
            </p>

            <div
              style={{
                fontSize: "0.8rem",
                color: "#111827",
                display: "grid",
                gap: 8,
              }}
            >
              {pendingPrimary && (
                <div
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: "#ecfdf5",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <strong>Primary institution:</strong>
                  <div>{pendingPrimary.org}</div>
                  {pendingPrimary.address && (
                    <div style={{ color: "#4b5563" }}>
                      {pendingPrimary.address}
                    </div>
                  )}
                  {pendingPrimary.email && (
                    <div style={{ color: "#047857" }}>
                      {pendingPrimary.email}
                    </div>
                  )}
                </div>
              )}

              {pendingThrough && (
                <div
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <strong>Through (supervising authority):</strong>
                  <div>{pendingThrough.org}</div>
                  {pendingThrough.address && (
                    <div style={{ color: "#4b5563" }}>
                      {pendingThrough.address}
                    </div>
                  )}
                  {pendingThrough.email && (
                    <div style={{ color: "#047857" }}>
                      {pendingThrough.email}
                    </div>
                  )}
                </div>
              )}

              {pendingCcList && pendingCcList.length > 0 && (
                <div
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <strong>CC (watchdogs / other bodies):</strong>
                  <ul
                    style={{
                      paddingLeft: "1rem",
                      marginTop: 4,
                      marginBottom: 0,
                    }}
                  >
                    {pendingCcList.map((cc, idx) => (
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

              <div
                style={{
                  marginTop: 4,
                  padding: 8,
                  borderRadius: 8,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <strong>Short summary of your description:</strong>
                <div style={{ color: "#4b5563", marginTop: 2 }}>
                  {description
                    ? description.slice(0, 260) +
                      (description.length > 260 ? "..." : "")
                    : "No description text found."}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
                marginTop: 14,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleCancelRouting}
                style={{
                  ...buttonSecondary,
                  backgroundColor: "#ffffff",
                }}
              >
                Cancel / Adjust
              </button>
              <button
                onClick={handleConfirmRouting}
                style={buttonPrimary}
              >
                ✅ Confirm & Generate Petition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
