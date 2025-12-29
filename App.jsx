import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");
  const [output, setOutput] = useState("");

  async function handleGenerate() {
    setOutput("Generating...");
    try {
      // Detect sector
      const r1 = await fetch("http://localhost:3000/detect-sector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint: text })
      });
      const { sector } = await r1.json();

      // Generate petition
      const r2 = await fetch("http://localhost:3000/generate-petition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint: text, sector })
      });
      const { petition } = await r2.json();

      setOutput(petition);
    } catch (err) {
      setOutput("Error: backend not reachable.");
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>JusticeBot Petition Generator</h2>
      <textarea
        placeholder="Describe your complaint..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
      />
      <button
        onClick={handleGenerate}
        style={{ marginTop: 10, padding: 10, width: "100%", borderRadius: 6, fontWeight: "bold" }}
      >
        Generate Petition
      </button>

      <h3 style={{ marginTop: 20 }}>Response:</h3>
      <pre style={{ background: "#f3f3f3", padding: 10, borderRadius: 6, minHeight: 120, whiteSpace: "pre-wrap" }}>
        {output}
      </pre>
    </div>
  );
}
