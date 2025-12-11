import React, { useState, useEffect, useRef } from "react";

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

  // Payment unlock strictly tied to one petition
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);
  const [petitionId, setPetitionId] = useState(null);

  const [amount, setAmount] = useState(1000);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const hasResult = !!petitionText;

  // -------------------------------------------------------------
  // 1️⃣ AFTER PAYMENT REDIRECT → RESTORE petitionId + unlock tools
  // -------------------------------------------------------------
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const paid = url.searchParams.get("status");
      const pid = url.searchParams.get("petitionId");

      if (paid && pid) {
        // Unlock ONLY this petition
        setPaymentUnlocked(true);
        setPetitionId(pid);

        alert("Payment confirmed. Tools unlocked for this petition.");
      }
    } catch (err) {}
  }, []);

  // -------------------------------------------------------------
  // 2️⃣ GENERATE PETITION → backend returns a petitionId
  // -------------------------------------------------------------
  const handleGenerate = async () => {
    setError("");
    setPaymentUnlocked(false);
    setPetitionId(null);

    if (!description.trim()) {
      setError("Please describe your complaint.");
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

      if (!data.ok) {
        setError(data.error || "Failed to generate.");
      } else {
        setPetitionText(data.petitionText || "");
        setPrimaryInstitution(data.primaryInstitution || null);
        setThroughInstitution(data.throughInstitution || null);
        setCcList(Array.isArray(data.ccList) ? data.ccList : []);
        setPetitionId(data.petitionId); // 🔥 SAVE petitionId returned by backend
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };
// -------------------------------------------------------------
  // 3️⃣ HELPER — RESTRICT TOOLS UNLESS PAID FOR THIS petitionId
  // -------------------------------------------------------------
  const assertPaid = () => {
    if (!paymentUnlocked) {
      alert("Please pay to unlock the tools for this petition.");
      return false;
    }
    return true;
  };

  // -------------------------------------------------------------
  // 4️⃣ COPY / EMAIL / DOWNLOAD
  // -------------------------------------------------------------
  const handleCopy = async () => {
    if (!assertPaid()) return;
    try {
      await navigator.clipboard.writeText(petitionText);
      alert("Copied.");
    } catch {}
  };

  const handleEmail = () => {
    if (!assertPaid()) return;

    const emails = new Set();

    const add = (x) => {
      if (!x || !x.email) return;
      x.email.split(/[,;]/).forEach((e) => emails.add(e.trim()));
    };

    add(primaryInstitution);
    add(throughInstitution);
    ccList.forEach(add);

    const to = [...emails].join(",");
    const subject = encodeURIComponent("Formal Petition");
    const body = encodeURIComponent(petitionText);

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const handleDownload = () => {
    if (!assertPaid()) return;
    const blob = new Blob([petitionText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "petition.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // 5️⃣ PAYMENT — now sends petitionId to backend
  // -------------------------------------------------------------
  const handlePay = async () => {
    if (!email || !fullName) {
      setError("Enter your name & email before payment.");
      return;
    }

    if (!petitionId) {
      alert("Please generate a petition first.");
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
          petitionId, // 🔥 sent for per-petition unlocking
        }),
      });

      const data = await res.json();

      if (data.paymentLink) {
        window.location.href = data.paymentLink; // Flutterwave redirect
      } else {
        alert("Payment error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Payment failed.");
    } finally {
      setPayLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 6️⃣ VOICE-TO-TEXT
  // -------------------------------------------------------------
  const handleMicClick = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported on this device.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "en-NG";
    recog.continuous = true;
    recog.interimResults = true;
    recognitionRef.current = recog;

    let finalTranscript = "";

    recog.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + " ";
        else interim += t;
      }

      const combined = (finalTranscript || interim).trim();
      if (combined) {
        setDescription((prev) => (prev ? prev + "\n" + combined : combined));
      }
    };

    recog.onend = () => setIsRecording(false);
    recog.start();
    setIsRecording(true);

    // Auto-stop after 90 seconds
    setTimeout(() => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    }, 90000);
  };
// -------------------------------------------------------------
  // 7️⃣ UI STYLES (SIMPLE TWO-BOX LAYOUT)
  // -------------------------------------------------------------
  const layoutStyle = {
    maxWidth: 900,
    margin: "0 auto",
    padding: 16,
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const boxStyle = {
    padding: 12,
    marginBottom: 16,
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#ffffff",
  };

  const input = {
    width: "100%",
    padding: "10px 12px",
    fontSize: "0.95rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    marginBottom: 10,
  };

  const btn = {
    padding: "10px 16px",
    background: "#065f46",
    color: "#fff",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: "0.95rem",
    marginRight: 8,
  };

  const thinBtn = {
    padding: "6px 10px",
    background: "#065f46",
    color: "#fff",
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
  };

  // -------------------------------------------------------------
  // 8️⃣ RETURN — UI RENDER
  // -------------------------------------------------------------
  return (
    <div style={layoutStyle}>
      {/* TOP DISCLAIMER SCROLLER */}
      <marquee
        style={{
          background: "#fff8e1",
          padding: 8,
          color: "#7a5800",
          marginBottom: 10,
          fontSize: "0.85rem",
        }}
      >
        Disclaimer: PetitionDesk.com is not a law firm and does not provide
        legal advice. Always review your petition before sending. This tool
        generates professional-grade drafts ONLY.
      </marquee>

      {/* TITLE */}
      <h1 style={{ color: "#065f46", marginBottom: 4 }}>PetitionDesk.com</h1>
      <p style={{ marginTop: 0, marginBottom: 16 }}>
        AI No.1 petition writer for complaints and redress.
      </p>

      {/* ============================================================
          BOX 1 — USER INPUT / GENERATE
      ============================================================ */}
      <div style={boxStyle}>
        <h3>Enter your details</h3>

        <input
          style={input}
          placeholder="Full name (e.g. Ngozi Yemisi Musa)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          style={input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={input}
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          style={input}
          placeholder="Address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <textarea
          style={{ ...input, minHeight: 140 }}
          placeholder="Describe your complaint here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>

        <button style={btn} onClick={handleGenerate}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        <button
          style={{
            ...thinBtn,
            background: isRecording ? "#b91c1c" : "#065f46",
          }}
          onClick={handleMicClick}
        >
          {isRecording ? "Stop Recording" : "Voice to Text"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      {/* ============================================================
          BOX 2 — SHOW ONLY AFTER PETITION IS GENERATED
      ============================================================ */}
      {hasResult && (
        <div style={boxStyle}>
          <h3>Your Petition (Preview Only)</h3>

          {/* Petition display */}
          <div
            style={{
              whiteSpace: "pre-wrap",
              background: "#f9fafb",
              padding: 12,
              borderRadius: 8,
              minHeight: 120,
            }}
          >
            {petitionText}
          </div>

          {/* ACTION BUTTONS (LOCKED UNTIL PAYMENT FOR THIS PETITION) */}
          <div style={{ marginTop: 10 }}>
            <button
              style={{
                ...thinBtn,
                opacity: paymentUnlocked ? 1 : 0.4,
              }}
              disabled={!paymentUnlocked}
              onClick={handleCopy}
            >
              Copy
            </button>

            <button
              style={{
                ...thinBtn,
                marginLeft: 6,
                opacity: paymentUnlocked ? 1 : 0.4,
              }}
              disabled={!paymentUnlocked}
              onClick={handleEmail}
            >
              Email
            </button>

            <button
              style={{
                ...thinBtn,
                marginLeft: 6,
                opacity: paymentUnlocked ? 1 : 0.4,
              }}
              disabled={!paymentUnlocked}
              onClick={handleDownload}
            >
              Download
            </button>
          </div>

          {/* PAYMENT BOX — PER PETITION UNLOCK */}
          <div style={{ marginTop: 16 }}>
            <h4>Unlock Tools</h4>

            <input
              type="number"
              style={{ ...input, width: 120 }}
              min={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />

            <button style={btn} onClick={handlePay}>
              {payLoading ? "Connecting..." : "Pay ₦" + amount}
            </button>
          </div>

          {/* ROUTING INFORMATION */}
          <div style={{ marginTop: 16 }}>
            <h4>Routing Summary</h4>

            {primaryInstitution && (
              <p>
                <strong>Primary:</strong> {primaryInstitution.org}
              </p>
            )}

            {throughInstitution && (
              <p>
                <strong>Through:</strong> {throughInstitution.org}
              </p>
            )}

            {ccList?.length > 0 && (
              <div>
                <strong>CC:</strong>
                <ul>
                  {ccList.map((cc, i) => (
                    <li key={i}>{cc.org}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM SCROLLING PAYMENT NOTICE */}
      <marquee
        style={{
          background: "#e6fff1",
          padding: 8,
          color: "#065f46",
          fontSize: "0.85rem",
          marginTop: 20,
        }}
      >
        Write professional-grade petitions and unlock email/copy/download for
        ₦1,000 – ₦1,500 depending on location. Payment unlocks **only the
        petition you generated**, not unlimited access.
      </marquee>
    </div>
  );
}

export default App;
