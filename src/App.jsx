import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // HARD LOCK backend URL
  const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        complaint: description.trim()
      };

      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(rawText || "Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Server error");
      }

      setResult(data);
    } catch (err) {
      setError(err?.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  // ✅ FIXED PETITION TEXT (FROM BACKEND draft)
  const petitionText = useMemo(() => {
    if (!result?.draft) return "";

    const {
      intro = "",
      facts = "",
      legalBasis = "",
      reliefs = "",
      closing = ""
    } = result.draft;

    return `
${intro}

FACTS OF THE COMPLAINT
${facts}

LEGAL BASIS
${legalBasis}

RELIEFS SOUGHT
${reliefs}

${closing}
`.trim();
  }, [result]);

  function handleEmail() {
    if (!petitionText) {
      setError("No petition available to email.");
      return;
    }
    const subject = encodeURIComponent("FORMAL PETITION");
    const body = encodeURIComponent(petitionText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>
      <p style={styles.subtitle}>AI-powered formal petition drafting</p>

      <div style={styles.helpBox}>
        <strong>How to get the best output</strong>
        <ol>
          <li>Write your complaint like a story</li>
          <li>Include location keywords (e.g. Kubwa, Abuja)</li>
          <li>Be factual and clear</li>
        </ol>
        <p style={styles.note}>
          <b>Note:</b> PetitionDesk drafts formal petitions. Review before
          sending. This is not a law firm.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          style={styles.input}
          required
        />

        <label style={styles.label}>Your Complaint</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: Bank refused to refund my money despite..."
          style={styles.textarea}
          required
        />

        <label style={styles.label}>Upload Evidence (Photo / Video / PDF)</label>
        <input type="file" accept="image/*,video/*,.pdf" />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>

      {result && (
        <div style={styles.resultBox}>
          <h3>Generated Petition</h3>

          {/* 🔒 LOCKED PETITION TEXT */}
          <div
            style={styles.lockedText}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          >
            {petitionText}
          </div>

          <div style={styles.actions}>
            <button style={styles.secondaryButton} onClick={handleEmail}>
              Send via Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  page: { maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "Arial" },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", color: "#555" },
  helpBox: { background: "#f7f7f7", padding: 15, marginBottom: 20 },
  note: { fontSize: 13, color: "#555" },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  label: { fontWeight: "bold" },
  input: { padding: 10, fontSize: 16 },
  textarea: { padding: 10, fontSize: 16, minHeight: 130 },
  button: { padding: 12, background: "#003366", color: "#fff", fontSize: 16 },
  error: { color: "red", marginTop: 10 },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15 },
  lockedText: {
    whiteSpace: "pre-wrap",
    fontSize: 14,
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none",
    background: "#f9f9f9",
    padding: 15,
    border: "1px solid #ddd"
  },
  actions: { marginTop: 10 },
  secondaryButton: { padding: 10, cursor: "pointer" }
};
