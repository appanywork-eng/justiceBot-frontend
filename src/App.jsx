import React, { useState, useEffect, useRef } from "react";

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

  const [amount, setAmount] = useState(1000); // default ₦1000
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const hasResult = !!petitionText;

  // ----------------------------------------------------
  // Detect payment-complete redirect from Flutterwave
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.pathname.includes("payment-complete")) {
        const status = (url.searchParams.get("status") || "").toLowerCase();
        if (!status || status === "successful" || status === "completed") {
          setPaymentUnlocked(true);
          alert(
            "Payment confirmed. You can now copy, download and email your petition."
          );
        }
      }
    } catch (err) {
      console.error("Payment detection error:", err);
    }
  }, []);

  // ----------------------------------------------------
  // Generate Petition
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // Clipboard / Download / Email – LOCKED until payment
  // ----------------------------------------------------
  const assertPaid = () => {
    if (!paymentUnlocked) {
      alert(
        "Please complete payment to unlock copy, download and email sending for this petition."
      );
      return false;
    }
    return true;
  };

  const handleCopy = async () => {
    if (!petitionText) return;
    if (!assertPaid()) return;

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
    if (!assertPaid()) return;

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
    if (!to) {
      alert(
        "No official email addresses were detected. You can still copy the petition and paste it manually."
      );
      return;
    }

    const subject = encodeURIComponent("Formal Petition");
    const body = encodeURIComponent(petitionText);
    const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const handleDownload = () => {
    if (!petitionText) return;
    if (!assertPaid()) return;

    const blob = new Blob([petitionText], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "petition.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------
  // Payment
  // ----------------------------------------------------
  const handlePay = async () => {
    setError("");
    if (!email || !fullName) {
      setError("Please enter your full name and email before payment.");
      return;
    }
    if (!amount || amount < 500) {
      setError("Please enter a valid payment amount (at least ₦500).");
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

  // ----------------------------------------------------
  // Voice to Text (90s, en-NG, better handling)
  // ----------------------------------------------------
  const handleMicClick = () => {
    // Stop recording if already active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported on this browser. Please type your complaint manually."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-NG"; // Nigerian English
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      const combined = (finalTranscript || interim).trim();
      if (!combined) return;

      setDescription((prev) => {
        const base = prev.trim();
        if (!base) return combined;
        return base + "\n" + combined;
      });
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);

    // Hard stop after ~90 seconds
    setTimeout(() => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    }, 90000);
  };

  // ----------------------------------------------------
  // Styles (Option A – clean professional)
  // ----------------------------------------------------
  const pageStyle = {
    minHeight: "100vh",
    background: "linear-gradient(to bottom, #ffffff, #ecfdf3)",
    padding: "16px",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    padding: "16px",
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
    opacity: 0.5,
    cursor: "not-allowed",
  };

  const micButtonStyle = {
    backgroundColor: isRecording ? "#b91c1c" : "#047857",
    color: "#fff",
    borderRadius: "999px",
    border: "none",
    padding: "8px 10px",
    fontSize: "0.8rem",
    cursor: "pointer",
  };

  // Buttons disabled if no result OR not paid
  const toolsDisabled = !hasResult || !paymentUnlocked;

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* HEADER */}
        <header style={{ marginBottom: 16 }}>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "#065f46",
              marginBottom: 4,
            }}
          >
            PetitionDesk.com
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#374151", marginBottom: 12 }}>
            AI-powered petition writer for{" "}
            <strong>banks, police, telecoms, government, human rights</strong>{" "}
            and more.
          </p>

          {/* Top disclaimer – always visible */}
          <div
            style={{
              background: "#fefce8",
              borderRadius: 12,
              padding: 10,
              border: "1px solid #facc15",
              marginBottom: 8,
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "#854d0e",
                lineHeight: 1.4,
              }}
            >
              <strong>Disclaimer:</strong> PetitionDesk.com is{" "}
              <strong>not a law firm</strong> and does not provide legal
              advice. It is an AI-powered drafting tool that helps you generate
              professional petition letters based on the facts you provide.
              Using this app does not create a lawyer–client relationship. You
              remain responsible for reviewing, editing, and approving any
              petition before you submit it to any institution or court. For
              complex or urgent matters, please consult a qualified lawyer.
            </p>
          </div>

          {/* Static banner */}
          <div
            style={{
              background: "#ecfdf3",
              borderRadius: "999px",
              padding: "8px 14px",
              border: "1px solid #bbf7d0",
              fontSize: "0.8rem",
              color: "#065f46",
              maxWidth: 460,
            }}
          >
            ✉️{" "}
            <strong>
              Write SAN-grade petitions and send them directly by email for just
              ₦1,000–₦1,500 per petition
            </strong>{" "}
            (amount depends on your country / location).
          </div>
        </header>

        {/* BODY LAYOUT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: 20,
          }}
        >
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
                    placeholder="e.g. Ngozi Yemisi Musa"
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

            {/* Complaint description + mic */}
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
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

                  <button
                    type="button"
                    style={micButtonStyle}
                    onClick={handleMicClick}
                  >
                    {isRecording ? "Stop recording" : "Speak (voice to text)"}
                  </button>
                </div>

                {error && (
                  <span
                    style={{ fontSize: "0.8rem", color: "#b91c1c" }}
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
                Payment (unlock full petition tools)
              </h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#065f46",
                  marginBottom: 6,
                }}
              >
                Pay once per petition to support the platform and help us keep
                improving access to justice. Most Nigerian users pay{" "}
                <strong>around ₦1,000</strong>; users in other countries
                typically pay <strong>around ₦1,500</strong>. You can set the
                exact amount below.
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
                    style={{ ...inputStyle, width: 130 }}
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
                ✅ You can still review and edit your petition text here. <br />
                💡 After payment is completed and you return to PetitionDesk,
                the <strong>Copy</strong>, <strong>Download</strong> and{" "}
                <strong>Email</strong> tools will be unlocked for this petition.
              </p>
            </section>
          </div>

          {/* RIGHT: Petition + routing */}
          <div>
            {/* Generated petition */}
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
                      ...(toolsDisabled ? disabledBtn : {}),
                    }}
                    disabled={toolsDisabled}
                    onClick={handleCopy}
                  >
                    📋 Copy
                  </button>
                  <button
                    style={{
                      ...buttonSecondary,
                      ...(toolsDisabled ? disabledBtn : {}),
                    }}
                    disabled={toolsDisabled}
                    onClick={handleEmail}
                  >
                    ✉️ Email
                  </button>
                  <button
                    style={{
                      ...buttonSecondary,
                      ...(toolsDisabled ? disabledBtn : {}),
                    }}
                    disabled={toolsDisabled}
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

            {/* Routing summary */}
            <section
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: 12,
                border: "1px solid #e5e7eb",
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
                  Once you generate a petition, PetitionDesk will{" "}
                  <strong>route it to the most appropriate primary institution</strong>, any{" "}
                  <strong>supervising regulators</strong>, plus key watchdogs
                  like PCC and NHRC.
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
                    </div>
                  )}

                  {ccList && ccList.length > 0 && (
                    <div>
                      <strong>CC:</strong>
                      <ul
                        style={{
                          paddingLeft: "1rem",
                          marginTop: 4,
                        }}
                      >
                        {ccList.map((cc, idx) => (
                          <li key={idx} style={{ marginBottom: 2 }}>
                            <span>{cc.org}</span>
                            {cc.address && (
                              <span style={{ color: "#4b5563" }}>
                                {" "}
                                – {cc.address}
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

        {/* Bottom moving text (payment info ticker) */}
        <div style={{ marginTop: 14 }}>
          <marquee
            behavior="scroll"
            direction="left"
            scrollAmount="4"
            style={{
              fontSize: "0.8rem",
              color: "#065f46",
              background: "#ecfdf3",
              borderRadius: 999,
              padding: "6px 10px",
              border: "1px solid #bbf7d0",
            }}
          >
            ✉️ Write SAN-grade petitions and send them directly by email to
            the right institutions for just ₦1,000–₦1,500 per petition (amount
            depends on your country / location). PetitionDesk routes your
            petition to the proper authorities and watchdogs – PCC, NHRC and
            others – to make sure your voice is heard.
          </marquee>
        </div>
      </div>
    </div>
  );
}

export default App;
