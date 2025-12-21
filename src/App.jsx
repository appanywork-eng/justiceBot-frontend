import { useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [petitionText, setPetitionText] = useState("");

  const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setPetitionText("");
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
      console.log("FRONTEND RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      if (!data.petition) {
        throw new Error("No petition returned from server");
      }

      setPetitionText(data.petition);

    } catch (err) {
      setError(err.message || "Failed to generate petition");
    } finally {
      setLoading(false);
    }
  }

  function handleEmail() {
    if (!petitionText) return;
    const subject = encodeURIComponent("Formal Petition");
    const body = encodeURIComponent(petitionText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Full Name</label>
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
        />

        <label>Your Complaint</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>

      {petitionText && (
        <div style={styles.resultBox}>
          <pre
            style={styles.lockedText}
            onCopy={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
          >
            {petitionText}
          </pre>

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
  form: { display: "flex", flexDirection: "column", gap: 12 },
  error: { color: "red" },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15 },
  lockedText: {
    userSelect: "none",
    pointerEvents: "none",
    whiteSpace: "pre-wrap"
  },
  actions: { marginTop: 10 }
};
