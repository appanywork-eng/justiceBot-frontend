const API_URL = "https://justicebot-backend-6pzy.onrender.com";

export async function generatePetition(form) {
  try {
    const response = await fetch(`${API_URL}/generate-petition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    // If backend is cold, Render may take 2–4 seconds automatically
    if (!response.ok) {
      return { error: "Server error. Try again." };
    }

    const data = await response.json();
    return data;

  } catch (err) {
    return { error: "Network error. Server unreachable." };
  }
}
