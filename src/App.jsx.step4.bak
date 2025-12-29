import { useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [petitionText, setPetitionText] = useState("");
  const [route, setRoute] = useState(null);

  // IMPORTANT:
  // Your backend endpoint should be: POST /api/petition
  // This is the Render service base URL:
  const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setPetitionText("");
    setRoute(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/petition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          complaint: description.trim(),
          location: "Nigeria"
        })
      });

      // SAFEST parsing: read text first, then JSON parse
      const rawText = await res.text();
      let data = null;

      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        // If we got HTML, it will start with <!DOCTYPE
        throw new Error(
          "Server did not return JSON. (Wrong endpoint or backend returned HTML). First part: " +
          rawText.slice(0, 80)
        );
      }

      console.log("FRONTEND RESPONSE:", data);

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Server error");
      }

      if (!data.petition) {
        throw new Error("No petition returned from server");
      }

      setPetitionText(data.petition);
      setRoute(data.route || null);

    } catch (err) {
      setError(err?.message || "Failed to generate petition");
    } finally {
      setLoading(false);
    }
  }

  function buildHeaderBlock() {
    if (!route) return "";

    const toLine =
      route?.to?.name
        ? `${route.to.name}${route.to.email ? ` <${route.to.email}>` : ""}`
        : "";

    const ccLines = Array.isArray(route?.cc)
      ? route.cc.map(x => `${x.name}${x.email ? ` <${x.email}>` : ""}`)
      : [];

    return [
      "TO:",
      toLine || "(not set)",
      "",
      "CC:",
      ccLines.length ? ccLines.join("\n") : "(none)",
      "",
      "----------------------------------------",
      ""
    ].join("\n");
  }

  function handleEmail() {
    if (!petitionText) return;

    const subject = encodeURIComponent("Formal Petition");
    const header = buildHeaderBlock();
    const body = encodeURIComponent(header + petitionText);

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

      {(petitionText || route) && (
        <div style={styles.resultBox}>
          {/* Show TO/CC properly (no [object Object]) */}
          {route && (
            <div style={styles.routeBox}>
              <div><b>TO:</b> {route?.to?.name ? `${route.to.name}${route.to.email ? ` (${route.to.email})` : ""}` : "Not set"}</div>
              <div style={{ marginTop: 6 }}>
                <b>CC:</b>
                <div style={{ marginTop: 4 }}>
                  {Array.isArray(route?.cc) && route.cc.length ? (
                    <ul style={styles.ccList}>
                      {route.cc.map((x, idx) => (
                        <li key={idx}>
                          {x.name}{x.email ? ` (${x.email})` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>None</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {petitionText && (
            <pre style={styles.petitionText}>
              {petitionText}
            </pre>
          )}

          <div style={styles.actions}>
            <button onClick={handleEmail} disabled={!petitionText}>
              Send to Email
            </button>
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
  error: { color: "red", marginTop: 8 },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15, borderRadius: 8 },
  routeBox: { background: "#fff", padding: 12, borderRadius: 8, marginBottom: 12, border: "1px solid #eee" },
  ccList: { margin: 0, paddingLeft: 18 },
  petitionText: {
    whiteSpace: "pre-wrap",
    background: "#fff",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #eee"
  },
  actions: { marginTop: 10, display: "flex", gap: 10 }
};
