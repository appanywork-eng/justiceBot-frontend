import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]); // (not sent yet; backend currently expects JSON)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // 1) Prefer VITE_API_URL (Render)  2) else same host:5000 (local LAN)
  const API_BASE = useMemo(() => {
    const fromEnv = (import.meta?.env?.VITE_API_URL || "").trim();
    if (fromEnv) return fromEnv.replace(/\/+$/, "");
    const host = window.location.hostname; // e.g. 192.168.0.100
    return `http://${host}:5000`;
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
        // optional fields your backend supports:
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Server error (${res.status})`);
      }

      setResult(data);
    } catch (err) {
      setError(
        err?.message ||
          `Failed to fetch. Check backend URL (${API_BASE}) and ensure backend is running.`
      );
    } finally {
      setLoading(false);
    }
  }

  const petitionText = result?.petitionText || "";

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>
      <p style={styles.subtitle}>AI-powered legal petition generator</p>

      <div style={styles.helpBox}>
        <strong>How to get the best output</strong>
        <ol>
          <li>Write your complaint like a story: who, what, where, when, how.</li>
          <li>Include location keywords (e.g. Kubwa, Gombe, Lagos).</li>
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
          Upload Evidence (Photos, Videos, Documents) — (UI only for now)
        </label>
        <input type="file" multiple onChange={(e) => setFiles([...e.target.files])} />

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
            <div><b>inferredState:</b> {result.inferredState || result.inferred_state || "(none)"}</div>
            <div><b>TO:</b> {result.toOrg || result.routing?.primary?.org || "(none)"}</div>
          </div>

          <pre style={styles.pre}>{petitionText}</pre>

          <button
            style={styles.secondaryButton}
            onClick={() => navigator.clipboard.writeText(petitionText)}
          >
            Copy Petition Text
          </button>
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
  secondaryButton: { marginTop: 10, padding: 10, fontSize: 14, cursor: "pointer" },
  error: { marginTop: 10, color: "red" },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15, borderRadius: 6 },
  pre: { whiteSpace: "pre-wrap", fontSize: 14 },
  meta: { fontSize: 13, color: "#333", marginBottom: 10, display: "grid", gap: 4 },
};
