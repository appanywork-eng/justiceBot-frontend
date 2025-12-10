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

  const [amount, setAmount] = useState(1000);
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const hasResult = !!petitionText;

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.pathname.includes("payment-complete")) {
        const status = (url.searchParams.get("status") || "").toLowerCase();
        if (!status || status === "successful" || status === "completed") {
          setPaymentUnlocked(true);
          alert("Payment confirmed. Full tools unlocked.");
        }
      }
    } catch (err) {}
  }, []);

  const handleGenerate = async () => {
    setError("");
    setPetitionText("");
    setPrimaryInstitution(null);
    setThroughInstitution(null);
    setCcList([]);

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
      if (!res.ok) {
        setError(data?.error || "Failed to generate.");
      } else {
        setPetitionText(data.petitionText || "");
        setPrimaryInstitution(data.primaryInstitution || null);
        setThroughInstitution(data.throughInstitution || null);
        setCcList(Array.isArray(data.ccList) ? data.ccList : []);
      }
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const assertPaid = () => {
    if (!paymentUnlocked) {
      alert("Please pay to unlock these tools.");
      return false;
    }
    return true;
  };

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
      x.email.split(/[,;]/).map((e) => e.trim()).forEach((e) => emails.add(e));
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

  const handlePay = async () => {
    if (!email || !fullName) {
      setError("Enter your name & email before payment.");
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
          description: description || "PetitionDesk payment",
        }),
      });
      const data = await res.json();
      if (data.paymentLink) window.location.href = data.paymentLink;
      else setError("Payment failed.");
    } catch {
      setError("Payment error.");
    } finally {
      setPayLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported on this browser.");
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
      if (combined)
        setDescription((prev) => (prev ? prev + "\n" + combined : combined));
    };

    recog.onend = () => setIsRecording(false);
    recog.start();
    setIsRecording(true);

    setTimeout(() => {
      if (recognitionRef.current && isRecording)
        recognitionRef.current.stop();
    }, 90000);
  };

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
  };

  const input = {
    width: "100%",
    padding: "8px 10px",
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

  return (
    <div style={layoutStyle}>
      {/* TOP SCROLLING DISCLAIMER */}
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
        legal advice. It is an AI-powered drafting tool. Always review your
        petition before sending.
      </marquee>

      {/* TITLE */}
      <h1 style={{ color: "#065f46", marginBottom: 4 }}>PetitionDesk.com</h1>
      <p style={{ marginTop: 0, marginBottom: 16 }}>
        AI No.1 petition writer for complaints and redress.
      </p>

      {/* BOX 1 */}
      <div style={boxStyle}>
        <h3>Enter your details</h3>

        <input
          style={input}
          placeholder="Full name"
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
        />

        <button style={btn} onClick={handleGenerate}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        <button
          style={{ ...thinBtn, background: isRecording ? "#b91c1c" : "#065f46" }}
          onClick={handleMicClick}
        >
          {isRecording ? "Stop Recording" : "Voice to Text"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      {/* BOX 2 – ONLY SHOW AFTER GENERATION */}
      {hasResult && (
        <div style={boxStyle}>
          <h3>Your petition</h3>

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

          {/* TOOLS */}
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
                opacity: paymentUnlocked ? 1 : 0.4,
                marginLeft: 6,
              }}
              disabled={!paymentUnlocked}
              onClick={handleEmail}
            >
              Email
            </button>

            <button
              style={{
                ...thinBtn,
                opacity: paymentUnlocked ? 1 : 0.4,
                marginLeft: 6,
              }}
              disabled={!paymentUnlocked}
              onClick={handleDownload}
            >
              Download
            </button>
          </div>

          {/* PAYMENT */}
          <div style={{ marginTop: 16 }}>
            <h4>Unlock tools</h4>
            <input
              type="number"
              style={{ ...input, width: 120 }}
              min={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />

            <button style={btn} onClick={handlePay}>
              {payLoading ? "Connecting..." : "Pay"}
            </button>
          </div>

          {/* ROUTING */}
          <div style={{ marginTop: 16 }}>
            <h4>Routing</h4>
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
            {ccList && ccList.length > 0 && (
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

      {/* BOTTOM MOVING TEXT */}
      <marquee
        style={{
          marginTop: 20,
          background: "#e6fff1",
          padding: 8,
          color: "#065f46",
          fontSize: "0.85rem",
        }}
      >
        Write professional-grade petitions and send them directly by email for
        ₦1,000 – ₦1,500 depending on your location.
      </marquee>
    </div>
  );
}

export default App;
