import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]); // UI only for now
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  /* ---------------- API BASE ----------------
     Priority:
     1) VITE_API_URL (Render)
     2) Render backend hard fallback
     3) Local dev fallback
  ------------------------------------------- */
  const API_BASE = useMemo(() => {
    const envUrl = (import.meta?.env?.VITE_API_URL || "").trim();
    if (envUrl) return envUrl.replace(/\/+$/, "");

    // Hard safety fallback (production)
    if (window.location.hostname.includes("petitiondesk")) {
      return "https://justicebot-backend-6pzy.onrender.com";
    }

    // Local dev
    return "http://localhost:5000";
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        description: description.trim(),
        email: "",
        phone: "",
        address: "",
        role: "Victim",
      };

      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Backend did not return JSON");
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Server error (${res.status})`);
      }

      setResult(data);
    } catch (err) {
      setError(
        err?.message ||
          `Failed to fetch. Backend: ${API_BASE}`
      );
    } finally {
      setLoading(false);
    }
  }

  const petitionText = result?.petitionText || "";

  /* ---------------- ACTIONS ---------------- */
  function handleCopy() {
    navigator.clipboard.writeText(petitionText);
  }

  function handleEmail() {
    const subject = encodeURIComponent(result?.subject || "Formal Petition");
    const body = encodeURIComponent(petitionText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function handlePDF() {
    const blob = new Blob([petitionText], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "petition.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>
      <p style={styles.subtitle}>AI-powered legal petition generator</p>

      <div style={styles.helpBox}>
        <strong>How to get the best output</strong>
        <ol>
          <li>Write your complaint like a story (who, what, where, when).</li>
          <li>Include location keywords (e.g. Kubwa, Abuja).</li>
          <li>Be factual and clear.</li>
        </ol>
        <p style={styles.note}>
          <b>Note:</b> PetitionDesk drafts formal petitions. Always review before sending.
          This is not a law firm.
        </p>
        <p style={styles.note}>
          <b>Backend:</b> {API_BASE}
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

        <label style={styles.label}>
          Your Complaint ({description.length} chars)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: I was arrested and detained in Kubwa, Abuja..."
          style={styles.textarea}
          required
        />

        <label style={styles.label}>
          Upload Evidence (UI only for now)
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles([...e.target.files])}
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>

      {result && (
        <div style={styles.resultBox}>
          <h3 style={{ marginTop: 0 }}>Generated Petition</h3>

          <div style={styles.meta}>
            <div><b>usedAI:</b> {String(result.usedAI)}</div>
            <div><b>jurisdiction:</b> {result.jurisdiction || "(auto)"}</div>
            <div><b>inferredState:</b> {result.inferredState || "(none)"}</div>
            <div><b>TO:</b> {result.toOrg || "(auto-resolved)"}</div>
          </div>

          <pre style={styles.pre}>{petitionText}</pre>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={styles.secondaryButton} onClick={handleCopy}>
              Copy Text
            </button>
            <button style={styles.secondaryButton} onClick={handleEmail}>
              Email
            </button>
            <button style={styles.secondaryButton} onClick={handlePDF}>
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  page: { maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "Arial, sans-serif" },
  title: { textAlign: "center", marginBottom: 5 },
  subtitle: { textAlign: "center", color: "#555", marginBottom: 20 },
  helpBox: { background: "#f7f7f7", padding: 15, borderRadius: 6, marginBottom: 20 },
  note: { fontSize: 13, color: "#555" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontWeight: "bold" },
  input: { padding: 8, fontSize: 16 },
  textarea: { padding: 8, fontSize: 16, minHeight: 120 },
  button: {
    padding: 12,
    fontSize: 16,
    background: "#003366",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: 10,
    fontSize: 14,
    cursor: "pointer",
  },
  error: { marginTop: 10, color: "red" },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15, borderRadius: 6 },
  pre: { whiteSpace: "pre-wrap", fontSize: 14 },
  meta: { fontSize: 13, color: "#333", marginBottom: 10, display: "grid", gap: 4 },
};
