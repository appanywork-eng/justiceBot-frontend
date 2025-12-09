import { useState } from "react";
import jsPDF from "jspdf";
import { generatePetition } from "./api.js";

export default function App() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    description: "",
    role: "victim",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [edited, setEdited] = useState("");
  const [meta, setMeta] = useState({
    recipientInstitution: null,
    primaryInstitution: null,
    throughInstitution: null,
    ccList: [],
  });

  const [paid, setPaid] = useState(false); // 🔐 PAYMENT LOCK

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // -------------------------------------------------------------
  // VOICE TO TEXT
  // -------------------------------------------------------------
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice to text not supported on this device");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-NG";
    recognition.onresult = (event) => {
      setForm((prev) => ({
        ...prev,
        description: prev.description
          ? prev.description + " " + event.results[0][0].transcript
          : event.results[0][0].transcript,
      }));
    };
    recognition.start();
  }

  // -------------------------------------------------------------
  // SUBMIT FORM → GENERATE PETITION
  // -------------------------------------------------------------
  async function submitForm() {
    if (!form.fullName || !form.description) {
      alert("Full name and complaint description are required.");
      return;
    }

    setLoading(true);
    const response = await generatePetition(form);
    setLoading(false);

    if (response.error) {
      alert(response.error);
      return;
    }

    setResult(response.petitionText);
    setEdited(response.petitionText);

    setMeta({
      recipientInstitution: response.recipientInstitution || null,
      primaryInstitution: response.primaryInstitution || null,
      throughInstitution: response.throughInstitution || null,
      ccList: Array.isArray(response.ccList) ? response.ccList : [],
    });
  }

  // -------------------------------------------------------------
  // COPY PETITION  (Locked until paid)
  // -------------------------------------------------------------
  function copyText() {
    if (!edited) return alert("Nothing to copy.");
    navigator.clipboard.writeText(edited);
    alert("Petition copied!");
  }

  // -------------------------------------------------------------
  // EMAIL PETITION  (Locked until paid)
  // -------------------------------------------------------------
  function sendEmail() {
    if (!edited) {
      alert("Generate the petition first.");
      return;
    }

    const allEmails = [];
    if (meta.recipientInstitution?.email)
      allEmails.push(meta.recipientInstitution.email);
    if (meta.primaryInstitution?.email)
      allEmails.push(meta.primaryInstitution.email);
    if (meta.throughInstitution?.email)
      allEmails.push(meta.throughInstitution.email);

    meta.ccList.forEach((i) => {
      if (i?.email) allEmails.push(i.email);
    });

    const unique = [...new Set(allEmails)].filter(Boolean);
    const to = unique[0] || "";
    const cc = unique.slice(1).join(",");

    let subject = `Petition from ${form.fullName}`;
    const found = edited
      .split("\n")
      .find((l) => l.trim().toUpperCase().startsWith("RE:"));
    if (found) subject = found.replace(/^RE:\s*/i, "").trim();

    let mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(edited)}`;

    if (cc) mailto += `&cc=${encodeURIComponent(cc)}`;

    window.location.href = mailto;
  }

  // -------------------------------------------------------------
  // PDF DOWNLOAD  (Locked until paid)
  // -------------------------------------------------------------
  function downloadPDF() {
    if (!edited) return alert("Generate a petition first.");

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(edited, width);

    doc.text(lines, margin, margin);
    doc.save("petition.pdf");
  }

  // -------------------------------------------------------------
  // PAYMENT — Flutterwave (Nigeria = 1000, Others = 1500)
  // -------------------------------------------------------------
  async function handlePay() {
    if (!edited) {
      alert("Generate a petition first.");
      return;
    }

    try {
      // 1️⃣ Detect user country from IP
      const geo = await fetch("https://api.flutterwave.com/v3/ip", {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_FLW_SECRET}` },
      }).then((r) => r.json());

      const country = geo?.data?.country || "NG";

      // 2️⃣ Amount logic
      const amount = country === "NG" ? 1000 : 1500;

      // 3️⃣ Create payment session on backend
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          email: form.email || "noemail@user.com",
          name: form.fullName,
          description: "PetitionDesk – AI Petition Payment",
        }),
      });

      const data = await res.json();
      const paymentLink =
        data?.link || data?.paymentLink || data?.data?.link;

      if (!paymentLink) {
        alert("Payment error. Try again.");
        return;
      }

      // Redirect to Flutterwave checkout
      window.location.href = paymentLink;

      // Unlock app after payment
      setPaid(true);

    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment error. Try again.");
    }
  }

  // -------------------------------------------------------------
  // UI + BUTTON LOCKS
  // -------------------------------------------------------------
  const block = () =>
    alert("Please make payment first before accessing this feature.");

  return (
    <div style={{ padding: "15px", fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center", marginBottom: "12px" }}>
        📝 PetitionDesk – AI Petition Writer
      </h2>

      {/* ROLE */}
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        style={inputStyle}
      >
        <option value="victim">I am the Victim</option>
        <option value="representative">Representative</option>
        <option value="witness">Witness</option>
        <option value="concerned_citizen">Concerned Citizen</option>
      </select>

      {/* INPUTS */}
      <input
        name="fullName"
        placeholder="Your Full Name"
        value={form.fullName}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="email"
        placeholder="Email (optional)"
        value={form.email}
        onChange={handleChange}
        style={inputStyle}
      />

      <input
        name="phone"
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={handleChange}
        style={inputStyle}
      />

      <textarea
        name="description"
        placeholder="Explain your complaint clearly..."
        value={form.description}
        onChange={handleChange}
        style={textareaStyle}
      />

      <button onClick={submitForm} style={buttonStyle}>
        {loading ? "Generating..." : "Generate Petition"}
      </button>

      <button onClick={startVoice} style={voiceButton}>
        🎤 Voice to Text
      </button>

      {/* RESULT */}
      {result && (
        <div style={resultBox}>
          <h3>Generated Petition</h3>

          {/* Editable petition */}
          <textarea
            style={editBox}
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
          />

          <div style={{ marginTop: "10px", display: "flex" }}>
            <button
              onClick={() => (paid ? copyText() : block())}
              style={smallButton}
            >
              Copy
            </button>

            <button
              onClick={() => (paid ? sendEmail() : block())}
              style={smallButton}
            >
              Email
            </button>

            <button
              onClick={() => (paid ? downloadPDF() : block())}
              style={smallButton}
            >
              PDF
            </button>

            <button onClick={handlePay} style={smallButton}>
              Pay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------
// STYLES
// ----------------------------------

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const textareaStyle = {
  width: "100%",
  padding: "12px",
  height: "150px",
  marginBottom: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#0b6623",
  color: "white",
  border: "none",
  borderRadius: "6px",
  marginBottom: "10px",
  fontSize: "16px",
};

const voiceButton = {
  width: "100%",
  padding: "12px",
  background: "#333",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "16px",
  marginBottom: "10px",
};

const resultBox = {
  padding: "15px",
  background: "#f1f8e9",
  borderRadius: "6px",
  border: "1px solid #c5e1a5",
  marginTop: "10px",
};

const editBox = {
  width: "100%",
  height: "350px",
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  whiteSpace: "pre-wrap",
  marginTop: "10px",
};

const smallButton = {
  padding: "10px 12px",
  marginRight: "8px",
  borderRadius: "6px",
  border: "none",
  background: "#2e7d32",
  color: "white",
  fontSize: "14px",
};
