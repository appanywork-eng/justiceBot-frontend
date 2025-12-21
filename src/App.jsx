import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [evidence, setEvidence] = useState(null);

  const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          complaint: description.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");

      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate petition");
    } finally {
      setLoading(false);
    }
  }

  const petitionText = useMemo(() => {
    if (!result?.draft) return "";
    const { intro, facts, legalBasis, reliefs, closing } = result.draft;
    return [intro, facts, legalBasis, reliefs, closing].join("\n\n");
  }, [result]);

  function handleEmail() {
    if (!petitionText) return;
    const subject = encodeURIComponent(result.subject || "FORMAL PETITION");
    const body = encodeURIComponent(petitionText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Full Name</label>
        <input value={fullName} onChange={e => setFullName(e.target.value)} required />

        <label>Your Complaint</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />

        <label>Upload Evidence (Photo / Video / PDF)</label>
        <input type="file" onChange={e => setEvidence(e.target.files[0])} />

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>

      {petitionText && (
        <div style={styles.resultBox}>
          <pre style={styles.lockedText}>{petitionText}</pre>

          <div style={styles.actions}>
            <button onClick={handleEmail}>Send to Email</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 800, margin: "0 auto", padding: 20 },
  title: { textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  error: { color: "red" },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15 },
  lockedText: {
    userSelect: "none",
    pointerEvents: "none",
    whiteSpace: "pre-wrap"
  },
  actions: { marginTop: 10 }
};
