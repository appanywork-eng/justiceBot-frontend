import {
  useEffect,
  useState,
} from "react";

import BrandMark from "../components/brand/BrandMark.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";

import "./contact.css";

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
    <main className="pd-contact-page">
      <header className="pd-contact-header">
        <div className="pd-contact-container pd-contact-header__inner">
          <BrandMark />

          <nav
            className="pd-contact-navigation"
            aria-label="Support navigation"
          >
            <a href="/">
              Home
            </a>

            <a
              href="/#draft-petition"
              className="pd-contact-navigation__primary"
            >
              Draft
            </a>
          </nav>
        </div>
      </header>

      <section className="pd-contact-hero">
        <div className="pd-contact-container pd-contact-hero__inner">
          <div>
            <div className="pd-contact-eyebrow">
              PetitionDesk support
            </div>

            <h1>
              How can we help?
            </h1>

            <p>
              Report a generation, payment, download or routing
              problem. We will record it and give you a support
              reference.
            </p>
          </div>

          <div
            className="pd-contact-hero__mark"
            aria-hidden="true"
          >
            <img
              src="/petitiondesk-mark.svg"
              alt=""
            />
          </div>
        </div>
      </section>

      <div className="pd-contact-container pd-contact-content">
        {success && (
          <section
            className="pd-contact-message pd-contact-message--success"
            aria-live="polite"
          >
            <strong>
              Support request received
            </strong>

            <p>
              Save this reference:
            </p>

            <div className="pd-contact-reference">
              {success.supportRef}
            </div>
          </section>
        )}

        {error && (
          <section
            className="pd-contact-message pd-contact-message--error"
            role="alert"
          >
            {error}
          </section>
        )}

        <div className="pd-contact-grid">
          <section className="pd-contact-card pd-contact-form-card">
            <div className="pd-contact-card__heading">
              <span className="pd-contact-eyebrow">
                Support request
              </span>

              <h2>
                Tell us what went wrong
              </h2>

              <p>
                Required fields are marked with an asterisk.
              </p>
            </div>

            <form
              className="pd-contact-form"
              onSubmit={submitTicket}
            >
              <div className="pd-contact-form__row">
                <div className="pd-contact-field">
                  <label htmlFor="fullName">
                    Full name
                    <span className="pd-contact-required">
                      *
                    </span>
                  </label>

                  <input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={updateField}
                    maxLength="120"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="pd-contact-field">
                  <label htmlFor="email">
                    Email
                    <span className="pd-contact-required">
                      *
                    </span>
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateField}
                    maxLength="200"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="pd-contact-form__row">
                <div className="pd-contact-field">
                  <label htmlFor="phone">
                    Phone
                    <span className="pd-contact-optional">
                      Optional
                    </span>
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={updateField}
                    maxLength="40"
                    autoComplete="tel"
                  />
                </div>

                <div className="pd-contact-field">
                  <label htmlFor="category">
                    Category
                    <span className="pd-contact-required">
                      *
                    </span>
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    required
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="pd-contact-field">
                <label htmlFor="subject">
                  Subject
                  <span className="pd-contact-required">
                    *
                  </span>
                </label>

                <input
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={updateField}
                  minLength="3"
                  maxLength="160"
                  required
                />
              </div>

              <div className="pd-contact-form__row">
                <div className="pd-contact-field">
                  <label htmlFor="petitionRef">
                    Petition reference
                    <span className="pd-contact-optional">
                      Optional
                    </span>
                  </label>

                  <input
                    id="petitionRef"
                    name="petitionRef"
                    value={form.petitionRef}
                    onChange={updateField}
                    maxLength="120"
                    placeholder="pd_..."
                  />
                </div>

                <div className="pd-contact-field">
                  <label htmlFor="paymentRef">
                    Payment reference
                    <span className="pd-contact-optional">
                      Optional
                    </span>
                  </label>

                  <input
                    id="paymentRef"
                    name="paymentRef"
                    value={form.paymentRef}
                    onChange={updateField}
                    maxLength="120"
                  />
                </div>
              </div>

              <div className="pd-contact-field">
                <label htmlFor="message">
                  What happened?
                  <span className="pd-contact-required">
                    *
                  </span>
                </label>

                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={updateField}
                  minLength="10"
                  maxLength="5000"
                  placeholder="Describe the problem and include any error message."
                  required
                />
              </div>

              <div className="pd-contact-hidden">
                <label htmlFor="website">
                  Website
                </label>

                <input
                  id="website"
                  name="website"
                  value={form.website}
                  onChange={updateField}
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              <label className="pd-contact-consent">
                <input
                  name="consent"
                  type="checkbox"
                  checked={form.consent}
                  onChange={updateField}
                  required
                />

                <span>
                  I consent to PetitionDesk using this information
                  to review and respond to my support request.
                </span>
              </label>

              <button
                className="pd-contact-submit"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Request"}
              </button>
            </form>
          </section>

          <aside className="pd-contact-card pd-contact-help">
            <div className="pd-contact-help__icon">
              i
            </div>

            <h3>
              Include useful details
            </h3>

            <ul>
              <li>
                Add the petition reference for generation or unlock
                problems.
              </li>

              <li>
                Add the payment reference when payment was made.
              </li>

              <li>
                Never submit card details, passwords, NIN or
                confidential evidence.
              </li>
            </ul>

            <div className="pd-contact-email">
              <span>
                Support email
              </span>

              <a href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
