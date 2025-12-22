import { useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("Nigeria");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [petitionText, setPetitionText] = useState("");
  const [route, setRoute] = useState(null);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          address: address.trim(),
          email: email.trim(),
          phone: phone.trim(),
          location: location.trim() || "Nigeria",
          complaint: description.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Server error");
      }

      setRoute(data.route || null);
      setPetitionText(data.petition || "");

    } catch (err) {
      setError(err.message || "Failed to generate petition");
    } finally {
      setLoading(false);
    }
  }

  function handleEmail() {
    if (!petitionText) return;

    const to = encodeURIComponent((route?.emailPack?.to || []).join(","));
    const cc = encodeURIComponent((route?.emailPack?.cc || []).join(","));
    const subject = encodeURIComponent("Formal Petition / Request for Redress");
    const body = encodeURIComponent(petitionText);

    window.location.href = `mailto:${to}?cc=${cc}&subject=${subject}&body=${body}`;
  }

  function handleEvidence() {
    document.getElementById("evidenceInput")?.click();
  }

  function handleDownload() {
    const blob = new Blob([petitionText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "petition.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>PetitionDesk</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label>Full Name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <label>Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} />

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label>Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} />

        <label>Your Complaint</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Petition"}
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>

      {petitionText && (
        <div style={styles.resultBox}>
          <div style={styles.routeBox}>
            <div><b>Sector:</b> {route?.sector || "Unknown"}</div>
            <div><b>TO:</b> {(route?.emailPack?.to || []).join(", ") || "None"}</div>
            <div><b>CC:</b> {(route?.emailPack?.cc || []).join(", ") || "None"}</div>
          </div>

          <pre
            style={styles.lockedText}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          >
            {petitionText}
          </pre>

          <input
            id="evidenceInput"
            type="file"
            style={{ display: "none" }}
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx"
          />

          <div style={styles.actions}>
            <button onClick={handleEmail}>Send Email</button>
            <button type="button" onClick={handleEvidence}>Evidence</button>
            <button type="button" onClick={handleDownload}>Download</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 900, margin: "0 auto", padding: 20 },
  title: { textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  error: { color: "red" },
  resultBox: { marginTop: 30, background: "#fafafa", padding: 15 },
  routeBox: { background: "#fff", padding: 10, marginBottom: 10 },
  lockedText: {
    userSelect: "none",
    whiteSpace: "pre-wrap",
    background: "#fff",
    padding: 12,
    minHeight: 260
  },
  actions: { display: "flex", gap: 10, marginTop: 10 }
};
