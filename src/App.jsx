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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ---------------------------------------------------------
  // VOICE TO TEXT
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // SUBMIT FORM – Petition Generation
  // ---------------------------------------------------------
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

    const primary = response.primaryInstitution || null;
    const recipient = response.recipientInstitution || primary;

    setMeta({
      recipientInstitution: recipient,
      primaryInstitution: primary,
      throughInstitution: response.throughInstitution || null,
      ccList: Array.isArray(response.ccList) ? response.ccList : [],
    });
  }

  // ---------------------------------------------------------
  // COPY PETITION
  // ---------------------------------------------------------
  function copyText() {
    if (!edited) return alert("Nothing to copy.");
    navigator.clipboard.writeText(edited);
    alert("Petition copied!");
  }

  // ---------------------------------------------------------
  // EMAIL PETITION
  // ---------------------------------------------------------
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

    let mailto = `mailto:${encodeURIComponent(
      to
    )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(edited)}`;

    if (cc) mailto += `&cc=${encodeURIComponent(cc)}`;

    window.location.href = mailto;
  }

  // ---------------------------------------------------------
  // PDF DOWNLOAD
  // ---------------------------------------------------------
  function downloadPDF() {
    if (!edited) return alert("Generate a petition first.");

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(edited, width);

    doc.text(lines, margin, margin);
    doc.save("petition.pdf");
  }

  // ---------------------------------------------------------
  // PAYMENT – Flutterwave Integration
  // ---------------------------------------------------------
  async function handlePay() {
    if (!edited) {
      alert("Generate a petition first.");
      return;
    }

    try {
      const amount = 1000; // ₦1000 per petition

      const email = (form.email || "").trim() || "noemail@petitiondesk.com";
      const name =
        (form.fullName || "").trim() || "PetitionDesk User";

      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          email,
          name,
          description: "PetitionDesk – AI petition payment",
        }),
      });

      const data = await res.json();

      const paymentLink =
        data?.link || data?.paymentLink || data?.data?.link;

      if (!res.ok || !paymentLink) {
        console.error("Payment error:", data);
        alert(
          data?.error ||
            data?.message ||
            "Payment error. Please try again."
        );
        return;
      }

      window.location.href = paymentLink;
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment error. Please try again.");
    }
  }

  // ---------------------------------------------------------
  // STYLES
  // ---------------------------------------------------------
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

  const institutionBox = {
    padding: "10px",
    borderRadius: "6px",
    background: "white",
    marginBottom: "10px",
    border: "1px solid #ddd",
  };

  const institutionLabel = {
    fontWeight: "bold",
    marginBottom: "4px",
  };

  const institutionText = {
    whiteSpace: "pre-line",
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

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
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

          {/* Institutions */}
          {meta.recipientInstitution && (
            <div style={institutionBox}>
              <p style={institutionLabel}>Recipient:</p>
              <p style={institutionText}>
                {meta.recipientInstitution.org}
              </p>
            </div>
          )}

          {meta.primaryInstitution && (
            <div style={institutionBox}>
              <p style={institutionLabel}>Primary:</p>
              <p style={institutionText}>
                {meta.primaryInstitution.org}
              </p>
            </div>
          )}

          {meta.throughInstitution && (
            <div style={institutionBox}>
              <p style={institutionLabel}>Through:</p>
              <p style={institutionText}>
                {meta.throughInstitution.org}
              </p>
            </div>
          )}

          {meta.ccList.length > 0 && (
            <div style={institutionBox}>
              <p style={institutionLabel}>CC:</p>
              <ul>
                {meta.ccList.map((i, idx) => (
                  <li key={idx}>{i.org}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Editable petition */}
          <textarea
            style={editBox}
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
          />

          <div style={{ marginTop: "10px", display: "flex" }}>
            <button onClick={copyText} style={smallButton}>
              Copy
            </button>

            <button onClick={sendEmail} style={smallButton}>
              Email
            </button>

            <button onClick={downloadPDF} style={smallButton}>
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
