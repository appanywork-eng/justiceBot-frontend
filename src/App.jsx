import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [evidence, setEvidence] = useState(null);

  // 🔒 HARD-LOCKED backend URL
  const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        complaint: description.trim(),
      };

      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Server error");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate petition");
    } finally {
      setLoading(false);
    }
  }

  const petitionText = useMemo(() => {
    return (
      result?.draft?.full ||
      result?.petition ||
      result?.petitionDraft ||
      ""
    );
  }, [result]);

  function sendEmail() {
    if (!petitionText) return;
    const subject = encodeURIComponent("FORMAL PETITION");
    const body = encodeURIComponent(petitionText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function downloadPDF() {
    const blob = new Blob([petitionText], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PetitionDesk_Petition.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>
      <p style={styles.subtitle}>AI-powered legal petition drafting</p>

      <div style={styles.helpBox}>
        <strong>How to get the best output</strong>
        <ol>
          <li>Write your complaint like a story</li>
          <li>Include location keywords (e.g. Kubwa, Abuja)</li>
          <li>Be factual and clear</li>
        </ol>
        <p style={styles.note}>
          <b>Note:</b> PetitionDesk drafts formal petitions. This is not a law firm.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={styles.input}
          required
        />

        <label style={styles.label}>Your Complaint</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
          required
        />

        <button style={styles.button} disabled={loading}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>

      {petitionText && (
        <div style={styles.resultBox}>
          <h3>Generated Petition</h3>

          {/* 🔒 LOCKED PETITION */}
          <pre
            style={styles.pre}
            onCopy={(e) => e.preventDefault()}
            onSelectStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {petitionText}
          </pre>

          <div style={styles.actions}>
            <button onClick={sendEmail} style={styles.secondaryButton}>
              Send to Email
            </button>

            <button onClick={downloadPDF} style={styles.secondaryButton}>
              Download PDF
            </button>
          </div>

          <div style={styles.evidenceBox}>
            <label style={styles.label}>
              Upload Evidence (Photo / Video / PDF / Document)
            </label>
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              onChange={(e) => setEvidence(e.target.files[0])}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: { maxWidth: 800, margin: "0 auto", padding: 20 },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", color: "#555" },
  helpBox: { background: "#f7f7f7", padding: 15, marginTop: 20 },
  note: { fontSize: 13, color: "#555" },
  form: { display: "flex", flexDirection: "column", gap: 12, marginTop: 20 },
  label: { fontWeight: "bold" },
  input: { padding: 10, fontSize: 16 },
  textarea: { padding: 10, fontSize: 16, minHeight: 130 },
  button: { padding: 12, background: "#003366", color: "#fff", fontSize: 16 },
  error: { color: "red", marginTop: 10 },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15 },
  pre: {
    whiteSpace: "pre-wrap",
    fontSize: 14,
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
  },
  actions: { display: "flex", gap: 10, marginTop: 10 },
  secondaryButton: { padding: 10, cursor: "pointer" },
  evidenceBox: { marginTop: 15 },
};
