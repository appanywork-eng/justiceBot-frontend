async function generatePetition() {
  const fullName = document.getElementById("fullName").value.trim();
  const complaint = document.getElementById("complaint").value.trim();

  if (!fullName || !complaint) {
    alert("Full name and complaint are required.");
    return;
  }

  const res = await fetch("/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, complaint })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.details || "Server error");
    return;
  }

  const petitionText = `
${data.subject}

PETITIONER:
${data.petitioner}

INTRODUCTION:
${data.draft.intro}

FACTS:
${data.draft.facts}

LEGAL BASIS:
${data.draft.legalBasis}

RELIEFS SOUGHT:
${data.draft.reliefs}

CONCLUSION:
${data.draft.closing}
  `.trim();

  document.getElementById("output").value = petitionText;
}

function emailPetition() {
  const text = document.getElementById("output").value;
  if (!text) {
    alert("No petition to email.");
    return;
  }
  window.location.href =
    "mailto:?subject=Formal Petition&body=" +
    encodeURIComponent(text);
}
