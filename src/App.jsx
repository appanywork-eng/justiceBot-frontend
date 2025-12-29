import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function App() {
  const [complaint, setComplaint] = useState("");
  const [sector, setSector] = useState("");
  const [petition, setPetition] = useState("");
  const [loading, setLoading] = useState(false);

  const [routing, setRouting] = useState({
    subject: "",
    to: [],
    cc: [],
    mailto: "",
    mentionedInstitutions: [],
    truncated: { to: false, cc: false },
  });

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [evidence, setEvidence] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setPetition("");
    setSector("");
    setRouting({
      subject: "",
      to: [],
      cc: [],
      mailto: "",
      mentionedInstitutions: [],
      truncated: { to: false, cc: false },
    });

    try {
      // 1) classify
      const sRes = await fetch(`${API_BASE}/classify-sector`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint }),
      });

      const sData = await sRes.json();
      const detected = (sData.sector || "unknown").trim().toLowerCase();
      setSector(detected);

      if (detected === "unknown") {
        setPetition("❌ Sector not recognized.");
        setLoading(false);
        return;
      }

      // 2) generate petition (send petitioner details so petition body is correct)
      const pRes = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint,
          sector: detected,
          petitioner: {
            fullName: fullName || "",
            address: address || "",
            phone: phone || "",
            evidenceName: evidence?.name || "None",
          },
        }),
      });

      const pData = await pRes.json();
      const petitionText = (pData.petition || "❌ Failed to generate petition.").trim();
      setPetition(petitionText);

      // 3) get routing that matches petition mentions
      const rRes = await fetch(`${API_BASE}/email-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint,
          sector: detected,
          petitionText: petitionText,
        }),
      });

      const rData = await rRes.json();

      setRouting({
        subject: rData.subject || "",
        to: rData.to || [],
        cc: rData.cc || [],
        mailto: rData.mailto || "",
        mentionedInstitutions: rData.mentionedInstitutions || [],
        truncated: rData.truncated || { to: false, cc: false },
      });
    } catch (err) {
      console.error(err);
      setPetition("❌ Error connecting to backend.");
    }

    setLoading(false);
  }

  function handleSendEmail() {
    if (!routing.mailto) {
      alert("❌ No verified emails found for routing. Fix sector JSON emails or enable Google CSE env vars.");
      return;
    }
    window.location.href = routing.mailto;
  }

  async function handleDownloadPDF() {
    if (!petition || sector === "unknown" || !sector) {
      alert("Generate a valid petition first.");
      return;
    }

    try {
      const url = `${API_BASE}/download-pdf?sector=${encodeURIComponent(sector)}&text=${encodeURIComponent(petition)}`;
      const res = await fetch(url);
      if (!res.ok) {
        alert("❌ PDF generation failed.");
        return;
      }

      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = `${sector}-petition.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      alert("❌ Error downloading PDF.");
      console.error(err);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 760, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 14 }}>PetitionDesk — Legal Protest Generator</h2>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      <textarea
        placeholder="Enter your complaint..."
        value={complaint}
        onChange={(e) => setComplaint(e.target.value)}
        style={{
          width: "100%",
          height: 140,
          marginBottom: 10,
          padding: 12,
          borderRadius: 6,
          border: "1px solid #ccc",
          fontSize: 15,
          resize: "vertical",
        }}
      />

      <label style={{ fontSize: 12, cursor: "pointer", display: "inline-block", marginBottom: 12 }}>
        📎 Evidence{" "}
        <input type="file" onChange={(e) => setEvidence(e.target.files?.[0] || null)} />
      </label>

      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          width: "100%",
          background: "#0a7",
          color: "#fff",
          padding: "10px 14px",
          fontSize: 16,
          borderRadius: 6,
          cursor: "pointer",
          border: "none",
        }}
      >
        {loading ? "Generating..." : "Generate Petition"}
      </button>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
        <button onClick={handleSendEmail} style={{ padding: "10px 14px" }}>
          Send Email
        </button>
        <button onClick={handleDownloadPDF} style={{ padding: "10px 14px" }}>
          Download PDF
        </button>
      </div>

      {sector && sector !== "unknown" && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <div style={{ fontSize: 14 }}>
            <strong>Detected sector:</strong> {sector}
          </div>

          <div style={{ marginTop: 10, fontSize: 13 }}>
            <strong>Email Subject:</strong> {routing.subject || "—"}
          </div>

          {routing.truncated?.to || routing.truncated?.cc ? (
            <div style={{ fontSize: 12, color: "#a00", marginTop: 8 }}>
              ⚠️ Mail client limit: only the first 10 recipients are inserted automatically. Add remaining manually if needed.
            </div>
          ) : null}

          <div style={{ marginTop: 10, fontSize: 12 }}>
            <strong>Mentioned institutions (used for routing):</strong>{" "}
            {routing.mentionedInstitutions?.length ? routing.mentionedInstitutions.join(" | ") : "—"}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5 }}>
            <div><strong>TO:</strong> {routing.to?.length ? routing.to.join(", ") : "—"}</div>
            <div style={{ marginTop: 6 }}><strong>CC:</strong> {routing.cc?.length ? routing.cc.join(", ") : "—"}</div>
          </div>
        </div>
      )}

      <pre
        style={{
          background: "#f8f8f8",
          padding: 18,
          borderRadius: 6,
          border: "1px solid #ddd",
          whiteSpace: "pre-wrap",
          minHeight: 220,
          marginTop: 16,
          fontSize: 14,
          lineHeight: 1.6,
          textAlign: "left",
        }}
      >
        {petition}
      </pre>

      <div style={{ marginTop: 22, fontSize: 10, textAlign: "center", opacity: 0.7 }}>
        Powered by PetitionDesk
      </div>
    </div>
  );
}
