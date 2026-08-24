const API_URL = String(
  import.meta.env.VITE_API_BASE_URL || "/api"
)
  .trim()
  .replace(/\/+$/, "");

export async function generatePetition(form) {
  try {
    const response = await fetch(`${API_URL}/generate-petition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ...data,
        error: data.error || "Server error. Please try again.",
        status: response.status,
        retryable: data.retryable === true || [429, 502, 503, 504].includes(response.status),
        retryAfterSeconds: Number(
          data.retryAfterSeconds || response.headers.get("retry-after") || 0
        ),
      };
    }

    return data;

  } catch (err) {
    return { error: "Network error. Server unreachable." };
  }
}
