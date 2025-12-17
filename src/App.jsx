import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]); // UI only for now
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Backend base (Render preferred, localhost fallback)
  const API_BASE = useMemo(() => {
    const fromEnv = import.meta?.env?.VITE_API_URL;
    if (fromEnv) return fromEnv.replace(/\/+$/, "");
    return "http://localhost:5000";
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      if (!description.trim()) {
        throw new Error("Please enter your complaint.");
      }

      const payload = {
        fullName: fullName.trim(),
        description: description.trim(),
        role: "Victim",
      };

      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server error (${res.status})`);
      }

      const data = await res.json();

      if (!data || !data.petitionText) {
        throw new Error("Invalid response from backend.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate petition.");
    } finally {
      setLoading(false);
    }
  }

  // ---- Derived safe values ----
  const petitionText = result?.petitionText || "";
  const primary = result?.primaryInstitution || null;
  const through = result?.throughInstitution || null;
  const ccList = Array.isArray(result?.ccList) ? result.ccList : [];

  const subject =
    primary?.org
      ? `FORMAL PETITION AGAINST ${primary.org.toUpperCase()}`
      : "FORMAL PETITION";

  function buildMailto() {
    const to = encodeURIComponent(primary?.email || "");
    const cc = encodeURIComponent(
      ccList.map((c) => c.email).filter(Boolean).join(",")
    );
    const sub = encodeURIComponent(subject);
    const body = encodeURIComponent(petitionText);

    const parts = [];
    if (cc) parts.push(`cc=${cc}`);
    parts.push(`subject=${sub}`);
    parts.push(`body=${body}`);

    return `mailto:${to}?${parts.join("&")}`;
  }

  function handleEmail() {
    if (!petitionText.trim()) {
      setError("No petition text available.");
      return;
    }
    window.location.href = buildMailto();
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>
      <p style={styles.subtitle}>AI-powered legal petition drafting</p>

      <div style={styles.helpBox}>
        <strong>How to get the best output</strong>
        <ol>
          <li>Write your complaint like a story.</li>
          <li>Include locations (e.g. Kubwa, Lagos).</li>
          <li>Be factual and clear.</li>
        </ol>
        <p style={styles.note}>
          <b>Note:</b> PetitionDesk drafts formal petitions. Review before
          sending. This is not a law firm.
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
        />

        <label style={styles.label}>Your Complaint</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Example: I was arrested in Kubwa by police officers..."
          style={styles.textarea}
          required
        />

        <label style={styles.label}>
          Upload Evidence (Photos, Videos, Documents)
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
          <h3>Generated Petition</h3>

          <div style={styles.routingBox}>
            <div style={styles.routingTitle}>Routing</div>

            <div style={styles.routingRow}>
              <b>TO:</b>{" "}
              {primary ? (
                <>
                  {primary.org}{" "}
                  <span style={styles.muted}>
                    — {primary.email || "no email"}
                  </span>
                </>
              ) : (
                <span style={styles.muted}>(none)</span>
              )}
            </div>

            <div style={styles.routingRow}>
              <b>CC:</b>{" "}
              {ccList.length ? (
                <ul style={styles.ccList}>
                  {ccList.map((c, i) => (
                    <li key={i}>
                      {c.org}{" "}
                      <span style={styles.muted}>
                        — {c.email || "no email"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={styles.muted}>(none)</span>
              )}
            </div>

            <div style={styles.helperNote}>
              If no email appears, you can still copy the text or open a draft
              email manually.
            </div>
          </div>

          <pre style={styles.pre}>{petitionText}</pre>

          <div style={styles.actions}>
            <button
              style={styles.secondaryButton}
              onClick={() =>
                navigator.clipboard.writeText(petitionText || "")
              }
            >
              Copy Text
            </button>

            <button
              style={styles.secondaryButton}
              onClick={handleEmail}
            >
              Email
            </button>
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
  helpBox: { background: "#f7f7f7", padding: 15, marginBottom: 20 },
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
    cursor: "pointer",
  },
  error: { marginTop: 10, color: "red" },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15 },
  pre: { whiteSpace: "pre-wrap", fontSize: 14 },
  actions: { display: "flex", gap: 10, marginTop: 10 },
  secondaryButton: { padding: 10, cursor: "pointer" },
  routingBox: { background: "#fff", padding: 10, marginBottom: 10 },
  routingTitle: { fontWeight: "bold", marginBottom: 6 },
  routingRow: { fontSize: 13, marginBottom: 6 },
  ccList: { margin: "6px 0 6px 18px" },
  muted: { color: "#777" },
  helperNote: { marginTop: 8, fontSize: 13, color: "#555" },
};




