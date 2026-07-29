// src/App.jsx
import { useEffect, useRef, useState } from "react";

function deliveryMethodLabel(
  value
) {
  const labels = {
    physical_filing:
      "Physical filing at the registry",
    email_or_walk_in:
      "Verified email or walk-in submission",
    personal_delivery:
      "Personal delivery to the landlord or property manager",
  };

  return (
    labels[value] ||
    String(value || "")
      .replace(/_/g, " ")
  );
}

function jurisdictionLabel(
  value
) {
  const labels = {
    fct:
      "Federal Capital Territory",
    lagos:
      "Lagos State",
    other:
      "Other or unconfirmed jurisdiction",
  };

  return (
    labels[value] ||
    value ||
    "Not specified"
  );
}

function RoutingDecisionCard({
  decision,
  emailRoutingAvailable,
}) {
  if (
    !decision ||
    decision.matched !== true
  ) {
    return null;
  }

  const emailAvailable =
    emailRoutingAvailable === true;

  return (
    <section
      style={{
        margin: "22px 0",
        padding: "20px",
        border:
          "1px solid #a7cfad",
        borderRadius: "14px",
        background:
          "#f1fff3",
        color: "#143b1c",
        lineHeight: 1.6,
      }}
    >
      <h3
        style={{
          margin:
            "0 0 14px",
          color: "#006600",
          fontSize: "20px",
        }}
      >
        Verified delivery route
      </h3>

      <div>
        <strong>
          Document:
        </strong>{" "}
        {
          decision.documentPurpose
        }
      </div>

      <div>
        <strong>
          Recipient:
        </strong>{" "}
        {
          decision.primaryInstitution
        }
      </div>

      <div>
        <strong>
          Jurisdiction:
        </strong>{" "}
        {jurisdictionLabel(
          decision.jurisdiction
        )}
      </div>

      <div>
        <strong>
          Delivery:
        </strong>{" "}
        {deliveryMethodLabel(
          decision.deliveryMethod
        )}
      </div>

      {decision.routingNote && (
        <p
          style={{
            margin:
              "14px 0 0",
          }}
        >
          {
            decision.routingNote
          }
        </p>
      )}

      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          borderRadius: "10px",
          background:
            emailAvailable
              ? "#e4f8e8"
              : "#fff7df",
          border:
            emailAvailable
              ? "1px solid #95c99f"
              : "1px solid #e0c77b",
          fontWeight: "700",
        }}
      >
        {emailAvailable
          ? "A verified email route will be available after the document is unlocked."
          : "No verified email route is available for this recipient. Unlock the document, download or print it, and follow the filing or delivery instructions above."}
      </div>
    </section>
  );
}

