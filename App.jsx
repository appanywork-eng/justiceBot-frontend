import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

// IMPORTANT:
// - On same Android device (Termux backend + browser frontend): use 127.0.0.1
// - If frontend is on another device, use your phone IP like http://192.168.0.100:3000
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:3000";
const PRICE_NGN = Number(import.meta.env.VITE_PRICE_NGN || "1050");

// localStorage keys
const LS_DRAFT_KEY = "pd_draft_v1";
const LS_UNLOCK_KEY = "pd_unlock_v1";

function safeJsonParse(s, fallback = null) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

export default function App() {
  const [complaint, setComplaint] = useState("");
  const [sector, setSector] = useState("");
  const [petition, setPetition] = useState("");
  const [loading, setLoading] = useState(false);

  const [routing, setRouting] = useState({
    subject: "",
    to: [],
    cc: [],
    mailto: "",
    mentionedInstitutions: [],
    truncated: { to: false, cc: false },
  });

  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [evidence, setEvidence] = useState(null);

  // PAYWALL STATES
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockMsg, setUnlockMsg] = useState("");

  const canShowOutput = Boolean(petition && sector && sector !== "unknown");
  const canAct = canShowOutput && isUnlocked;

  const amountLabel = useMemo(() => `₦${PRICE_NGN.toLocaleString()}`, []);

  // 1) Restore draft/unlock after redirect
  useEffect(() => {
    // Restore draft
    const draft = safeJsonParse(localStorage.getItem(LS_DRAFT_KEY), null);
    if (draft?.petition) {
      setComplaint(draft.complaint || "");
      setSector(draft.sector || "");
      setPetition(draft.petition || "");
      setRouting(
        draft.routing || {
          subject: "",
          to: [],
          cc: [],
          mailto: "",
          mentionedInstitutions: [],
          truncated: { to: false, cc: false },
        }
      );
      setFullName(draft.fullName || "");
      setAddress(draft.address || "");
      setPhone(draft.phone || "");
    }

    // Restore unlock (soft restore)
    const unlock = safeJsonParse(localStorage.getItem(LS_UNLOCK_KEY), null);
    if (unlock?.ok && unlock.expiresAt && Date.now() < unlock.expiresAt) {
      setIsUnlocked(true);
      setUnlockMsg("✓ Payment verified. Actions unlocked.");
    }

    // If redirected back from Flutterwave
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const tx_ref = params.get("tx_ref");
    const transaction_id = params.get("transaction_id");

    const isSuccessPath =
      window.location.pathname.includes("/payment-success") || (status && tx_ref);

    if (isSuccessPath) {
      verifyPayment({ status, tx_ref, transaction_id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveDraftToLocalStorage(next = {}) {
    const payload = {
      complaint,
      sector,
      petition,
      routing,
      fullName,
      address,
      phone,
      ...next,
      savedAt: Date.now(),
    };
    localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(payload));
  }

  function clearUnlockAndDraft() {
    localStorage.removeItem(LS_UNLOCK_KEY);
    localStorage.removeItem(LS_DRAFT_KEY);
  }

  // Flutterwave verify
  async function verifyPayment({ status, tx_ref, transaction_id }) {
    if (!transaction_id && !tx_ref) {
      setUnlockMsg("⚠ Payment return received but missing reference.");
      return;
    }

    setUnlocking(true);
    setUnlockMsg("Verifying payment...");

    try {
      const qs = new URLSearchParams();
      if (transaction_id) qs.set("transaction_id", transaction_id);
      if (tx_ref) qs.set("tx_ref", tx_ref);

      const res = await fetch(`${API_BASE}/pay/verify?${qs.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setIsUnlocked(false);
        setUnlockMsg(`✗ Payment not verified. ${(data?.error || "").trim()}`);
        // clean URL anyway
        window.history.replaceState({}, "", "/");
        return;
      }

      // Unlock for a short window (e.g. 20 minutes)
      const expiresAt = Date.now() + 20 * 60 * 1000;
      localStorage.setItem(
        LS_UNLOCK_KEY,
        JSON.stringify({ ok: true, tx_ref: data.tx_ref || tx_ref, expiresAt })
      );

      setIsUnlocked(true);
      setUnlockMsg("✓ Payment verified. Actions unlocked.");

      // clean URL back to home route
      window.history.replaceState({}, "", "/");
    } catch (e) {
      console.error(e);
      setIsUnlocked(false);
      setUnlockMsg("✗ Could not verify payment. Try again.");
    } finally {
      setUnlocking(false);
    }
  }

  // Disable copy attempts in locked mode
  function onLockedCopy(e) {
    if (!isUnlocked) {
      e.preventDefault();
      alert(`🔒 Copy disabled. Pay ${amountLabel} to unlock actions.`);
    }
  }

  // 2) Generate petition (always LOCK after generating)
  async function handleGenerate() {
    setLoading(true);
    setPetition("");
    setSector("");
    setRouting({
      subject: "",
      to: [],
      cc: [],
      mailto: "",
      mentionedInstitutions: [],
      truncated: { to: false, cc: false },
    });

    // Lock by default on new generation
    setIsUnlocked(false);
    localStorage.removeItem(LS_UNLOCK_KEY);

    try {
      // (1) classify
      const sRes = await fetch(`${API_BASE}/classify-sector`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaint }),
      });
      const sData = await sRes.json().catch(() => ({}));
      const detected = (sData.sector || "unknown").trim().toLowerCase();
      setSector(detected);

      if (detected === "unknown") {
        setPetition("✗ Sector not recognized. Add more details (bank name, AEDC, NCC, flight, etc).");
        setLoading(false);
        return;
      }

      // (2) generate petition
      const pRes = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint,
          sector: detected,
          petitioner: {
            fullName: fullName || "",
            address: address || "",
            phone: phone || "",
            evidenceName: evidence?.name || "None",
          },
        }),
      });

      const pData = await pRes.json().catch(() => ({}));
      const petitionText = pData.petition || "✗ Failed to generate petition.";
      setPetition(petitionText);

      // (3) routing
      const rRes = await fetch(`${API_BASE}/email-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint,
          sector: detected,
          petitionText,
        }),
      });

      const rData = await rRes.json().catch(() => ({}));

      setRouting({
        subject: rData.subject || "",
        to: rData.to || [],
        cc: rData.cc || [],
        mailto: rData.mailto || "",
        mentionedInstitutions: rData.mentionedInstitutions || [],
        truncated: rData.truncated || { to: false, cc: false },
      });

      // Save draft so if user pays and returns, petition is still there
      saveDraftToLocalStorage({
        sector: detected,
        petition: petitionText,
        routing: {
          subject: rData.subject || "",
          to: rData.to || [],
          cc: rData.cc || [],
          mailto: rData.mailto || "",
          mentionedInstitutions: rData.mentionedInstitutions || [],
          truncated: rData.truncated || { to: false, cc: false },
        },
      });

      setUnlockMsg(`🔒 Locked. Pay ${amountLabel} to unlock actions.`);
    } catch (err) {
      console.error(err);
      setPetition("✗ Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  }

  // 3) Start payment (Flutterwave)
  async function handleUnlockPay() {
    if (!canShowOutput) {
      alert("Generate a valid petition first.");
      return;
    }

    setUnlocking(true);
    setUnlockMsg("Preparing payment...");

    try {
      // persist draft before redirect
      saveDraftToLocalStorage();

      const res = await fetch(`${API_BASE}/pay/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: PRICE_NGN,
          currency: "NGN",
          email: "user@petitiondesk.com", // optional: replace later with user email input
          name: fullName || "PetitionDesk User",
          phone: phone || "",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.link) {
        setUnlockMsg(`✗ Payment init failed. ${(data?.error || "").trim()}`);
        setUnlocking(false);
        return;
      }

      // Redirect to Flutterwave checkout
      window.location.href = data.link;
    } catch (e) {
      console.error(e);
      setUnlockMsg("✗ Payment init failed. Try again.");
      setUnlocking(false);
    }
  }

  // 4) Send email (UNLOCK REQUIRED)
  function handleSendEmail() {
    if (!canShowOutput) {
      alert("Generate a valid petition first.");
      return;
    }
    if (!isUnlocked) {
      alert(`🔒 Locked. Pay ${amountLabel} to unlock Send Email / Download PDF.`);
      return;
    }
    if (!routing.mailto) {
      alert("✗ No verified emails found for routing. Fix sector JSON (emails missing).");
      return;
    }

    // open mail client
    window.location.href = routing.mailto;

    // re-lock immediately + clear draft (cannot detect actual send success)
    clearUnlockAndDraft();
    setIsUnlocked(false);

    // refresh to reset UI
    setTimeout(() => window.location.reload(), 700);
  }

  // 5) Download PDF (UNLOCK REQUIRED)
  async function handleDownloadPDF() {
    if (!canShowOutput) {
      alert("Generate a valid petition first.");
      return;
    }
    if (!isUnlocked) {
      alert(`🔒 Locked. Pay ${amountLabel} to unlock Download PDF.`);
      return;
    }

    try {
      const url = `${API_BASE}/download-pdf?sector=${encodeURIComponent(sector)}&text=${encodeURIComponent(
        petition
      )}`;

      const res = await fetch(url);
      if (!res.ok) {
        alert("✗ PDF generation failed.");
        return;
      }

      const blob = await res.blob();
      const fileUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = `${sector}-petition.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (err) {
      alert("✗ Error downloading PDF.");
      console.error(err);
    }
  }

  const sectors = useMemo(
    () => [
      { value: "", label: "Auto-detect" },
      { value: "banking", label: "Banking" },
      { value: "telecoms", label: "Telecoms" },
      { value: "power", label: "Power" },
      { value: "aviation", label: "Aviation" },
      { value: "education", label: "Education" },
      { value: "health", label: "Health" },
      { value: "security", label: "Security" },
      { value: "judiciary", label: "Judiciary" },
      { value: "international_escalation", label: "International Escalation" },
    ],
    []
  );

  return (
    <div className="page">
      <div className="card">
        {/* Header */}
        <header className="pd-header">
          <div className="pd-header__inner">
            <div className="pd-brand">
              <div className="pd-logo" aria-hidden="true">
                PD
              </div>
              <div className="pd-titleWrap">
                <h1 className="pd-title">PetitionDesk</h1>
                <p className="pd-subtitle">Legal AI Petition Generator</p>
              </div>
            </div>

            <div className="pd-badge" title="AI-assisted drafting">
              AI-Assisted
            </div>
          </div>
        </header>

        {/* Form */}
        <div className="section">
          <div className="grid">
            <input
              className="fieldInput"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              className="fieldInput"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <input
              className="fieldInput gridSpan2"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <select
            className="select"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            title="Optional override. Auto-detect is recommended."
          >
            {sectors.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <textarea
            className="textarea"
            placeholder="Enter your complaint..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
          />

          <label className="evidenceLabel">
            📎 Evidence
            <input
              className="fileInput"
              type="file"
              onChange={(e) => setEvidence(e.target.files?.[0] || null)}
            />
          </label>

          <button className="btn" onClick={handleGenerate} disabled={loading}>
            {loading ? "Generating..." : "Generate Petition"}
          </button>

          {/* PAY + UNLOCK PANEL */}
          {canShowOutput && (
            <div className="payPanel">
              <div className="payPanel__left">
                <div className={`payStatus ${isUnlocked ? "ok" : "locked"}`}>
                  {isUnlocked ? "✓ Unlocked" : `🔒 Locked — Pay ${amountLabel} to unlock`}
                </div>
                {unlockMsg ? <div className="payHint">{unlockMsg}</div> : null}
              </div>

              <div className="payPanel__right">
                <button
                  className="btnPay"
                  onClick={handleUnlockPay}
                  disabled={unlocking || isUnlocked}
                  title="Pay with Flutterwave to unlock Send/Download"
                >
                  {isUnlocked ? "Unlocked" : unlocking ? "Please wait..." : `Pay ${amountLabel}`}
                </button>
              </div>
            </div>
          )}

          <div className="actions">
            <button className="btnOutline" onClick={handleSendEmail} disabled={!canAct}>
              Send Email
            </button>
            <button className="btnOutline" onClick={handleDownloadPDF} disabled={!canAct}>
              Download PDF
            </button>
          </div>

          {/* Routing Summary */}
          {sector && sector !== "unknown" && (
            <div className="resultBox">
              <div style={{ fontSize: 14 }}>
                <strong>Detected sector:</strong> {sector}
              </div>

              <div style={{ marginTop: 10, fontSize: 13 }}>
                <strong>Email Subject:</strong> {routing.subject || "—"}
              </div>

              {routing.truncated?.to || routing.truncated?.cc ? (
                <div style={{ fontSize: 12, color: "#a00", marginTop: 6 }}>
                  ⚠ Mail client limit: only the first 10 recipients
                </div>
              ) : null}

              <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6 }}>
                <div>
                  <strong>Mentioned institutions (used for routing):</strong>{" "}
                  {routing.mentionedInstitutions?.length
                    ? routing.mentionedInstitutions.join(", ")
                    : "None"}
                </div>

                <div style={{ marginTop: 10 }}>
                  <div>
                    <strong>TO:</strong> {routing.to?.length ? routing.to.join(", ") : "—"}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong>CC:</strong> {routing.cc?.length ? routing.cc.join(", ") : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Petition Output */}
          <div className="outputWrap">
            <pre
              className={`petitionText ${isUnlocked ? "" : "locked"}`}
              onCopy={onLockedCopy}
              onCut={onLockedCopy}
              onPaste={onLockedCopy}
              onContextMenu={(e) => {
                if (!isUnlocked) e.preventDefault();
              }}
            >
              {petition || ""}
            </pre>

            {!isUnlocked && canShowOutput && (
              <div className="lockOverlay" aria-hidden="true">
                <div className="lockOverlay__box">
                  <div className="lockOverlay__title">🔒 Actions Locked</div>
                  <div className="lockOverlay__text">
                    Pay <b>{amountLabel}</b> to unlock <b>Send Email</b> and <b>Download PDF</b>.
                    Copy is disabled in locked mode.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, fontSize: 10, textAlign: "center" }}>
            Powered by PetitionDesk
          </div>
        </div>
      </div>
    </div>
  );
}
