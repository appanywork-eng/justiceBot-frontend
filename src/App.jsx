// src/App.jsx
import React, { useState, useEffect, useRef } from "react";

const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

function App() {
  // --- form fields ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  // --- petition + routing ---
  const [petitionText, setPetitionText] = useState("");
  const [primaryInstitution, setPrimaryInstitution] = useState(null);
  const [throughInstitution, setThroughInstitution] = useState(null);
  const [ccList, setCcList] = useState([]);

  // --- UI state ---
  const [loading, setLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(1000);
  const [isMobileLayout, setIsMobileLayout] = useState(
    typeof window !== "undefined" ? window.innerWidth < 900 : true
  );

  const hasResult = !!petitionText;

  // --- voice-to-text state ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordTimerRef = useRef(null);

  // --- responsive layout ---
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setIsMobileLayout(window.innerWidth < 900);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  // ----------------- PETITION GENERATION -----------------
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

  // ----------------- COPY / EMAIL / DOWNLOAD -----------------
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

  // ----------------- PAYMENT -----------------
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

  // ----------------- VOICE TO TEXT (UNLIMITED) -----------------
  const uploadAudio = async (blob) => {
    try {
      const formData = new FormData();
      formData.append("file", blob, "speech.webm");

      const res = await fetch(`${API_BASE}/speech`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Speech error:", data);
        alert(
          data?.error ||
            "Unable to transcribe audio. Please try again or type manually."
        );
        return;
      }

      const text = data.text || "";
      if (text.trim()) {
        setDescription((prev) =>
          prev ? `${prev.trim()}\n\n${text.trim()}` : text.trim()
        );
      }
    } catch (err) {
      console.error("Speech network error:", err);
      alert("Network error while sending audio. Please try again.");
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your device does not support microphone recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
        setRecordSeconds(0);

        if (chunks.length === 0) return;

        const blob = new Blob(chunks, { type: "audio/webm" });
        await uploadAudio(blob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(); // unlimited until stop
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert(
        "Unable to access your microphone. Please check permissions and try again."
      );
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.stop();
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatSeconds = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ----------------- STYLES -----------------
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
    padding: isMobileLayout ? "16px" : "20px",
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

  // ----------------- RENDER -----------------
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* HEADER */}
        <header style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              flexDirection: isMobileLayout ? "column" : "row",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: isMobileLayout ? "1.5rem" : "1.8rem",
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
                  banks, police, telecoms, government, human rights and more.
                </strong>
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
                maxWidth: isMobileLayout ? "100%" : 380,
              }}
            >
              ✉️{" "}
              <strong>
                Write SAN-grade petitions and send them directly by email for
                just ₦1,000–₦1,500 per petition
              </strong>{" "}
              (amount depends on your country / location).
            </div>
          </div>
        </header>

        {/* BODY LAYOUT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobileLayout
              ? "minmax(0, 1fr)"
              : "minmax(0, 1.1fr) minmax(0, 1fr)",
            gap: 16,
          }}
        >
          {/* LEFT COLUMN */}
          <div>
            {/* Complainant */}
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

            {/* Complaint + Voice */}
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
                placeholder="Example: On 7 December 2025, officers attached to XYZ Division unlawfully arrested me at..."
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

                {/* Voice recorder pill */}
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: "999px",
                    border: isRecording
                      ? "1px solid #b91c1c"
                      : "1px solid #9ca3af",
                    backgroundColor: isRecording ? "#fee2e2" : "#ffffff",
                    padding: "6px 10px",
                    fontSize: "0.8rem",
                    color: "#111827",
                  }}
                >
                  <span role="img" aria-label="mic">
                    🎙️
                  </span>
                  {isRecording
                    ? `Recording... ${formatSeconds(recordSeconds)}`
                    : "Tap to speak (Pidgin / English)"}
                </button>

                {error && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "#b91c1c",
                      flex: 1,
                    }}
                  >
                    {error}
                  </span>
                )}
              </div>
            </section>

            {/* Payment */}
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
                Payment (unlock full sending power)
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
                  marginBottom: 10,
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
                  {payLoading ? "Connecting to Flutterwave..." : "Pay with Flutterwave"}
                </button>
              </div>

              <p style={{ fontSize: "0.75rem", color: "#4b5563" }}>
                ✅ You can still review and edit your petition text here. 💡
                After payment, you’ll be able to confidently send it by email to
                the correct institutions.
              </p>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Generated Petition */}
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
                  style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                >
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

            {/* Routing summary */}
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

              {!primaryInstitution &&
              !throughInstitution &&
              (!ccList || ccList.length === 0) ? (
                <p
                  style={{ fontSize: "0.8rem", color: "#6b7280" }}
                >
                  Once you generate a petition, PetitionDesk will try to route
                  it to the <strong>most appropriate primary institution</strong>,
                  any <strong>supervising regulators</strong>, plus key
                  watchdogs like PCC and NHRC.
                </p>
              ) : (
                <div
                  style={{ fontSize: "0.8rem", color: "#111827" }}
                >
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
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Disclaimer */}
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
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "#854d0e",
                  lineHeight: 1.4,
                }}
              >
                PetitionDesk.com is <strong>not a law firm</strong> and does not
                provide legal advice. It is an AI-powered drafting tool that
                helps you generate professional petition letters based on the
                facts you provide. Using this app does not create a
                lawyer–client relationship. You remain responsible for
                reviewing, editing, and approving any petition before you submit
                it to any institution or court. For complex or urgent matters,
                please consult a qualified lawyer.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
