import {
  useEffect,
  useState,
} from "react";

import "./support.css";

const API_BASE = String(
  import.meta.env.VITE_API_BASE_URL ||
    "/api"
)
  .trim()
  .replace(/\/+$/, "");

const DEFAULT_CATEGORIES = [
  {
    id: "petition_generation",
    label:
      "Petition generation problem",
  },
  {
    id: "payment_unlock",
    label:
      "Payment or unlock problem",
  },
  {
    id: "pdf_download",
    label:
      "PDF download problem",
  },
  {
    id: "wrong_routing",
    label:
      "Wrong institution, email or address",
  },
  {
    id: "information_request",
    label:
      "Request for information",
  },
  {
    id: "privacy_data",
    label:
      "Privacy or personal-data enquiry",
  },
  {
    id: "partnership_media",
    label:
      "Partnership or media enquiry",
  },
  {
    id: "other",
    label: "Other",
  },
];

function emptyForm() {
  return {
    fullName: "",
    email: "",
    phone: "",
    category:
      "petition_generation",
    subject: "",
    message: "",
    petitionRef:
      localStorage.getItem(
        "pd_last_tx_ref"
      ) || "",
    paymentRef: "",
    consent: false,
    website: "",
  };
}

export default function ContactPage() {
  const [
    categories,
    setCategories,
  ] = useState(
    DEFAULT_CATEGORIES
  );

  const [
    supportEmail,
    setSupportEmail,
  ] = useState(
    "info@petitiondesk.com"
  );

  const [form, setForm] =
    useState(emptyForm);

  const [
    formStartedAt,
    setFormStartedAt,
  ] = useState(Date.now());

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(null);

  useEffect(() => {
    document.title =
      "Contact and Support | PetitionDesk";

    fetch(
      `${API_BASE}/support/config`
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {
        if (
          data?.ok &&
          Array.isArray(
            data.categories
          ) &&
          data.categories.length
        ) {
          setCategories(
            data.categories
          );
        }

        if (data?.supportEmail) {
          setSupportEmail(
            data.supportEmail
          );
        }
      })
      .catch(() => {});
  }, []);

  function updateField(
    event
  ) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function submitTicket(
    event
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccess(null);

    try {
      const response = await fetch(
        `${API_BASE}/support/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...form,
            formStartedAt,
          }),
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Your support request could not be submitted."
        );
      }

      localStorage.setItem(
        "pd_last_support_ref",
        data.supportRef || ""
      );

      setSuccess(data);
      setForm(emptyForm());
      setFormStartedAt(
        Date.now()
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Your support request could not be submitted."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="pd-page">
      <div className="pd-container">
        <header className="pd-topbar">
          <a
            className="pd-brand"
            href="/"
          >
            <span className="pd-logo">
              PD
            </span>
            <span>PetitionDesk</span>
          </a>

          <nav className="pd-nav">
            <a href="/">
              Draft Petition
            </a>
            <a href="/contact">
              Contact Support
            </a>
          </nav>
        </header>

        <section className="pd-hero">
          <h1>
            Contact and Support
          </h1>

          <p>
            Report a petition,
            payment, download or
            routing problem. You will
            receive a unique support
            reference after your
            request is recorded.
          </p>
        </section>

        {success && (
          <section
            className="pd-message pd-message-success"
            aria-live="polite"
          >
            <strong>
              Your support request
              has been received.
            </strong>

            <div className="pd-reference">
              {success.supportRef}
            </div>

            <div>
              Save this reference.
              It identifies your
              request when contacting
              PetitionDesk.
            </div>
          </section>
        )}

        {error && (
          <section
            className="pd-message pd-message-error"
            role="alert"
          >
            {error}
          </section>
        )}

        <div className="pd-grid">
          <section className="pd-card">
            <h2>
              Submit a support request
            </h2>

            <form
              onSubmit={submitTicket}
            >
              <div className="pd-field">
                <label htmlFor="fullName">
                  Full name{" "}
                  <span className="pd-required">
                    *
                  </span>
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  className="pd-input"
                  value={
                    form.fullName
                  }
                  onChange={
                    updateField
                  }
                  maxLength="120"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="pd-field">
                <label htmlFor="email">
                  Email address{" "}
                  <span className="pd-required">
                    *
                  </span>
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  className="pd-input"
                  value={form.email}
                  onChange={
                    updateField
                  }
                  maxLength="200"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="pd-field">
                <label htmlFor="phone">
                  Phone number
                  (optional)
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="pd-input"
                  value={form.phone}
                  onChange={
                    updateField
                  }
                  maxLength="40"
                  autoComplete="tel"
                />
              </div>

              <div className="pd-field">
                <label htmlFor="category">
                  Support category{" "}
                  <span className="pd-required">
                    *
                  </span>
                </label>

                <select
                  id="category"
                  name="category"
                  className="pd-select"
                  value={
                    form.category
                  }
                  onChange={
                    updateField
                  }
                  required
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="pd-field">
                <label htmlFor="subject">
                  Subject{" "}
                  <span className="pd-required">
                    *
                  </span>
                </label>

                <input
                  id="subject"
                  name="subject"
                  className="pd-input"
                  value={
                    form.subject
                  }
                  onChange={
                    updateField
                  }
                  minLength="3"
                  maxLength="160"
                  required
                />
              </div>

              <div className="pd-field">
                <label htmlFor="petitionRef">
                  Petition transaction
                  reference
                  (optional)
                </label>

                <input
                  id="petitionRef"
                  name="petitionRef"
                  className="pd-input"
                  value={
                    form.petitionRef
                  }
                  onChange={
                    updateField
                  }
                  maxLength="120"
                  placeholder="Example: pd_..."
                />
              </div>

              <div className="pd-field">
                <label htmlFor="paymentRef">
                  Payment reference
                  (optional)
                </label>

                <input
                  id="paymentRef"
                  name="paymentRef"
                  className="pd-input"
                  value={
                    form.paymentRef
                  }
                  onChange={
                    updateField
                  }
                  maxLength="120"
                />
              </div>

              <div className="pd-field">
                <label htmlFor="message">
                  Message{" "}
                  <span className="pd-required">
                    *
                  </span>
                </label>

                <textarea
                  id="message"
                  name="message"
                  className="pd-textarea"
                  value={
                    form.message
                  }
                  onChange={
                    updateField
                  }
                  minLength="10"
                  maxLength="5000"
                  placeholder="Explain what happened, what you expected, and any error message you received."
                  required
                />
              </div>

              <div className="pd-hidden-field">
                <label htmlFor="website">
                  Website
                </label>

                <input
                  id="website"
                  name="website"
                  value={
                    form.website
                  }
                  onChange={
                    updateField
                  }
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              <label className="pd-checkbox-row">
                <input
                  name="consent"
                  type="checkbox"
                  checked={
                    form.consent
                  }
                  onChange={
                    updateField
                  }
                  required
                />

                <span>
                  I consent to
                  PetitionDesk using
                  the information
                  supplied here to
                  review and respond
                  to this support
                  request.
                </span>
              </label>

              <button
                className="pd-primary-button"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Support Request"}
              </button>
            </form>
          </section>

          <aside className="pd-card">
            <h3>
              Before submitting
            </h3>

            <ul className="pd-help-list">
              <li>
                Include your petition
                reference for
                generation or unlock
                problems.
              </li>
              <li>
                Include your payment
                reference when a
                payment was made.
              </li>
              <li>
                Do not submit bank
                card details,
                passwords, NIN or
                confidential evidence.
              </li>
              <li>
                Report incorrect
                institution details
                using the wrong
                routing category.
              </li>
            </ul>

            <h3
              style={{
                marginTop: "24px",
              }}
            >
              Support email
            </h3>

            <p className="pd-muted">
              <a
                href={`mailto:${supportEmail}`}
              >
                {supportEmail}
              </a>
            </p>

            <p className="pd-muted pd-small">
              The online form records
              your request directly in
              the protected
              PetitionDesk support
              inbox.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
