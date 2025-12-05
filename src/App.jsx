import { useState } from "react";
import jsPDF from "jspdf";
import { generatePetition } from "./api.js";

export default function App() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    description: "",
    role: "victim"
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [edited, setEdited] = useState("");

  // Holds institution metadata returned from backend
  const [meta, setMeta] = useState({
    primaryInstitution: null,
    throughInstitution: null,
    ccList: []
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
        description:
          (prev.description ? prev.description + " " : "") +
          event.results[0][0].transcript
      }));
    };

    recognition.start();
  }

  // ---------------------------------------------------------
  // SUBMIT FORM
  // ---------------------------------------------------------
  async function submitForm() {
    if (!form.fullName || !form.description) {
      alert("Full name and complaint description are required");
      return;
    }

    setLoading(true);
    const response = await generatePetition(form);
    setLoading(false);

    if (response.error) {
      alert(response.error);
    } else {
      setResult(response.petitionText);
      setEdited(response.petitionText);

      setMeta({
        primaryInstitution: response.primaryInstitution,
        throughInstitution: response.throughInstitution,
        ccList: response.ccList || []
      });
    }
  }

  // ---------------------------------------------------------
  // COPY TEXT
  // ---------------------------------------------------------
  function copyText() {
    if (!edited) return alert("Nothing to copy.");
    navigator.clipboard.writeText(edited);
    alert("Petition copied!");
  }

  // ---------------------------------------------------------
  // SEND EMAIL (Uses JSON metadata)
  // ---------------------------------------------------------
  function sendEmail() {
    if (!edited) return alert("Generate the petition first.");

    const allEmails = [];

    if (meta.primaryInstitution?.email)
      allEmails.push(meta.primaryInstitution.email);

    if (meta.throughInstitution?.email)
      allEmails.push(meta.throughInstitution.email);

    meta.ccList.forEach((c) => {
      if (c.email) allEmails.push(c.email);
    });

    const unique = [...new Set(allEmails)].filter(Boolean);

    const to = unique[0] || "";
    const cc = unique.slice(1).join(",");

    const subject = `Petition from ${form.fullName}`;
    const body = edited;

    let mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    if (cc) mailto += `&cc=${encodeURIComponent(cc)}`;

    window.location.href = mailto;
  }

  // ---------------------------------------------------------
  // DOWNLOAD PDF
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
  // PAY BUTTON (Placeholder)
  // ---------------------------------------------------------
  function handlePay() {
    alert("Payment integration coming soon.");
  }

  // ---------------------------------------------------------
  // FRONTEND UI
  // ---------------------------------------------------------
  return (
    <div style={{ padding: "15px", fontFamily: "Arial" }}>
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>
        ⚖️ JusticeBot — AI Petition Writer
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

          {/* METADATA */}
          <div style={institutionBox}>
            {meta.primaryInstitution && (
              <>
                <p style={institutionLabel}>Primary:</p>
                <p style={institutionText}>{meta.primaryInstitution.org}</p>
              </>
            )}

            {meta.throughInstitution && (
              <>
                <p style={institutionLabel}>Through:</p>
                <p style={institutionText}>{meta.throughInstitution.org}</p>
              </>
            )}

            {meta.ccList.length > 0 && (
              <>
                <p style={institutionLabel}>CC:</p>
                <ul>
                  {meta.ccList.map((i, idx) => (
                    <li key={idx}>{i.org}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <textarea
            style={editBox}
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
          />

          <div style={{ marginTop: "10px", display: "flex" }}>
            <button onClick={copyText} style={smallButton}>Copy</button>
            <button onClick={sendEmail} style={smallButton}>Email</button>
            <button onClick={downloadPDF} style={smallButton}>PDF</button>
            <button onClick={handlePay} style={smallButton}>Pay</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------
// STYLES
// ---------------------------------------------------------

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px"
};

const textareaStyle = {
  width: "100%",
  padding: "12px",
  height: "150px",
  marginBottom: "10px",
  border: "1px solid #ccc",
  borderRadius: "6px"
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "#1b5e20",
  color: "white",
  border: "none",
  borderRadius: "6px",
  marginBottom: "10px",
  fontSize: "16px"
};

const voiceButton = {
  width: "100%",
  padding: "12px",
  background: "#444",
  color: "white",
  border: "none",
  borderRadius: "6px",
  marginBottom: "20px",
  fontSize: "16px"
};

const resultBox = {
  padding: "15px",
  background: "#f1f8e9",
  borderRadius: "6px",
  border: "1px solid #c5e1a5",
  marginTop: "10px"
};

const institutionBox = {
  padding: "10px",
  borderRadius: "6px",
  background: "white",
  marginBottom: "10px",
  border: "1px solid #ddd"
};

const institutionLabel = {
  fontWeight: "bold",
  marginBottom: "4px"
};

const institutionText = {
  whiteSpace: "pre-line",
  marginTop: 0
};

const editBox = {
  width: "100%",
  height: "350px",
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  whiteSpace: "pre-wrap",
  marginTop: "10px"
};

const smallButton = {
  padding: "10px 14px",
  marginRight: "10px",
  marginTop: "10px",
  borderRadius: "6px",
  border: "none",
  background: "#2e7d32",
  color: "white",
  fontSize: "14px"
};
