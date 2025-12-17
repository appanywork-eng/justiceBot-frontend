import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Prefer Render env, fallback local
  const API_BASE = useMemo(() => {
    const fromEnv = import.meta.env.VITE_API_URL;
    if (fromEnv) return fromEnv.replace(/\/+$/, "");
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
      };

      const res = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Server error. Please try again.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  const petitionText = result?.petitionText || "";
  const primary = result?.primaryInstitution || null;
  const through = result?.throughInstitution || null;
  const ccList = Array.isArray(result?.ccList) ? result.ccList : [];

  function handleEmail() {
    if (!petitionText.trim()) {
      setError("No petition text available to email.");
      return;
    }

    const to = encodeURIComponent(primary?.email || "");
    const cc = encodeURIComponent(
      ccList.map((c) => c.email).filter(Boolean).join(",")
    );
    const subject = encodeURIComponent("FORMAL PETITION");
    const body = encodeURIComponent(petitionText);

    window.location.href = `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`;
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
          placeholder="Example: I was arrested in Kubwa Abuja yesterday..."
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
          <h3>Routing</h3>

          <p>
            <b>TO:</b>{" "}
            {primary ? `${primary.org} (${primary.email || "no email"})` : "—"}
          </p>

          <p>
            <b>THROUGH:</b>{" "}
            {through ? `${through.org} (${through.email || "no email"})` : "—"}
          </p>

          <p>
            <b>CC:</b>
          </p>
          {ccList.length ? (
            <ul>
              {ccList.map((c, i) => (
                <li key={i}>
                  {c.org} ({c.email || "no email"})
                </li>
              ))}
            </ul>
          ) : (
            <p>(none)</p>
          )}

          <pre style={styles.pre}>{petitionText}</pre>

          <div style={styles.actions}>
            <button
              style={styles.secondaryButton}
              onClick={() => navigator.clipboard.writeText(petitionText)}
            >
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
    background: "#003366",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  },
  error: { color: "red", marginTop: 10 },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15 },
  pre: { whiteSpace: "pre-wrap", fontSize: 14 },
  actions: { display: "flex", gap: 10, marginTop: 10 },
  secondaryButton: { padding: 10, cursor: "pointer" },
};
