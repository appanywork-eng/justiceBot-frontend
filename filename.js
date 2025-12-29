export function detectSector(input) {
  const text = input.toLowerCase();

  if (text.includes("police") || text.includes("arrest")) {
    return "security";
  }
  if (text.includes("flight") || text.includes("airport")) {
    return "aviation";
  }
  if (text.includes("bank") || text.includes("debit")) {
    return "banking";
  }
  if (text.includes("school") || text.includes("university")) {
    return "education";
  }
  if (text.includes("electric") || text.includes("disco")) {
    return "power";
  }
  if (text.includes("mtn") || text.includes("airtel") || text.includes("glo")) {
    return "telecoms";
  }
  if (text.includes("hospital") || text.includes("clinic")) {
    return "health";
  }
  if (text.includes("court") || text.includes("judge")) {
    return "judiciary";
  }
  if (text.includes("international") || text.includes("global")) {
    return "international_escalation";
  }

  return "unknown";
}
