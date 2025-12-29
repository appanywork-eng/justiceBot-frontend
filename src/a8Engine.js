import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_KEY
});

export async function generatePetition(complaint) {
  try {
    const res = await fetch("http://localhost:3000/detect-sector", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint })
    });

    const { sector } = await res.json();
    if (!sector || sector === "unknown") return "❌ Sector not recognized.";

    const petitionRes = await fetch("http://localhost:3000/generate-petition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint, sector })
    });

    const { petition } = await petitionRes.json();
    return petition.trim();
  } catch {
    return "❌ Backend or OpenAI not reachable.";
  }
}
