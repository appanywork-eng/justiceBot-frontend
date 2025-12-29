import { useState } from "react";

export default function PetitionForm() {
  const [complaint, setComplaint] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState("");
  const [petition, setPetition] = useState("");

  async function classifySector() {
    const res = await fetch("http://localhost:3000/classify-sector", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint })
    });
    const data = await res.json();
    return data.sector;
  }

  async function generate() {
    const sector = await classifySector();
    if (!sector) return;

    const db = await import(\`../datasets/\${sector}.json\`);
    const email = db.default.institution_verified_email || null;

    if (!email) {
      setInstitutionEmail("USE_DYNAMIC_LOOKUP_FROM_OFFICIAL_SITE");
      return;
    }

    setInstitutionEmail(email);

    const petitionRes = await fetch("http://localhost:3000/generate-petition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint })
    });

    const petData = await petitionRes.json();
    setPetition(petData.petition);
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <textarea
        className="w-full border p-2 rounded"
        placeholder="Describe your complaint..."
        value={complaint}
        onChange={e => setComplaint(e.target.value)}
      />
      <button
        onClick={generate}
        className="mt-2 bg-black text-white px-4 py-2 rounded"
      >
        Generate Petition
      </button>

      <div className="mt-4">
        <p className="font-bold">Institution Email:</p>
        <input
          className="w-full border p-2 rounded"
          value={institutionEmail}
          readOnly
        />
      </div>

      <div className="mt-4">
        <p className="font-bold">Petition:</p>
        <pre className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap">
          {petition}
        </pre>
      </div>
    </div>
  );
}
