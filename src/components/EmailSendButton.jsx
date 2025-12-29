import React from "react";

export default function EmailSendButton({ petition, institutionEmails }) {
  const handleSend = () => {
    if (!petition) return alert("Generate petition first.");

    const subject = encodeURIComponent("Official Petition from JusticeBot");
    const body = encodeURIComponent(petition);
    const cc = institutionEmails.join(",");

    window.location.href = `mailto:?subject=${subject}&body=${body}&cc=${cc}`;
  };

  return (
    <button
      onClick={handleSend}
      style={{ marginTop: 10, padding: 10, width: "100%", background: "green", color: "#fff", border: "none", borderRadius: 6 }}
    >
      Send Email
    </button>
  );
}
