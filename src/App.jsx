import React, { useState } from "react";

const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

function App() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [countryCode, setCountryCode] = useState("NG"); // NG = Nigeria, others = rest of the world

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [petitionText, setPetitionText] = useState("");
  const [locked, setLocked] = useState(true); // true = preview mode
  const [hasPaid, setHasPaid] = useState(false);

  const [routing, setRouting] = useState({
    primaryInstitution: null,
    throughInstitution: null,
    ccList: [],
  });

  const [error, setError] = useState("");

  const amountNGN = countryCode === "NG" ? 1000 : 1500;

  // Collect all emails from routing (only non-empty)
  const allEmails = [
    routing.primaryInstitution?.email,
    routing.throughInstitution?.email,
    ...(routing.ccList || []).map((c) => c.email),
  ].filter((e) => e && e.includes("@"));

  async function handleGeneratePetition() {
    setError("");
    if (!description.trim()) {
      setError("Please enter your complaint description.");
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
          hasPaid, // if true, backend sends full; if false, preview
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate petition.");
        setPetitionText("");
        return;
      }

      setPetitionText(data.petitionText || "");
      setLocked(data.locked !== false); // default true
      setRouting({
        primaryInstitution: data.primaryInstitution || null,
        throughInstitution: data.throughInstitution || null,
        ccList: data.ccList || [],
      });
    } catch (err) {
      console.error(err);
      setError("Network error while generating petition.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    setError("");

    if (!email.trim() || !fullName.trim()) {
      setError("Please enter your full name and email before payment.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter your complaint description before payment.");
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          description,
          countryCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.paymentLink) {
        console.error("Payment init failed:", data);
        setError(data.error || "Unable to start payment.");
        return;
      }

      // Open Flutterwave payment page
      window.location.href = data.paymentLink;
    } catch (err) {
      console.error(err);
      setError("Network error while initiating payment.");
    } finally {
      setPaymentLoading(false);
    }
  }

  function handleMarkPaidAndRegenerate() {
    // User clicks this after successful payment redirect
    setHasPaid(true);
    handleGeneratePetition();
  }

  async function handleCopyPetition() {
    if (!navigator.clipboard) {
      setError("Clipboard not available on this device.");
      return;
    }
    try {
      await navigator.clipboard.writeText(petitionText || "");
      alert("Petition text copied successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to copy petition text.");
    }
  }

  async function handleCopyEmails() {
    if (!navigator.clipboard) {
      setError("Clipboard not available on this device.");
      return;
    }
    if (!allEmails.length) {
      setError("No valid email addresses to copy.");
      return;
    }
    try {
      const text = allEmails.join(", ");
      await navigator.clipboard.writeText(text);
      alert("Email addresses copied successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to copy email addresses.");
    }
  }

  function handleOpenEmailClient() {
    if (!allEmails.length) {
      setError("No valid email addresses available.");
      return;
    }

    const toEmail =
      routing.primaryInstitution?.email || allEmails[0] || "";
    const ccEmails = allEmails.filter((e) => e !== toEmail);

    const subject = encodeURIComponent(
      "Petition from PetitionDesk – JusticeBot"
    );
    const body = encodeURIComponent(
      petitionText || "Please paste your petition text here."
    );

    let mailto = `mailto:${toEmail}?subject=${subject}`;
    if (ccEmails.length) {
      mailto += `&cc=${encodeURIComponent(ccEmails.join(","))}`;
    }
    mailto += `&body=${body}`;

    window.location.href = mailto;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e5e7eb",
        padding: "16px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <header style={{ marginBottom: "24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "700" }}>
            PetitionDesk / JusticeBot
          </h1>
          <p style={{ marginTop: "8px", color: "#9ca3af" }}>
            Automatic petition drafting + smart routing to the right authorities.
          </p>
        </header>

        {/* LAYOUT: LEFT FORM / RIGHT PETITION */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
          }}
        >
          {/* LEFT PANEL – INPUT FORM & PAYMENT */}
          <section
            style={{
              background: "#020617",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #1f2937",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>
              1. Your Details
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                style={inputStyle}
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                style={inputStyle}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                style={inputStyle}
              />
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address (e.g. House no, street, area)"
                style={inputStyle}
              />

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <label
                  style={{
                    fontSize: "0.85rem",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <input
                    type="radio"
                    checked={countryCode === "NG"}
                    onChange={() => setCountryCode("NG")}
                  />
                  I am in Nigeria (₦1000)
                </label>
                <label
                  style={{
                    fontSize: "0.85rem",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <input
                    type="radio"
                    checked={countryCode !== "NG"}
                    onChange={() => setCountryCode("OTHER")}
                  />
                  Outside Nigeria (₦1500)
                </label>
              </div>
            </div>

            <h2
              style={{
                fontSize: "1.1rem",
                marginTop: "16px",
                marginBottom: "8px",
              }}
            >
              2. Describe Your Complaint
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what happened. Include dates, amounts, names of institutions, steps you have already taken, and what you want them to do."
              rows={7}
              style={{
                ...inputStyle,
                resize: "vertical",
                lineHeight: "1.4",
              }}
            />

            {/* ACTION BUTTONS */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={handleGeneratePetition}
                disabled={loading}
                style={{
                  ...buttonPrimary,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Generating petition..." : "Generate Petition (Preview)"}
              </button>

              <button
                onClick={handlePay}
                disabled={paymentLoading}
                style={{
                  ...buttonSecondary,
                  opacity: paymentLoading ? 0.7 : 1,
                }}
              >
                {paymentLoading
                  ? "Connecting to payment..."
                  : `Pay & Unlock Full Petition (₦${amountNGN})`}
              </button>

              <button
                onClick={handleMarkPaidAndRegenerate}
                style={{
                  ...buttonGhost,
                }}
              >
                I have completed payment – unlock my full petition
              </button>
            </div>

            {error && (
              <p
                style={{
                  marginTop: "10px",
                  color: "#f97373",
                  fontSize: "0.85rem",
                }}
              >
                {error}
              </p>
            )}
          </section>

          {/* RIGHT PANEL – PETITION + ROUTING */}
          <section
            style={{
              background: "#020617",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid #1f2937",
              minHeight: "320px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <h2 style={{ fontSize: "1.05rem" }}>3. Generated Petition</h2>
              <span
                style={{
                  fontSize: "0.8rem",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  border: "1px solid #374151",
                  color: locked ? "#fbbf24" : "#22c55e",
                }}
              >
                {locked ? "PREVIEW ONLY – PAY TO UNLOCK" : "FULL VERSION UNLOCKED"}
              </span>
            </div>

            <div
              style={{
                position: "relative",
                background: "#020617",
                borderRadius: "8px",
                border: "1px solid #1f2937",
                padding: "12px",
                flex: "1",
                overflowY: "auto",
              }}
            >
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  fontSize: "0.85rem",
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  margin: 0,
                  userSelect: locked ? "none" : "text",
                }}
              >
                {petitionText ||
                  "Your drafted petition will appear here after you click 'Generate Petition'."}
              </pre>

              {locked && petitionText && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, rgba(15,23,42,0), rgba(15,23,42,0.95))",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            {/* PETITION ACTIONS */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <button
                onClick={handleCopyPetition}
                disabled={locked || !petitionText}
                style={{
                  ...buttonSmall,
                  opacity: locked || !petitionText ? 0.5 : 1,
                }}
              >
                Copy Petition Text
              </button>
              <button
                onClick={handleCopyEmails}
                disabled={locked || !allEmails.length}
                style={{
                  ...buttonSmall,
                  opacity: locked || !allEmails.length ? 0.5 : 1,
                }}
              >
                Copy All Email Addresses
              </button>
              <button
                onClick={handleOpenEmailClient}
                disabled={locked || !petitionText || !allEmails.length}
                style={{
                  ...buttonSmall,
                  opacity: locked || !petitionText || !allEmails.length ? 0.5 : 1,
                }}
              >
                Open in Email App
              </button>
            </div>

            {/* ROUTING SUMMARY */}
            <div
              style={{
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: "1px dashed #1f2937",
                fontSize: "0.8rem",
                color: "#9ca3af",
              }}
            >
              <h3 style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
                4. Routing Summary
              </h3>
              {routing.primaryInstitution ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>
                    <strong>Primary:</strong>{" "}
                    {routing.primaryInstitution.org || "N/A"}
                    {routing.primaryInstitution.email
                      ? `  |  ${routing.primaryInstitution.email}`
                      : ""}
                  </div>
                  {routing.throughInstitution && (
                    <div>
                      <strong>Through:</strong>{" "}
                      {routing.throughInstitution.org || "N/A"}
                      {routing.throughInstitution.email
                        ? `  |  ${routing.throughInstitution.email}`
                        : ""}
                    </div>
                  )}
                  {routing.ccList && routing.ccList.length > 0 && (
                    <div>
                      <strong>CC:</strong>
                      <ul style={{ margin: "4px 0 0 14px", padding: 0 }}>
                        {routing.ccList.map((c, idx) => (
                          <li key={idx} style={{ marginBottom: "2px" }}>
                            {c.org}
                            {c.email ? `  |  ${c.email}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {!routing.ccList?.length && <div>No CC institutions detected.</div>}
                </div>
              ) : (
                <p>No routing yet. Generate a petition to see target institutions.</p>
              )}
            </div>
          </section>
        </div>

        <footer
          style={{
            marginTop: "20px",
            fontSize: "0.75rem",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          Built for serious petitions. Always review before sending.
        </footer>
      </div>
    </div>
  );
}

// Simple inline styles
const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "8px",
  border: "1px solid #1f2937",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.85rem",
  outline: "none",
};

const buttonPrimary = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#16a34a",
  color: "#f9fafb",
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
};

const buttonSecondary = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #fbbf24",
  background: "#1f2937",
  color: "#fbbf24",
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
};

const buttonGhost = {
  width: "100%",
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px dashed #4b5563",
  background: "transparent",
  color: "#9ca3af",
  fontSize: "0.8rem",
  cursor: "pointer",
};

const buttonSmall = {
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid #4b5563",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.8rem",
  cursor: "pointer",
};

export default App;
