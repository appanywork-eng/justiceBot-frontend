// src/App.jsx
import { useEffect, useRef, useState } from "react";

import FreeAccessPanel from "./components/FreeAccessPanel.jsx";
import HeroSection from "./components/layout/HeroSection.jsx";
import HowItWorks from "./components/layout/HowItWorks.jsx";
import PetitionProgress from "./components/layout/PetitionProgress.jsx";
import SiteFooter from "./components/layout/SiteFooter.jsx";
import SiteHeader from "./components/layout/SiteHeader.jsx";
import SupportedIssues from "./components/layout/SupportedIssues.jsx";
import useFirebaseIdentity from "./hooks/useFirebaseIdentity.js";

function humanizeCode(
  value
) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    )
    .trim();
}

function safeExternalUrl(
  value
) {
  try {
    const url =
      new URL(
        String(value || "")
      );

    if (
      url.protocol !==
      "https:"
    ) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

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

    email_or_provider_complaint_channel:
      "Verified email or provider complaint channel",

    verified_email_or_physical_filing:
      "Verified email or physical filing",

    official_directory_or_physical_filing:
      "Official directory or physical filing",

    official_ticket_or_consumer_forum:
      "Official complaint ticket or consumer forum",

    official_consumer_complaint_portal:
      "Official consumer complaint portal",

    verified_email_or_complaints_portal:
      "Verified email or official complaints portal",

    verified_email_or_consumer_portal:
      "Verified email or consumer-protection portal",
  };

  return (
    labels[value] ||
    humanizeCode(value)
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

    national_regulated_service:
      "Nigeria — regulated service provider",

    state_electricity_market:
      "State electricity market",

    nerc_consumer_forum:
      "NERC consumer-forum jurisdiction",

    federal_electricity_market:
      "Federal electricity-market jurisdiction",

    national_telecommunications_regulator:
      "Nigeria — telecommunications regulation",

    national_financial_regulator:
      "Nigeria — financial-services regulation",

    national_civil_aviation_regulator:
      "Nigeria — civil-aviation regulation",
  };

  return (
    labels[value] ||
    humanizeCode(value) ||
    "Not specified"
  );
}

