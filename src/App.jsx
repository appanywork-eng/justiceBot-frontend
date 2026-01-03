import { useState } from "react";

export default function App() {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  // FIXED: Your live Render backend (this is the only line that matters)
  const API_BASE = "https://justicebot-backend-6pzy.onrender.com";

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPreview("");

    try {
      const res = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint: description.trim(),
          petitioner: {
            fullName: fullName.trim(),
            address: address.trim(),
            phone: phone.trim(),
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setPreview(data.preview || "No preview returned");
    } catch (err) {
      setError("Failed to connect: " + err.message);
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20, background: "#f9f9f9" }}>
      <h1 style={{ textAlign: "center", color: "#006600" }}>PetitionDesk (Test Mode)</h1>

      <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label>Full Name</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
        />

        <label>Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
        />

        <label>Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
        />

        <label>Your Complaint</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          required
          placeholder="Describe your issue..."
          style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "14px",
            background: loading ? "#aaa" : "#006600",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Petition"}
        </button>
      </form>

      {error && (
        <div style={{ color: "red", marginTop: 20, textAlign: "center" }}>
          {error}
        </div>
      )}

      {preview && (
        <div style={{ marginTop: 30 }}>
          <h2 style={{ color: "#006600", textAlign: "center" }}>Preview</h2>
          <pre
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              whiteSpace: "pre-wrap",
              fontSize: "15px",
              lineHeight: 1.6,
              border: "1px solid #ddd",
              minHeight: 300,
            }}
          >
            {preview}
          </pre>
        </div>
      )}
    </div>
  );
}
