import { useMemo, useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]); // UI only for now
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // 1) Prefer VITE_API_URL (production) 2) petitiondesk.com fallback 3) local LAN fallback
  const API_BASE = useMemo(() => {
    const fromEnv = (import.meta?.env?.VITE_API_URL || "").trim();
    if (fromEnv) return fromEnv.replace(/\/+$/, "");

    const host = window.location.hostname || "localhost";
    const isProdDomain = host.includes("petitiondesk.com");

    // If you’re on your public domain and forgot env, fallback to your Render backend seen in screenshots.
    if (isProdDomain) return "https://justicebot-backend-6pzy.onrender.com";

    // Local dev fallback
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
  const subject = result?.subject || "FORMAL COMPLAINT / PETITION";

  const routingPrimary = result?.routing?.primary || null;
  const routingThrough = result?.routing?.through || null;
  const routingCC = Array.isArray(result?.routing?.cc) ? result.routing.cc : [];

  const toEmails = Array.isArray(result?.emailTargets?.to) ? result.emailTargets.to : [];
  const ccEmails = Array.isArray(result?.emailTargets?.cc) ? result.emailTargets.cc : [];

  function copyText() {
    if (!petitionText) return;
    navigator.clipboard.writeText(petitionText);
  }

  function openEmail() {
    setError("");

    if (!petitionText) {
      setError("No petition text to email yet.");
      return;
    }

    // If no TO email exists in directory, we cannot auto-fill recipients.
    if (!toEmails.length) {
      setError(
        "No email address found for the routed 'TO' institution. Add it to institution_directory.json, redeploy backend, then try again."
      );
      return;
    }

    const to = toEmails.join(",");
    const cc = ccEmails.join(",");

    // mailto URL
    const params = new URLSearchParams();
    if (cc) params.set("cc", cc);
    params.set("subject", subject);
    params.set("body", petitionText);

    window.location.href = `mailto:${encodeURIComponent(to)}?${params.toString()}`;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>
      <p style={styles.subtitle}>AI-powered legal petition generator</p>

      <div style={styles.helpBox}>
        <strong>How to get the best output</strong>
        <ol style={{ marginTop: 8 }}>
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
            <div><b>inferredState:</b> {result.inferredState || "(none)"}</div>
          </div>

          <div style={styles.routingBox}>
            <div style={styles.routingTitle}>Routing (resolved)</div>

            <div style={styles.routingRow}>
              <b>TO:</b>{" "}
              {routingPrimary?.org || "(none)"}
              {routingPrimary?.email ? <span> — {routingPrimary.email}</span> : <span style={styles.muted}> — (no email on directory)</span>}
            </div>

            {routingThrough?.org ? (
              <div style={styles.routingRow}>
                <b>THROUGH:</b> {routingThrough.org}
                {routingThrough.email ? <span> — {routingThrough.email}</span> : <span style={styles.muted}> — (no email)</span>}
              </div>
            ) : null}

            <div style={styles.routingRow}>
              <b>CC:</b>{" "}
              {routingCC.length ? "" : "(none)"}
            </div>

            {routingCC.length ? (
              <ul style={styles.ccList}>
                {routingCC.map((c, idx) => (
                  <li key={`${c.org}-${idx}`}>
                    {c.org}{" "}
                    {c.email ? (
                      <span style={styles.ccEmail}>({c.email})</span>
                    ) : (
                      <span style={styles.muted}>(no email)</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <pre style={styles.pre}>{petitionText}</pre>

          <div style={styles.actions}>
            <button style={styles.secondaryButton} onClick={copyText}>
              Copy Text
            </button>

            <button style={styles.secondaryButton} onClick={openEmail}>
              Email
            </button>
          </div>

          <div style={styles.smallNote}>
            If “Email” says no TO email, update <b>institution_directory.json</b> with the correct email for that routed institution, redeploy backend, then try again.
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- STYLES ---------------- */
const styles = {
  page: { maxWidth: 820, margin: "0 auto", padding: 20, fontFamily: "Arial, sans-serif" },
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
    borderRadius: 6,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: 10,
    fontSize: 14,
    cursor: "pointer",
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#fff",
  },
  error: { marginTop: 10, color: "red" },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15, borderRadius: 6 },
  pre: { whiteSpace: "pre-wrap", fontSize: 14, background: "#fff", padding: 12, borderRadius: 6, border: "1px solid #eee" },
  meta: { fontSize: 13, color: "#333", marginBottom: 10, display: "grid", gap: 4 },
  routingBox: { background: "#fff", border: "1px solid #eee", borderRadius: 6, padding: 12, marginBottom: 12 },
  routingTitle: { fontWeight: "bold", marginBottom: 6 },
  routingRow: { fontSize: 13, marginBottom: 6 },
  ccList: { margin: "6px 0 0 18px", padding: 0, fontSize: 13 },
  ccEmail: { color: "#333" },
  muted: { color: "#777" },
  actions: { display: "flex", gap: 10, marginTop: 10 },
  smallNote: { marginTop: 10, fontSize: 12, color: "#666" },
};