export default function App() {
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [
    disputeLocation,
    setDisputeLocation,
  ] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [preview, setPreview] = useState("");
  const [txRef, setTxRef] = useState("");
  const [needsPayment, setNeedsPayment] = useState(false);

  const [unlocked, setUnlocked] = useState(false);
  const [petitionText, setPetitionText] = useState("");

  // ✅ restored fields you had before
  const [sector, setSector] = useState("");
  const [mentionedInstitutions, setMentionedInstitutions] = useState([]);
  const [toEmails, setToEmails] = useState([]);
  const [ccEmails, setCcEmails] = useState([]);
  const [mailto, setMailto] = useState("");

  const [
    routingDecision,
    setRoutingDecision,
  ] = useState(null);

  const [
    emailRoutingAvailable,
    setEmailRoutingAvailable,
  ] = useState(false);

  // ✅ Admin mode (30 mins)
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminActive, setAdminActive] = useState(false);

  // PetitionDesk API endpoint
  const API_BASE = String(
    import.meta.env.VITE_API_BASE_URL || "/api"
  )
    .trim()
    .replace(/\/+$/, "");

  // ---- hidden admin trigger (tap PD logo 5 times)
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  function handleLogoTap() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 1200);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setAdminModalOpen(true);
    }
  }

  function getAdminToken() {
    const token = sessionStorage.getItem("pd_admin_token") || "";
    const until = Number(sessionStorage.getItem("pd_admin_until") || 0);
    if (!token || !until) return "";
    if (Date.now() > until) {
      sessionStorage.removeItem("pd_admin_token");
      sessionStorage.removeItem("pd_admin_until");
      return "";
    }
    return token;
  }

  function syncAdminActive() {
    const token = getAdminToken();
    setAdminActive(Boolean(token));
  }

  async function createAdminSession() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKeyInput.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Admin session failed");

      if (data.ok && data.token) {
        const ttlMs = Number(data.expiresInSeconds || 1800) * 1000;
        sessionStorage.setItem("pd_admin_token", data.token);
        sessionStorage.setItem("pd_admin_until", String(Date.now() + ttlMs));
        setAdminActive(true);
        setAdminModalOpen(false);
        setAdminKeyInput("");
        setError("");
      } else {
        throw new Error("Admin session failed");
      }
    } catch (e) {
      setError(e?.message || "Admin session failed");
    } finally {
      setLoading(false);
    }
  }

  function clearAdmin() {
    sessionStorage.removeItem("pd_admin_token");
    sessionStorage.removeItem("pd_admin_until");
    setAdminActive(false);
  }

  // ===========
  // Generate
  // ===========
  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setPreview("");
    setTxRef("");
    setNeedsPayment(false);

    setUnlocked(false);
    setPetitionText("");
    setSector("");
    setMentionedInstitutions([]);
    setToEmails([]);
    setCcEmails([]);
    setMailto("");
    setRoutingDecision(null);
    setEmailRoutingAvailable(false);

    try {
      const res = await fetch(`${API_BASE}/generate-petition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint:
            description.trim(),

          disputeLocation:
            disputeLocation.trim(),

          petitioner: {
            fullName: fullName.trim(),
            address: address.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

      setPreview(
        data.preview || ""
      );

      setTxRef(
        data.tx_ref || ""
      );

      setNeedsPayment(
        data.needsPayment !== false
      );

      setSector(
        data.sector || ""
      );

      setRoutingDecision(
        data.routingDecision ||
          null
      );

      setEmailRoutingAvailable(
        data.emailRoutingAvailable ===
          true
      );

      if (data.tx_ref) {
        localStorage.setItem("pd_last_tx_ref", data.tx_ref);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to generate petition");
    } finally {
      setLoading(false);
    }
  }

  // ===========
  // Pay
  // ===========
  async function handlePay() {
    if (!txRef) return;
    setLoading(true);
    setError("");

    try {
      localStorage.setItem("pd_pending_tx_ref", txRef);

      const res = await fetch(`${API_BASE}/pay/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_ref: txRef,
          amount: 1050,
          currency: "NGN",
          email: email.trim() || "user@petitiondesk.com",
          name: fullName.trim() || "PetitionDesk User",
          phone: phone.trim() || "",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Payment init error ${res.status}`);

      if (data.ok && data.link) {
        window.location.href = data.link;
      } else {
        throw new Error(data.error || "Could not start payment");
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || "Payment failed. Try again.");
      setLoading(false);
    }
  }

  // ===========
  // Unlock
  // ===========
  async function unlockByTxRef(ref, attempt = 1) {
    if (!ref) return;

    setLoading(true);

    try {
      const adminToken = getAdminToken();

      const res = await fetch(`${API_BASE}/unlock-petition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        body: JSON.stringify({ tx_ref: ref }),
      });

      const data = await res.json().catch(() => ({}));

      // Pending = retry (but keep it gentle)
      if (res.status === 202 || data?.pending) {
        setLoading(false);
        setError("Payment processing… please wait a moment.");

        if (attempt < 12) {
          setTimeout(() => unlockByTxRef(ref, attempt + 1), 2500);
        } else {
          setError("Still processing. Please refresh in 1 minute.");
        }
        return;
      }

      if (!res.ok) {
        const unlockError =
          new Error(
            data.error ||
              `Unlock error ${res.status}`
          );

        unlockError.status =
          res.status;

        throw unlockError;
      }

      if (data.ok && data.unlocked) {
        setUnlocked(true);
        setPetitionText(data.petition || "");

        // ✅ restored details
        setSector(
          data.sector || ""
        );

        setMentionedInstitutions([
          ...(
            data.mentionedInstitutions ||
            []
          ),
          ...(
            data.toInstitutions ||
            []
          ),
          ...(
            data.ccInstitutions ||
            []
          ),
        ].filter(
          (
            value,
            index,
            values
          ) =>
            value &&
            values.indexOf(
              value
            ) === index
        ));

        setToEmails(
          data.to || []
        );

        setCcEmails(
          data.cc || []
        );

        setMailto(
          data.mailto || ""
        );

        setRoutingDecision(
          data.routingDecision ||
            null
        );

        setEmailRoutingAvailable(
          data.emailRoutingAvailable ===
            true
        );

        // only clear tx refs when paid unlock (admin should not wipe)
        if (!data.admin) {
          localStorage.removeItem("pd_pending_tx_ref");
          localStorage.removeItem("pd_last_tx_ref");
        }

        // clean URL
        window.history.replaceState({}, document.title, "/");
        setError("");
      } else {
        throw new Error(data.error || "Could not unlock petition");
      }
    } catch (err) {
      console.error(err);

      const expired =
        err?.status === 404 ||
        /petition expired/i.test(
          String(
            err?.message || ""
          )
        );

      if (expired) {
        localStorage.removeItem(
          "pd_pending_tx_ref"
        );

        localStorage.removeItem(
          "pd_last_tx_ref"
        );

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        setError(
          "This petition session has expired. Generate a new petition, or use Contact Support if payment was already made."
        );
      } else {
        setError(
          err?.message ||
            "Verification failed. If charged, contact support."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // ===========
  // Download PDF
  // ===========
  function handleDownloadPdf() {
    if (!petitionText) return;
    const url = `${API_BASE}/download-pdf?text=${encodeURIComponent(petitionText)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    // ✅ only relock for normal users (admin mode stays unlocked for testing)
    if (!adminActive) {
      relockNow();
    }
  }

  // ===========
  // Relock
  // ===========
  function relockNow() {
    setUnlocked(false);
    setPetitionText("");
    setSector("");
    setMentionedInstitutions([]);
    setToEmails([]);
    setCcEmails([]);
    setMailto("");
    setRoutingDecision(null);
    setEmailRoutingAvailable(false);
  }

  // ===========
  // On load: track visit + unlock if redirected back with tx_ref
  // ===========
  useEffect(() => {
    // track visit (counter)
    fetch(`${API_BASE}/track/visit`, { method: "POST" }).catch(() => {});

    syncAdminActive();

    const urlParams = new URLSearchParams(window.location.search);
    const returnedTxRef = urlParams.get("tx_ref");

    const pending =
      localStorage.getItem(
        "pd_pending_tx_ref"
      );

    /*
     * Only retry an actual payment
     * return or pending payment.
     * A previously generated reference
     * must not trigger an automatic
     * unlock on every homepage visit.
     */
    const refToUse =
      returnedTxRef ||
      pending;

    if (refToUse) {
      unlockByTxRef(refToUse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "20px",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      {/* Moving Disclaimer */}
      <div
        style={{
          backgroundColor: "#006600",
          color: "#ffffff",
          padding: "14px 0",
          overflow: "hidden",
          whiteSpace: "nowrap",
          marginBottom: "24px",
          borderRadius: "12px",
          boxShadow: "0 4px 15px rgba(0, 102, 0, 0.2)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            paddingLeft: "100%",
            animation: "marquee 35s linear infinite",
            fontSize: "15px",
            fontWeight: "500",
          }}
        >
          ✨ PetitionDesk is an advanced AI-powered tool designed to help you draft professional petitions quickly and clearly.
          It provides structured drafts based on your input. For official submission, always review with a qualified lawyer.
          Your peace of mind matters to us. ✨ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          ✨ PetitionDesk — Empowering your voice with smart, professional drafting assistance...
        </div>
      </div>

      {/* Admin banner */}
      {adminActive && (
        <div
          style={{
            background: "#111",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: "10px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "14px",
          }}
        >
          <span>🛠 Admin Test Mode (unlocked actions won’t re-lock)</span>
          <button
            onClick={clearAdmin}
            style={{
              background: "#fff",
              color: "#111",
              border: "none",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            Exit Admin
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #006600, #009900)",
          color: "#ffffff",
          padding: "28px 20px",
          borderRadius: "16px",
          textAlign: "center",
          marginBottom: "40px",
          boxShadow: "0 6px 20px rgba(0, 102, 0, 0.3)",
          position: "relative",
        }}
      >
        <div
          onClick={handleLogoTap}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            backgroundColor: "#ffffff",
            color: "#006600",
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            userSelect: "none",
            cursor: "pointer",
          }}
          title="(Admin: tap 5 times)"
        >
          PD
        </div>

        <h1 style={{ fontSize: "42px", fontWeight: "900", margin: "0 0 8px 0", letterSpacing: "-1px" }}>
          PetitionDesk
        </h1>

        <p style={{ fontSize: "18px", fontWeight: "500", margin: 0, opacity: 0.95 }}>
          Legal AI Petition Generator
        </p>
      </div>

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "10px",
          margin: "-22px 0 28px",
        }}
        aria-label="PetitionDesk navigation"
      >
        <a
          href="/"
          style={{
            padding: "10px 14px",
            border: "1px solid #c7ddca",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#006600",
            textDecoration: "none",
            fontWeight: "750",
          }}
        >
          Draft Petition
        </a>

        <a
          href="/contact"
          style={{
            padding: "10px 14px",
            border: "1px solid #c7ddca",
            borderRadius: "10px",
            background: "#ffffff",
            color: "#006600",
            textDecoration: "none",
            fontWeight: "750",
          }}
        >
          Contact Support
        </a>

        {adminActive && (
          <a
            href="/admin/support"
            style={{
              padding: "10px 14px",
              border: "1px solid #222",
              borderRadius: "10px",
              background: "#111111",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: "750",
            }}
          >
            Support Inbox
          </a>
        )}
      </nav>

      {/* Admin modal */}
      {adminModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 9999,
          }}
          onClick={() => setAdminModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#fff",
              borderRadius: "16px",
              padding: "22px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "10px", color: "#006600" }}>Admin Unlock (30 mins)</h3>
            <p style={{ marginTop: 0, color: "#444", fontSize: "14px" }}>
              Enter your admin key to enable test mode (no re-lock after download/email).
            </p>

            <input
              value={adminKeyInput}
              onChange={(e) => setAdminKeyInput(e.target.value)}
              placeholder="Admin key"
              style={inputStyle}
              autoFocus
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
              <button
                disabled={loading || !adminKeyInput.trim()}
                onClick={createAdminSession}
                style={{
                  flex: 1,
                  padding: "14px",
                  backgroundColor: loading ? "#aaa" : "#006600",
                  color: "#fff",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "10px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Enable Admin
              </button>
              <button
                onClick={() => setAdminModalOpen(false)}
                style={{
                  padding: "14px",
                  backgroundColor: "#eee",
                  color: "#111",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!unlocked ? (
        <>
          <form
            onSubmit={handleGenerate}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "22px",
              backgroundColor: "#ffffff",
              padding: "32px",
              borderRadius: "16px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            }}
          >
            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />

            <label
              style={{
                fontWeight: "600",
                color: "#222",
                fontSize: "15px",
              }}
            >
              Your Address
            </label>

            <input
              value={address}
              onChange={(event) =>
                setAddress(
                  event.target.value
                )
              }
              style={inputStyle}
            />

            <label
              style={{
                fontWeight: "600",
                color: "#222",
                fontSize: "15px",
              }}
            >
              Where did this issue occur?
            </label>

            <input
              value={
                disputeLocation
              }
              onChange={(event) =>
                setDisputeLocation(
                  event.target.value
                )
              }
              style={inputStyle}
              placeholder="State, FCT, city or country"
              required
            />

            <div
              style={{
                marginTop: "-14px",
                color: "#555",
                fontSize: "13px",
                lineHeight: 1.45,
              }}
            >
              This location helps
              PetitionDesk select the
              proper institution and
              delivery method.
            </div>

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>Your Complaint</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
            />

            <button
              disabled={loading || !description.trim()}
              style={{
                padding: "16px",
                backgroundColor: loading ? "#aaa" : "#006600",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "17px",
                border: "none",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Generating..." : "Generate Petition"}
            </button>
          </form>

          {needsPayment && (
            <div style={{ marginTop: "40px" }}>
              <RoutingDecisionCard
                decision={
                  routingDecision
                }
                emailRoutingAvailable={
                  emailRoutingAvailable
                }
              />

              <h2 style={{ color: "#006600", textAlign: "center", marginBottom: "20px" }}>
                Petition Preview
              </h2>

              <div
                style={{
                  position: "relative",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              >
                <pre
                  style={{
                    padding: "32px",
                    margin: 0,
                    fontSize: "15px",
                    lineHeight: "1.65",
                    whiteSpace: "pre-wrap",
                    textAlign: "justify",
                    background: "linear-gradient(to bottom, #ffffff 0%, #f8fff8 65%, #e8f5e8 100%)",
                    minHeight: "520px",
                    borderRadius: "12px",
                  }}
                >
                  {preview}
                </pre>

                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "200px",
                    background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <button
                onClick={handlePay}
                disabled={loading}
                style={{
                  marginTop: "30px",
                  width: "100%",
                  padding: "16px",
                  backgroundColor: loading ? "#ccc" : "#006600",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "12px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading
                  ? "Processing..."
                  : routingDecision?.routeKey ===
                    "formal_notice"
                  ? "Pay ₦1,050 to Unlock Full Notice"
                  : "Pay ₦1,050 to Unlock Full Document"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
          <h2 style={{ color: "#006600", textAlign: "center" }}>Your Generated Petition</h2>

          {/* ✅ restored metadata */}
          {(sector || mentionedInstitutions.length > 0) && (
            <div
              style={{
                margin: "14px 0 18px",
                padding: "14px",
                border: "1px solid #e6e6e6",
                borderRadius: "12px",
                background: "#fafafa",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              {sector && <div><b>Sector:</b> {sector}</div>}
              {mentionedInstitutions.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <b>Mentioned institutions:</b>
                  <ul style={{ margin: "6px 0 0 18px" }}>
                    {mentionedInstitutions.slice(0, 12).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(toEmails.length > 0 || ccEmails.length > 0) && (
                <div style={{ marginTop: "10px" }}>
                  {toEmails.length > 0 && <div><b>To:</b> {toEmails.join(", ")}</div>}
                  {ccEmails.length > 0 && <div><b>CC:</b> {ccEmails.join(", ")}</div>}
                </div>
              )}
            </div>
          )}

          <RoutingDecisionCard
            decision={
              routingDecision
            }
            emailRoutingAvailable={
              emailRoutingAvailable
            }
          />

          <pre style={{ whiteSpace: "pre-wrap", fontSize: "15px", lineHeight: "1.6" }}>{petitionText}</pre>

          {/* ✅ Evidence/Download PDF button restored */}
          <button
            onClick={handleDownloadPdf}
            style={{
              display: "block",
              margin: "20px auto 0",
              padding: "16px",
              backgroundColor: "#006600",
              color: "#fff",
              textAlign: "center",
              borderRadius: "12px",
              textDecoration: "none",
              fontSize: "17px",
              fontWeight: "bold",
              maxWidth: "400px",
              width: "100%",
              border: "none",
              cursor: "pointer",
            }}
          >
            Download PDF (Evidence)
          </button>

          {/* ✅ Send email button restored */}
          {mailto && (
            <a
              href={mailto}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // ✅ only relock for non-admin
                if (!adminActive) {
                  setTimeout(() => relockNow(), 1000);
                }
              }}
              style={{
                display: "block",
                margin: "20px auto 0",
                padding: "16px",
                backgroundColor: "#006600",
                color: "#fff",
                textAlign: "center",
                borderRadius: "12px",
                textDecoration: "none",
                fontSize: "17px",
                fontWeight: "bold",
                maxWidth: "400px",
              }}
            >
              Open Email & Send Petition
            </a>
          )}
        </div>
      )}

      {error && (
        <div style={{ color: "red", textAlign: "center", marginTop: "20px", fontWeight: "bold" }}>
          {error}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "14px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  fontSize: "16px",
  backgroundColor: "#fff",
};
