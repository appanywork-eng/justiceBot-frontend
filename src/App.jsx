import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // ✅ HARD-LOCK backend URL (no guessing, no env vars)
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
        throw new Error(rawText || "Server returned invalid response");
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

  const petitionText = useMemo(() => {
    return result?.petition || result?.petitionDraft || "";
  }, [result]);

  function handleCopy() {
    if (!petitionText.trim()) {
      setError("No petition text to copy.");
      return;
    }
    navigator.clipboard.writeText(petitionText);
  }

  function handleEmail() {
    if (!petitionText.trim()) {
      setError("No petition text available to email.");
      return;
    }
    const subject = encodeURIComponent("FORMAL PETITION");
    const body = encodeURIComponent(petitionText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
          <b>Note:</b> PetitionDesk drafts formal petitions. Review before sending.
          This is not a law firm.
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
          placeholder="Example: AEDC disconnected my meter without notice in Kubwa, Abuja"
          style={styles.textarea}
          required
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>

      {result && (
        <div style={styles.resultBox}>
          <pre style={styles.pre}>{petitionText}</pre>

          <div style={styles.actions}>
            <button style={styles.secondaryButton} onClick={handleCopy}>
              Copy Text
            </button>
            <button style={styles.secondaryButton} onClick={handleEmail}>
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
  page: { maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "Arial, sans-serif" },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", color: "#555" },
  helpBox: { background: "#f7f7f7", padding: 15, marginTop: 15, borderRadius: 8 },
  note: { fontSize: 13, color: "#555" },
  form: { display: "flex", flexDirection: "column", gap: 10, marginTop: 20 },
  label: { fontWeight: "bold" },
  input: { padding: 10, fontSize: 16 },
  textarea: { padding: 10, fontSize: 16, minHeight: 130 },
  button: { padding: 12, background: "#003366", color: "#fff", border: "none", cursor: "pointer" },
  error: { color: "red", marginTop: 10 },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15, borderRadius: 8 },
  pre: { whiteSpace: "pre-wrap", fontSize: 14 },
  actions: { display: "flex", gap: 10, marginTop: 10 },
  secondaryButton: { padding: 10, cursor: "pointer" }
};
