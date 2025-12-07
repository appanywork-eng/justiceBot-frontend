const API_URL = "https://justicebot-backend-6pzy.onrender.com";

export async function generatePetition(form) {
  try {
    const response = await fetch(`${API_URL}/generate-petition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    // Handle cold-start
    if (!response.ok) {
      return { error: "Server error. Try again." };
    }

    const data = await response.json();
    return data;

  } catch (err) {
    return { error: "Network error. Server unreachable." };
  }
}
