import React, { useState } from "react";
import "./App.css";

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
        setPetition("✗ Sector not recognized.");
        setLoading(false);
        return;
      }

      // 2) generate petition (send petitioner details so petition has identity lines)
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
      const petitionText = pData.petition || "✗ Failed to generate petition.";
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
      setPetition("✗ Error connecting to backend.");
    }

    setLoading(false);
  }

  function handleSendEmail() {
    if (!routing.mailto) {
      alert(
        "✗ No verified emails found for routing. Fix sector JSON emails or enable Google CSE env vars."
      );
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
      const url = `${API_BASE}/download-pdf?sector=${encodeURIComponent(sector)}`;
      const res = await fetch(url);
      if (!res.ok) {
        alert("✗ PDF generation failed.");
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
      alert("✗ Error downloading PDF.");
      console.error(err);
    }
  }

  return (
    <div className="page">
      <div className="card">
        {/* ===== New Premium Header ===== */}
        <header className="pd-header">
          <div className="pd-header__inner">
            <div className="pd-brand">
              <div className="pd-logo" aria-hidden="true">
                PD
              </div>

              <div className="pd-titleWrap">
                <h1 className="pd-title">PetitionDesk</h1>
                <p className="pd-subtitle">Legal AI Petition Generator</p>
              </div>
            </div>

            <div className="pd-badge" title="AI-assisted drafting tool">
              AI-Assisted
            </div>
          </div>
        </header>

        {/* ===== Moving Disclaimer (slow ticker) ===== */}
        <div className="pd-disclaimer" role="note" aria-label="Disclaimer">
          <div
            className="pd-disclaimer__fade pd-disclaimer__fade--left"
            aria-hidden="true"
          />
          <div
            className="pd-disclaimer__fade pd-disclaimer__fade--right"
            aria-hidden="true"
          />

          <div className="pd-disclaimer__track">
            <span className="pd-disclaimer__item">
              Disclaimer: PetitionDesk is an AI-assisted writing tool that helps
              users draft petitions and complaint letters. It does NOT provide
              legal advice, does NOT represent any user, and does NOT guarantee
              outcomes or delivery. Users are solely responsible for verifying
              facts, attachments, recipient details, and compliance with
              applicable laws. Do not submit false, defamatory, threatening, or
              unlawful content. For urgent or high-stakes matters, consult a
              qualified lawyer.
            </span>

            {/* repeat once for seamless scroll */}
            <span className="pd-disclaimer__item" aria-hidden="true">
              Disclaimer: PetitionDesk is an AI-assisted writing tool that helps
              users draft petitions and complaint letters. It does NOT provide
              legal advice, does NOT represent any user, and does NOT guarantee
              outcomes or delivery. Users are solely responsible for verifying
              facts, attachments, recipient details, and compliance with
              applicable laws. Do not submit false, defamatory, threatening, or
              unlawful content. For urgent or high-stakes matters, consult a
              qualified lawyer.
            </span>
          </div>
        </div>

        {/* ===== Form ===== */}
        <div className="section">
          <div className="grid">
            <input
              className="fieldInput"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="fieldInput"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <input
              className="fieldInput gridSpan2"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <textarea
            className="textarea"
            placeholder="Enter your complaint..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
          />

          <label className="evidenceLabel">
            📎 Evidence
            <input
              className="fileInput"
              type="file"
              onChange={(e) => setEvidence(e.target.files?.[0] || null)}
            />
          </label>

          <button className="btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Petition"}
          </button>

          <div className="actions">
            <button className="btnOutline" onClick={handleSendEmail}>
              Send Email
            </button>
            <button className="btnOutline" onClick={handleDownloadPDF}>
              Download PDF
            </button>
          </div>
        </div>

        {/* ===== Routing Summary ===== */}
        {sector && sector !== "unknown" && (
          <div className="resultBox">
            <div style={{ fontSize: 14 }}>
              <strong>Detected sector:</strong> {sector}
            </div>

            <div style={{ marginTop: 10, fontSize: 13 }}>
              <strong>Email Subject:</strong> {routing.subject || ""}
            </div>

            {routing.truncated?.to || routing.truncated?.cc ? (
              <div style={{ fontSize: 12, color: "#a00", marginTop: 8 }}>
                ⚠ Mail client limit: only the first 10 recipients
              </div>
            ) : null}

            <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6 }}>
              <div>
                <strong>Mentioned institutions (used for routing):</strong>{" "}
                {routing.mentionedInstitutions?.length
                  ? routing.mentionedInstitutions.join(", ")
                  : "None"}
              </div>

              <div style={{ marginTop: 10 }}>
                <div>
                  <strong>TO:</strong>{" "}
                  {routing.to?.length ? routing.to.join(", ") : "None"}
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>CC:</strong>{" "}
                  {routing.cc?.length ? routing.cc.join(", ") : "None"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Petition Output ===== */}
        <pre className="petitionText">{petition}</pre>

        <div style={{ marginTop: 18, fontSize: 10, textAlign: "center" }}>
          Powered by PetitionDesk
        </div>
      </div>
    </div>
  );
}
