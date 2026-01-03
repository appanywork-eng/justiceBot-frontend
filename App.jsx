// src/App.jsx
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function App() {
  const [form, setForm] = useState({ name: "", email: "", text: "" });
  const [state, setState] = useState("idle"); // idle | preview | paying | unlocked
  const [txRef, setTxRef] = useState("");
  const [preview, setPreview] = useState("");
  const [petition, setPetition] = useState("");
  const [error, setError] = useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function generate() {
    setError("");
    setState("preview");
    const r = await fetch(`${API}/generate-petition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint: form.text, petitioner: { email: form.email } }),
    });
    const d = await r.json();
    if (!r.ok) return setError(d.error);
    setPreview(d.preview);
    setTxRef(d.tx_ref);
  }

  async function pay() {
    setState("paying");
    const r = await fetch(`${API}/pay/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tx_ref: txRef, email: form.email }),
    });
    const d = await r.json();
    if (!d.ok) return setError(d.error);
    window.location.href = d.link;
  }

  async function unlock(tx) {
    const r = await fetch(`${API}/unlock-petition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tx_ref: tx }),
    });
    const d = await r.json();
    if (!d.ok) return setError(d.error);
    setPetition(d.petition);
    setState("unlocked");
  }

  useEffect(() => {
    const tx = new URLSearchParams(window.location.search).get("tx_ref");
    if (tx) unlock(tx);
  }, []);

  return (
    <main style={{ maxWidth: 800, margin: "auto", padding: 24 }}>
      <h1>PetitionDesk</h1>

      {state !== "unlocked" && (
        <>
          <textarea
            placeholder="Describe your issue"
            value={form.text}
            onChange={(e) => update("text", e.target.value)}
            style={{ width: "100%", height: 160 }}
          />
          <button onClick={generate}>Generate</button>
        </>
      )}

      {state === "preview" && (
        <>
          <pre>{preview}</pre>
          <button onClick={pay}>Pay ₦1,050</button>
        </>
      )}

      {state === "unlocked" && <pre>{petition}</pre>}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </main>
  );
}