function likelyBankingMatter({
  institutionName = "",
  complaint = "",
} = {}) {
  const text =
    `${institutionName} ${complaint}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const bankingSignals = [
    "bank",
    "banking",
    "microfinance",
    "financial institution",
    "account restriction",
    "account suspension",
    "account freeze",
    "withdrawal",
    "debit transaction",
    "bank transfer",
    "failed transfer",
    "loan",
    "credit facility",
    "overdraft",
    "mortgage",
    "unauthorised charge",
    "unauthorized charge",
    "excess charge",
    "wallet",
    "fintech",
    "gtbank",
    "guaranty trust",
    "access bank",
    "first bank",
    "firstbank",
    "uba",
    "zenith",
    "stanbic",
    "tajbank",
    "jaiz",
    "wema",
    "fidelity bank",
    "ecobank",
    "union bank",
    "polaris bank",
    "sterling bank",
    "fcmb",
    "kuda",
    "opay",
    "palmpay",
    "moniepoint",
    "flutterwave",
    "paystack",
    "quickteller",
    "paga",
  ];

  return bankingSignals.some(
    signal =>
      text.includes(signal)
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

  const blocked =
    decision.blockGeneration ===
    true;

  const submissionUrl =
    safeExternalUrl(
      decision.submissionUrl
    );

  const deliveryMethod =
    String(
      decision.deliveryMethod ||
        ""
    );

  const bankingTiming =
    decision.bankingTiming &&
    typeof decision.bankingTiming ===
      "object"
      ? decision.bankingTiming
      : null;

  const usesOfficialPortal =
    Boolean(
      submissionUrl
    ) ||
    deliveryMethod.includes(
      "portal"
    ) ||
    deliveryMethod.includes(
      "ticket"
    ) ||
    deliveryMethod.includes(
      "official"
    ) ||
    deliveryMethod.includes(
      "filing"
    ) ||
    deliveryMethod.includes(
      "submission"
    ) ||
    deliveryMethod.includes(
      "registry"
    ) ||
    deliveryMethod.includes(
      "court"
    ) ||
    deliveryMethod.includes(
      "mission"
    );

  return (
    <section
      className="pd-routing-card"
      style={{
        margin: "22px 0",
        padding: "20px",
        border:
          blocked
            ? "1px solid #d2a43c"
            : "1px solid #a7cfad",
        borderRadius: "14px",
        background:
          blocked
            ? "#fff8df"
            : "#f1fff3",
        color:
          blocked
            ? "#513800"
            : "#143b1c",
        lineHeight: 1.6,
      }}
    >
      <h3
        style={{
          margin:
            "0 0 14px",
          color:
            blocked
              ? "#8a5a00"
              : "#006600",
          fontSize: "20px",
        }}
      >
        {blocked
          ? "Required next step"
          : "Recommended delivery route"}
      </h3>

      {decision.userMessage && (
        <div
          style={{
            marginBottom: "15px",
            padding: "13px",
            borderRadius: "10px",
            background:
              blocked
                ? "#fff0bd"
                : "#e8f6ea",
            border:
              blocked
                ? "1px solid #d6ad42"
                : "1px solid #a7cfad",
            fontWeight: "700",
          }}
        >
          {
            decision.userMessage
          }
        </div>
      )}

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

      {Array.isArray(
        decision.ccInstitutions
      ) &&
        decision.ccInstitutions.length >
          0 && (
          <div>
            <strong>
              Also notify:
            </strong>{" "}
            {
              decision.ccInstitutions.join(
                ", "
              )
            }
          </div>
        )}

      <div>
        <strong>
          Jurisdiction:
        </strong>{" "}
        {jurisdictionLabel(
          decision.jurisdiction
        )}
      </div>

      {bankingTiming && (
        <div
          style={{
            marginTop: "14px",
            padding: "13px",
            borderRadius: "10px",
            border:
              "1px solid #b8d8bd",
            background:
              "#ffffff",
          }}
        >
          <div>
            <strong>
              Banking complaint type:
            </strong>{" "}
            {humanizeCode(
              bankingTiming.complaintType
            )}
          </div>

          <div>
            <strong>
              Applicable resolution period:
            </strong>{" "}
            {
              bankingTiming.waitingPeriodDays
            }{" "}
            days
          </div>

          {Number.isFinite(
            bankingTiming.daysElapsed
          ) && (
            <div>
              <strong>
                Days elapsed:
              </strong>{" "}
              {
                bankingTiming.daysElapsed
              }
            </div>
          )}

          {Number.isFinite(
            bankingTiming.daysRemaining
          ) && (
            <div>
              <strong>
                Days remaining:
              </strong>{" "}
              {
                bankingTiming.daysRemaining
              }
            </div>
          )}

          <div>
            <strong>
              CBN escalation:
            </strong>{" "}
            {bankingTiming
              .escalationEligible
              ? "Eligible"
              : "Not yet eligible"}
          </div>
        </div>
      )}

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

      {submissionUrl && (
        <a
          href={submissionUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            marginTop: "16px",
            padding: "13px 16px",
            borderRadius: "10px",
            background:
              blocked
                ? "#8a5a00"
                : "#006600",
            color: "#ffffff",
            textAlign: "center",
            textDecoration: "none",
            fontWeight: "800",
          }}
        >
          {blocked
            ? "Open Official Guidance"
            : "Open Official Submission Channel"}
        </a>
      )}

      <div
        style={{
          marginTop: "15px",
          padding: "12px",
          borderRadius: "10px",
          background:
            blocked
              ? "#fff0bd"
              : emailAvailable
              ? "#e4f8e8"
              : "#fff7df",
          border:
            blocked
              ? "1px solid #d6ad42"
              : emailAvailable
              ? "1px solid #95c99f"
              : "1px solid #e0c77b",
          fontWeight: "700",
        }}
      >
        {blocked
          ? "PetitionDesk stopped ordinary petition generation to prevent an unsafe, legally incorrect or misdirected submission. Follow the required next step shown above."
          : emailAvailable
          ? "A verified email route will be available after the document is unlocked."
          : usesOfficialPortal
          ? "This route uses an official portal, complaint ticket or published filing channel rather than direct email. Unlock the document and follow the routing instructions above."
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

  const [
    institutionName,
    setInstitutionName,
  ] = useState("");

  const [
    escalationStage,
    setEscalationStage,
  ] = useState("");

  const [
    priorComplaintReference,
    setPriorComplaintReference,
  ] = useState("");

  const [
    priorComplaintDate,
    setPriorComplaintDate,
  ] = useState("");

  const [
    bankingComplaintType,
    setBankingComplaintType,
  ] = useState("");

  const [
    providerResponseStatus,
    setProviderResponseStatus,
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

  const [
    unlockMode,
    setUnlockMode,
  ] = useState("paid");

  const [
    accessStatus,
    setAccessStatus,
  ] = useState({
    enabled: false,
    freeLimit: 2,
    freeUsed: 0,
    freeRemaining: 0,
    requiresPayment: true,
  });

  const [
    accessLoading,
    setAccessLoading,
  ] = useState(true);

  // ✅ Admin mode (30 mins)
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminActive, setAdminActive] = useState(false);

  const bankingMatter =
    likelyBankingMatter({
      institutionName,
      complaint:
        description,
    });

  const unresolvedComplaint =
    escalationStage ===
      "unresolved";

  const maximumComplaintDate =
    new Date(
      Date.now() -
      new Date()
        .getTimezoneOffset() *
        60 *
        1000
    )
      .toISOString()
      .slice(
        0,
        10
      );

  // PetitionDesk API endpoint
  const API_BASE = String(
    import.meta.env.VITE_API_BASE_URL || "/api"
  )
    .trim()
    .replace(/\/+$/, "");

  const {
    user:
      verifiedUser,

    loading:
      identityLoading,

    busy:
      identityBusy,

    message:
      identityMessage,

    error:
      identityError,

    needsEmailConfirmation,

    sendLink:
      sendIdentityLink,

    completeLink:
      completeIdentityLink,

    signOutUser:
      signOutIdentity,
  } = useFirebaseIdentity();

  // ---- hidden admin trigger (tap PD logo 5 times)
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  /*
   * Prevent the same payment return
   * from being processed repeatedly
   * during React state changes.
   */
  const paymentResumeRef =
    useRef("");

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

  async function buildIdentityHeaders() {
    const headers = {
      "Content-Type":
        "application/json",
    };

    if (verifiedUser) {
      const token =
        await verifiedUser.getIdToken();

      headers.Authorization =
        `Bearer ${token}`;
    }

    return headers;
  }

  async function refreshAccessStatus() {
    setAccessLoading(
      true
    );

    try {
      const headers = {};

      if (verifiedUser) {
        const token =
          await verifiedUser.getIdToken();

        headers.Authorization =
          `Bearer ${token}`;
      }

      const response =
        await fetch(
          `${API_BASE}/access/status`,
          {
            headers,
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (!response.ok) {
        if (
          data
            ?.requiresVerification
        ) {
          setAccessStatus({
            enabled: true,
            freeLimit: 2,
            freeUsed: 0,
            freeRemaining: 2,
            requiresPayment: false,
          });

          return;
        }

        throw new Error(
          data.error ||
          "Could not read free-petition access."
        );
      }

      setAccessStatus({
        enabled:
          data.enabled ===
          true,

        freeLimit:
          Number(
            data.freeLimit ??
            2
          ),

        freeUsed:
          Number(
            data.freeUsed ??
            0
          ),

        freeRemaining:
          Number(
            data.freeRemaining ??
            0
          ),

        requiresPayment:
          data.requiresPayment ===
          true,
      });
    } catch (
      accessError
    ) {
      console.error(
        accessError
      );
    } finally {
      setAccessLoading(
        false
      );
    }
  }

  useEffect(
    () => {
      refreshAccessStatus();

      if (
        verifiedUser?.email
      ) {
        setEmail(
          verifiedUser.email
        );
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      verifiedUser,
    ]
  );

  // ===========
  // Generate
  // ===========
  async function handleGenerate(e) {
    e.preventDefault();
    setError("");

    if (
      accessStatus.enabled &&
      !verifiedUser
    ) {
      setError(
        "Verify your email before generating a petition."
      );

      return;
    }

    if (
      bankingMatter &&
      unresolvedComplaint &&
      !priorComplaintDate
    ) {
      const complainedInstitution =
        institutionName.trim() ||
        "the financial institution";

      setError(
        `Enter the date you first complained to ${complainedInstitution} so PetitionDesk can determine whether CBN escalation is due.`
      );

      document
        .getElementById(
          "prior-complaint-date"
        )
        ?.focus();

      return;
    }

    setLoading(true);

    setPreview("");
    setTxRef("");
    setNeedsPayment(false);
    setUnlockMode("paid");

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
        headers:
          await buildIdentityHeaders(),
        body: JSON.stringify({
          complaint:
            description.trim(),

          disputeLocation:
            disputeLocation.trim(),

          issueLocation:
            disputeLocation.trim(),

          institutionName:
            institutionName.trim(),

          escalationStage,

          priorComplaintReference:
            unresolvedComplaint
              ? priorComplaintReference.trim()
              : "",

          priorComplaintDate:
            unresolvedComplaint
              ? priorComplaintDate
              : "",

          bankingComplaintType:
            bankingMatter
              ? bankingComplaintType
              : "",

          providerResponseStatus:
            unresolvedComplaint
              ? providerResponseStatus
              : "",

          petitioner: {
            fullName: fullName.trim(),
            address: address.trim(),
            email: email.trim(),
            phone: phone.trim(),
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const blockedDecision =
          data.routingDecision ||
          null;

        setRoutingDecision(
          blockedDecision
        );

        setSector(
          blockedDecision?.sector ||
          data.sector ||
          ""
        );

        setEmailRoutingAvailable(
          false
        );

        setNeedsPayment(
          false
        );

        setError(
          data.error ||
          `Server error ${res.status}`
        );

        return;
      }

      setPreview(
        data.preview || ""
      );

      setTxRef(
        data.tx_ref || ""
      );

      setNeedsPayment(
        data.needsPayment !== false
      );

      setUnlockMode(
        data.unlockMode ||
        (
          data.needsPayment ===
          false
            ? "free"
            : "paid"
        )
      );

      if (data.access) {
        setAccessStatus(
          data.access
        );
      }

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
    if (!txRef) {
      return;
    }

    if (identityLoading) {
      setError(
        "Please wait while your verified account is restored."
      );

      return;
    }

    if (
      accessStatus.enabled &&
      !verifiedUser
    ) {
      setError(
        "Verify your email before starting payment for this petition."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      /*
       * Adds the Firebase bearer token
       * whenever a verified user exists.
       * This allows the backend to confirm
       * that the payment belongs to the
       * account that generated the petition.
       */
      const headers =
        await buildIdentityHeaders();

      localStorage.setItem(
        "pd_pending_tx_ref",
        txRef
      );

      const res =
        await fetch(
          `${API_BASE}/pay/initialize`,
          {
            method:
              "POST",

            headers,

            body:
              JSON.stringify({
                tx_ref:
                  txRef,

                amount:
                  550,

                currency:
                  "NGN",

                email:
                  email.trim() ||
                  "user@petitiondesk.com",

                name:
                  fullName.trim() ||
                  "PetitionDesk User",

                phone:
                  phone.trim() ||
                  "",
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => ({})
          );

      if (!res.ok) {
        const paymentError =
          new Error(
            data.error ||
            `Payment init error ${res.status}`
          );

        paymentError.status =
          res.status;

        throw paymentError;
      }

      if (
        data.ok &&
        data.link
      ) {
        window.location.href =
          data.link;

        return;
      }

      throw new Error(
        data.error ||
        "Could not start payment"
      );
    } catch (paymentError) {
      console.error(
        paymentError
      );

      localStorage.removeItem(
        "pd_pending_tx_ref"
      );

      setError(
        paymentError?.message ||
        "Payment failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function applyUnlockedPayload(
    data
  ) {
    setUnlocked(
      true
    );

    setPetitionText(
      data.petition ||
      ""
    );

    setSector(
      data.sector ||
      ""
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
      data.to ||
      []
    );

    setCcEmails(
      data.cc ||
      []
    );

    setMailto(
      data.mailto ||
      ""
    );

    setRoutingDecision(
      data.routingDecision ||
      null
    );

    setEmailRoutingAvailable(
      data.emailRoutingAvailable ===
      true
    );

    setNeedsPayment(
      false
    );

    if (data.access) {
      setAccessStatus(
        data.access
      );
    }

    if (!data.admin) {
      localStorage.removeItem(
        "pd_pending_tx_ref"
      );

      localStorage.removeItem(
        "pd_last_tx_ref"
      );
    }

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    setError("");
  }

  async function handleFreeUnlock() {
    if (!txRef) {
      return;
    }

    if (adminActive) {
      await unlockByTxRef(
        txRef
      );

      return;
    }

    if (!verifiedUser) {
      setError(
        "Verify your email before using a free petition."
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `${API_BASE}/free-unlock`,
          {
            method:
              "POST",

            headers:
              await buildIdentityHeaders(),

            body:
              JSON.stringify({
                tx_ref:
                  txRef,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        response.status ===
        402
      ) {
        if (data.access) {
          setAccessStatus(
            data.access
          );
        }

        setUnlockMode(
          "paid"
        );

        setNeedsPayment(
          true
        );

        setError(
          data.error ||
          "Your two free petitions have been used. Pay to unlock this petition."
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
          `Free unlock error ${response.status}`
        );
      }

      if (
        data.ok &&
        data.unlocked
      ) {
        applyUnlockedPayload(
          data
        );

        return;
      }

      throw new Error(
        data.error ||
        "Could not unlock the free petition."
      );
    } catch (
      freeUnlockError
    ) {
      console.error(
        freeUnlockError
      );

      setError(
        freeUnlockError?.message ||
        "Free petition unlock failed."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  // ===========
  // Unlock
  // ===========
  async function unlockByTxRef(
    ref,
    attempt = 1,
    transactionId = ""
  ) {
    if (!ref) {
      return;
    }

    setLoading(true);

    try {
      const adminToken =
        getAdminToken();

      /*
       * Normal users send their Firebase
       * ID token. Administrators retain the
       * separate temporary admin token.
       */
      const identityHeaders =
        await buildIdentityHeaders();

      const res =
        await fetch(
          `${API_BASE}/unlock-petition`,
          {
            method:
              "POST",

            headers: {
              ...identityHeaders,

              ...(adminToken
                ? {
                    "x-admin-token":
                      adminToken,
                  }
                : {}),
            },

            body:
              JSON.stringify({
                tx_ref:
                  ref,

                ...(transactionId
                  ? {
                      transaction_id:
                        transactionId,
                    }
                  : {}),
              }),
          }
        );

      const data =
        await res
          .json()
          .catch(
            () => ({})
          );

      if (
        res.status === 202 ||
        data?.pending
      ) {
        setLoading(false);

        setError(
          "Payment processing… please wait a moment."
        );

        if (attempt < 12) {
          setTimeout(
            () =>
              unlockByTxRef(
                ref,
                attempt + 1,
                transactionId
              ),
            2500
          );
        } else {
          setError(
            "Still processing. Please refresh in 1 minute."
          );
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

      if (
        data.ok &&
        data.unlocked
      ) {
        applyUnlockedPayload(
          data
        );

        return;
      }

      throw new Error(
        data.error ||
        "Could not unlock petition"
      );
    } catch (unlockError) {
      console.error(
        unlockError
      );

      const expired =
        unlockError?.status ===
          404 ||
        /petition expired/i.test(
          String(
            unlockError?.message ||
            ""
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
          unlockError?.message ||
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
    setPreview("");
    setTxRef("");
    setNeedsPayment(false);
    setUnlockMode("paid");
    setSector("");
    setMentionedInstitutions([]);
    setToEmails([]);
    setCcEmails([]);
    setMailto("");
    setRoutingDecision(null);
    setEmailRoutingAvailable(false);
  }

  // ===========
  // Initial page activity
  // ===========
  useEffect(
    () => {
      fetch(
        `${API_BASE}/track/visit`,
        {
          method:
            "POST",
        }
      ).catch(
        () => {}
      );

      syncAdminActive();

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  );

  // ===========
  // Resume payment only after Firebase
  // has restored the initial auth state.
  // ===========
  useEffect(
    () => {
      if (identityLoading) {
        return;
      }

      const urlParams =
        new URLSearchParams(
          window.location.search
        );

      const returnedTxRef =
        urlParams.get(
          "tx_ref"
        );

      const returnedTransactionId =
        urlParams.get(
          "transaction_id"
        ) ||
        "";

      const pending =
        localStorage.getItem(
          "pd_pending_tx_ref"
        );

      const refToUse =
        returnedTxRef ||
        pending;

      if (!refToUse) {
        paymentResumeRef.current =
          "";

        return;
      }

      const resumeKey = [
        refToUse,

        returnedTransactionId,

        verifiedUser?.uid ||
          "anonymous",
      ].join(
        ":"
      );

      if (
        paymentResumeRef.current ===
        resumeKey
      ) {
        return;
      }

      paymentResumeRef.current =
        resumeKey;

      unlockByTxRef(
        refToUse,
        1,
        returnedTransactionId
      );

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      identityLoading,
      verifiedUser,
    ]
  );

  return (
    <div className="pd-app-shell">

      <SiteHeader
        onLogoActivate={
          handleLogoTap
        }
        adminActive={
          adminActive
        }
      />

      <HeroSection />

      <main className="pd-main-content">
        <HowItWorks />

        <SupportedIssues />

        <PetitionProgress
          currentStep={
            unlocked
              ? 3
              : preview
              ? 2
              : 1
          }
        />

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

      <section id="draft-petition">
      <FreeAccessPanel
        enabled={
          accessStatus.enabled
        }
        accessLoading={
          accessLoading
        }
        accessStatus={
          accessStatus
        }
        user={
          verifiedUser
        }
        identityLoading={
          identityLoading
        }
        identityBusy={
          identityBusy
        }
        identityMessage={
          identityMessage
        }
        identityError={
          identityError
        }
        needsEmailConfirmation={
          needsEmailConfirmation
        }
        email={
          email
        }
        setEmail={
          setEmail
        }
        onSendLink={
          sendIdentityLink
        }
        onCompleteLink={
          completeIdentityLink
        }
        onSignOut={
          async () => {
            await signOutIdentity();
            setEmail("");
            relockNow();
          }
        }
      />

      {!unlocked ? (
        <>
          <form
            id="petition-form"
            className="pd-form-card"
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
            <div className="pd-form-intro">
              <div className="pd-eyebrow">
                Step 1 · Describe the issue
              </div>

              <h2>
                Draft your petition
              </h2>

              <p>
                Share the facts. We will structure the petition and suggest the right route.
              </p>
            </div>

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
              Used to choose the right authority and delivery route.
            </div>

            <label
              style={{
                fontWeight: "600",
                color: "#222",
                fontSize: "15px",
              }}
            >
              Organisation, company or agency complained against
            </label>

            <input
              value={
                institutionName
              }
              onChange={(event) =>
                setInstitutionName(
                  event.target.value
                )
              }
              style={inputStyle}
              placeholder="For example: AEDC, MTN, GTBank, Air Peace or a government agency"
            />

            <div
              style={{
                marginTop: "-14px",
                color: "#555",
                fontSize: "13px",
                lineHeight: 1.45,
              }}
            >
              Use the exact organisation name where possible.
            </div>

            <label
              style={{
                fontWeight: "600",
                color: "#222",
                fontSize: "15px",
              }}
            >
              Have you complained to this organisation before?
            </label>

            <select
              value={
                escalationStage
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                setEscalationStage(
                  value
                );

                if (
                  value !==
                  "unresolved"
                ) {
                  setPriorComplaintReference(
                    ""
                  );

                  setPriorComplaintDate(
                    ""
                  );

                  setBankingComplaintType(
                    ""
                  );

                  setProviderResponseStatus(
                    ""
                  );
                }
              }}
              style={inputStyle}
            >
              <option value="">
                Select where you are in the complaint process
              </option>

              <option value="initial">
                No — this is my first formal complaint
              </option>

              <option value="unresolved">
                Yes — I complained, but it remains unresolved
              </option>
            </select>

            <div
              style={{
                marginTop: "-14px",
                color: "#555",
                fontSize: "13px",
                lineHeight: 1.45,
              }}
            >
              Helps prevent premature escalation.
            </div>

            {escalationStage ===
              "unresolved" && (
              <>
                <label
                  style={{
                    fontWeight: "600",
                    color: "#222",
                    fontSize: "15px",
                  }}
                >
                  Previous complaint reference
                </label>

                <input
                  value={
                    priorComplaintReference
                  }
                  onChange={(event) =>
                    setPriorComplaintReference(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="Ticket, reference or tracking number, where available"
                />

                <div
                  style={{
                    marginTop: "-14px",
                    color: "#555",
                    fontSize: "13px",
                    lineHeight: 1.45,
                  }}
                >
                  Required for a regulator-ready escalation. If no reference was issued, PetitionDesk will keep the complaint at the institution follow-up stage.
                </div>

                <label
                  style={{
                    fontWeight:
                      "600",
                    color:
                      "#222",
                    fontSize:
                      "15px",
                  }}
                >
                  Date the previous complaint was submitted
                </label>

                <input
                  id="prior-complaint-date"
                  type="date"
                  value={
                    priorComplaintDate
                  }
                  max={
                    maximumComplaintDate
                  }
                  required={
                    bankingMatter &&
                    unresolvedComplaint
                  }
                  onInvalid={(
                    event
                  ) => {
                    const complainedInstitution =
                      institutionName.trim() ||
                      "the financial institution";

                    event.currentTarget.setCustomValidity(
                      `Enter the date you first complained to ${complainedInstitution} so PetitionDesk can determine whether CBN escalation is due.`
                    );
                  }}
                  onChange={(
                    event
                  ) => {
                    event.currentTarget.setCustomValidity(
                      ""
                    );

                    setPriorComplaintDate(
                      event.target.value
                    );
                  }}
                  style={
                    inputStyle
                  }
                />

                <div
                  style={{
                    marginTop:
                      "-14px",
                    color:
                      "#555",
                    fontSize:
                      "13px",
                    lineHeight:
                      1.45,
                  }}
                >
                  PetitionDesk uses this date to determine whether the applicable complaint-resolution period has expired.
                </div>

                <label
                  style={{
                    fontWeight:
                      "600",
                    color:
                      "#222",
                    fontSize:
                      "15px",
                  }}
                >
                  What happened after your earlier complaint?
                </label>

                <select
                  value={
                    providerResponseStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setProviderResponseStatus(
                      event.target.value
                    )
                  }
                  style={
                    inputStyle
                  }
                >
                  <option value="">
                    Select the organisation's response
                  </option>

                  <option value="no_response">
                    No response
                  </option>

                  <option value="acknowledged_no_resolution">
                    Acknowledged, but not resolved
                  </option>

                  <option value="pending">
                    Still being reviewed
                  </option>

                  <option value="rejected">
                    Complaint was rejected
                  </option>

                  <option value="partially_resolved">
                    Partly resolved
                  </option>
                </select>

                {bankingMatter && (
                  <>
                    <div
                      style={{
                        padding:
                          "14px",
                        borderRadius:
                          "10px",
                        border:
                          "1px solid #b8d8bd",
                        background:
                          "#f1fff3",
                        color:
                          "#143b1c",
                        fontSize:
                          "14px",
                        lineHeight:
                          1.5,
                        fontWeight:
                          "700",
                      }}
                    >
                      Banking timing safeguards are active. PetitionDesk will apply either the general 14-day period or the extended 30-day period before recommending CBN escalation.
                    </div>

                    <label
                      style={{
                        fontWeight:
                          "600",
                        color:
                          "#222",
                        fontSize:
                          "15px",
                      }}
                    >
                      Type of banking complaint
                    </label>

                    <select
                      value={
                        bankingComplaintType
                      }
                      onChange={(
                        event
                      ) =>
                        setBankingComplaintType(
                          event.target.value
                        )
                      }
                      style={
                        inputStyle
                      }
                    >
                      <option value="">
                        Select the closest category
                      </option>

                      <option value="general_banking">
                        General banking, transfer, withdrawal or account complaint
                      </option>

                      <option value="loan_or_credit">
                        Loan, credit facility, overdraft or mortgage
                      </option>

                      <option value="excess_charges">
                        Unauthorised, wrongful or excess charges
                      </option>
                    </select>

                    <div
                      style={{
                        marginTop:
                          "-14px",
                        color:
                          "#555",
                        fontSize:
                          "13px",
                        lineHeight:
                          1.45,
                      }}
                    >
                      General banking complaints use the 14-day period. Loan, credit and excess-charge complaints use the extended 30-day period.
                    </div>
                  </>
                )}
              </>
            )}

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>Email</label>

            <input
              type="email"
              value={
                email
              }
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              disabled={
                accessStatus.enabled &&
                Boolean(
                  verifiedUser
                )
              }
              style={{
                ...inputStyle,

                backgroundColor:
                  accessStatus.enabled &&
                  verifiedUser
                    ? "#edf5ef"
                    : "#ffffff",
              }}
            />

            {accessStatus.enabled &&
              verifiedUser && (
              <div
                style={{
                  marginTop:
                    "-14px",
                  color:
                    "#317047",
                  fontSize:
                    "13px",
                  fontWeight:
                    "700",
                }}
              >
                This verified email is tied to your free-petition allowance.
              </div>
            )}

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />

            <label style={{ fontWeight: "600", color: "#222", fontSize: "15px" }}>Your Complaint</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
            />

            <button
              disabled={
                loading ||
                accessLoading ||
                !description.trim() ||
                (
                  accessStatus.enabled &&
                  !verifiedUser
                )
              }
              style={{
                padding: "16px",
                backgroundColor:
                  loading ||
                  accessLoading ||
                  (
                    accessStatus.enabled &&
                    !verifiedUser
                  )
                    ? "#aaa"
                    : "#006600",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "17px",
                border: "none",
                borderRadius: "10px",
                cursor:
                  loading ||
                  accessLoading ||
                  (
                    accessStatus.enabled &&
                    !verifiedUser
                  )
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "Generating..."
                : accessStatus.enabled &&
                  accessStatus.freeRemaining > 0
                ? "Generate My Free Petition"
                : "Generate Preview"}
            </button>
          </form>

          {routingDecision
            ?.blockGeneration ===
            true && (
            <div
              style={{
                marginTop: "28px",
              }}
            >
              <RoutingDecisionCard
                decision={
                  routingDecision
                }
                emailRoutingAvailable={
                  false
                }
              />
            </div>
          )}

          {preview && (
            <div className="pd-preview-section">
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
                onClick={
                  unlockMode ===
                  "free"
                    ? handleFreeUnlock
                    : handlePay
                }
                disabled={
                  loading
                }
                style={{
                  marginTop: "30px",
                  width: "100%",
                  padding: "16px",
                  backgroundColor:
                    loading
                      ? "#ccc"
                      : "#006600",
                  color: "#fff",
                  fontSize: "18px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "12px",
                  cursor:
                    loading
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {loading
                  ? "Processing..."
                  : unlockMode ===
                    "free"
                  ? routingDecision?.routeKey ===
                    "formal_notice"
                    ? "Unlock Full Notice — Free"
                    : "Unlock Full Petition — Free"
                  : routingDecision?.routeKey ===
                    "formal_notice"
                  ? "Pay ₦550 to Unlock Full Notice"
                  : "Pay ₦550 to Unlock Full Petition"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="pd-generated-section" style={{ background: "#ffffff", padding: "32px", borderRadius: "16px", boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}>
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
        <div
          className="pd-error-message"
          style={{
            color: "red",
            textAlign: "center",
            marginTop: "20px",
            fontWeight: "bold",
          }}
        >
          {error}
        </div>
      )}

      </section>
      </main>

      <SiteFooter />
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
