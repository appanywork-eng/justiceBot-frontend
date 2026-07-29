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

const STATUS_OPTIONS = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

function getStoredToken() {
  const token =
    sessionStorage.getItem(
      "pd_admin_token"
    ) || "";

  const until = Number(
    sessionStorage.getItem(
      "pd_admin_until"
    ) || 0
  );

  if (
    !token ||
    !until ||
    Date.now() > until
  ) {
    sessionStorage.removeItem(
      "pd_admin_token"
    );

    sessionStorage.removeItem(
      "pd_admin_until"
    );

    return "";
  }

  return token;
}

function formatDate(value) {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

export default function AdminSupportPage() {
  const [token, setToken] =
    useState(getStoredToken);

  const [adminKey, setAdminKey] =
    useState("");

  const [tickets, setTickets] =
    useState([]);

  const [drafts, setDrafts] =
    useState({});

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    supportEmail,
    setSupportEmail,
  ] = useState(
    "info@petitiondesk.com"
  );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    document.title =
      "Support Inbox | PetitionDesk";
  }, []);

  useEffect(() => {
    if (token) {
      loadTickets(token);
    }
  }, [token, statusFilter]);

  async function login(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/admin/session`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            key: adminKey.trim(),
          }),
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        !data.token
      ) {
        throw new Error(
          data.error ||
            "Admin login failed."
        );
      }

      const expiresAt =
        Date.now() +
        Number(
          data.expiresInSeconds ||
            1800
        ) *
          1000;

      sessionStorage.setItem(
        "pd_admin_token",
        data.token
      );

      sessionStorage.setItem(
        "pd_admin_until",
        String(expiresAt)
      );

      setToken(data.token);
      setAdminKey("");
    } catch (loginError) {
      setError(
        loginError?.message ||
          "Admin login failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTickets(
    activeToken = token
  ) {
    if (!activeToken) {
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const query = new URLSearchParams({
        limit: "100",
      });

      if (statusFilter) {
        query.set(
          "status",
          statusFilter
        );
      }

      const response = await fetch(
        `${API_BASE}/admin/support/tickets?${query.toString()}`,
        {
          headers: {
            "x-admin-token":
              activeToken,
          },
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (response.status === 401) {
        logout();

        throw new Error(
          "Your admin session expired."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not load support tickets."
        );
      }

      setTickets(
        Array.isArray(data.tickets)
          ? data.tickets
          : []
      );

      setSupportEmail(
        data.supportEmail ||
          "info@petitiondesk.com"
      );

      const nextDrafts = {};

      for (
        const ticket of
        data.tickets || []
      ) {
        nextDrafts[
          ticket.supportRef
        ] = {
          status:
            ticket.status ||
            "open",
          adminNotes:
            ticket.adminNotes ||
            "",
        };
      }

      setDrafts(nextDrafts);
    } catch (loadError) {
      setError(
        loadError?.message ||
          "Could not load support tickets."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(
    supportRef,
    field,
    value
  ) {
    setDrafts((current) => ({
      ...current,
      [supportRef]: {
        ...(current[
          supportRef
        ] || {}),
        [field]: value,
      },
    }));
  }

  async function saveTicket(
    supportRef
  ) {
    const draft =
      drafts[supportRef] || {};

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/admin/support/tickets/${encodeURIComponent(
          supportRef
        )}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            "x-admin-token": token,
          },
          body: JSON.stringify({
            status:
              draft.status,
            adminNotes:
              draft.adminNotes ??
              "",
          }),
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (response.status === 401) {
        logout();

        throw new Error(
          "Your admin session expired."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ticket update failed."
        );
      }

      setTickets((current) =>
        current.map((ticket) =>
          ticket.supportRef ===
          supportRef
            ? data.ticket
            : ticket
        )
      );

      setMessage(
        `${supportRef} was updated successfully.`
      );
    } catch (saveError) {
      setError(
        saveError?.message ||
          "Ticket update failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(
      "pd_admin_token"
    );

    sessionStorage.removeItem(
      "pd_admin_until"
    );

    setToken("");
    setTickets([]);
    setDrafts({});
  }

  if (!token) {
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
              <span>
                PetitionDesk
              </span>
            </a>

            <nav className="pd-nav">
              <a href="/">
                Draft Petition
              </a>
              <a href="/contact">
                Contact
              </a>
            </nav>
          </header>

          <section className="pd-card pd-login-card">
            <h1>
              Support Inbox
            </h1>

            <p className="pd-muted">
              Enter the PetitionDesk
              admin key to open the
              protected support
              inbox.
            </p>

            {error && (
              <div className="pd-message pd-message-error">
                {error}
              </div>
            )}

            <form onSubmit={login}>
              <div className="pd-field">
                <label htmlFor="adminKey">
                  Admin key
                </label>

                <input
                  id="adminKey"
                  type="password"
                  className="pd-input"
                  value={adminKey}
                  onChange={(event) =>
                    setAdminKey(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                className="pd-primary-button"
                disabled={
                  loading ||
                  !adminKey.trim()
                }
              >
                {loading
                  ? "Signing in..."
                  : "Open Support Inbox"}
              </button>
            </form>
          </section>
        </div>
      </main>
    );
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
              Contact
            </a>
            <button
              className="pd-danger-button"
              type="button"
              onClick={logout}
            >
              Sign Out
            </button>
          </nav>
        </header>

        <section className="pd-hero">
          <h1>
            Support Inbox
          </h1>

          <p>
            Review user requests,
            record internal notes and
            update each ticket from
            open through resolution.
          </p>
        </section>

        {error && (
          <div className="pd-message pd-message-error">
            {error}
          </div>
        )}

        {message && (
          <div className="pd-message pd-message-success">
            {message}
          </div>
        )}

        <section className="pd-card">
          <div className="pd-toolbar">
            <div>
              <h2
                style={{
                  marginBottom: "4px",
                }}
              >
                Tickets
              </h2>

              <div className="pd-muted pd-small">
                {tickets.length} shown
                · {supportEmail}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <select
                className="pd-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                style={{
                  width: "auto",
                }}
              >
                <option value="">
                  All statuses
                </option>

                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>

              <button
                className="pd-secondary-button"
                type="button"
                onClick={() =>
                  loadTickets()
                }
                disabled={loading}
              >
                {loading
                  ? "Loading..."
                  : "Refresh"}
              </button>
            </div>
          </div>

          {!loading &&
            tickets.length === 0 && (
              <div className="pd-muted">
                No support tickets
                match this filter.
              </div>
            )}

          <div className="pd-ticket-list">
            {tickets.map(
              (ticket) => {
                const draft =
                  drafts[
                    ticket.supportRef
                  ] || {
                    status:
                      ticket.status,
                    adminNotes:
                      ticket.adminNotes ||
                      "",
                  };

                return (
                  <article
                    className="pd-ticket"
                    key={
                      ticket.supportRef
                    }
                  >
                    <div className="pd-ticket-header">
                      <div>
                        <div className="pd-ticket-ref">
                          {
                            ticket.supportRef
                          }
                        </div>

                        <strong>
                          {
                            ticket.subject
                          }
                        </strong>
                      </div>

                      <span className="pd-status">
                        {
                          ticket.status
                        }
                      </span>
                    </div>

                    <div className="pd-ticket-meta">
                      <div>
                        <strong>
                          User:
                        </strong>{" "}
                        {
                          ticket.fullName
                        }
                      </div>

                      <div>
                        <strong>
                          Email:
                        </strong>{" "}
                        <a
                          href={`mailto:${ticket.email}`}
                        >
                          {
                            ticket.email
                          }
                        </a>
                      </div>

                      <div>
                        <strong>
                          Phone:
                        </strong>{" "}
                        {ticket.phone ||
                          "Not supplied"}
                      </div>

                      <div>
                        <strong>
                          Category:
                        </strong>{" "}
                        {
                          ticket.category
                        }
                      </div>

                      <div>
                        <strong>
                          Created:
                        </strong>{" "}
                        {formatDate(
                          ticket.createdAtIso
                        )}
                      </div>

                      <div>
                        <strong>
                          Petition ref:
                        </strong>{" "}
                        {ticket.petitionRef ||
                          "Not supplied"}
                      </div>

                      <div>
                        <strong>
                          Payment ref:
                        </strong>{" "}
                        {ticket.paymentRef ||
                          "Not supplied"}
                      </div>
                    </div>

                    <div className="pd-ticket-message">
                      {
                        ticket.message
                      }
                    </div>

                    <div className="pd-ticket-actions">
                      <div className="pd-field">
                        <label>
                          Status
                        </label>

                        <select
                          className="pd-select"
                          value={
                            draft.status
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              ticket.supportRef,
                              "status",
                              event.target.value
                            )
                          }
                        >
                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={
                                  status
                                }
                                value={
                                  status
                                }
                              >
                                {
                                  status
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="pd-field">
                        <label>
                          Internal admin
                          notes
                        </label>

                        <textarea
                          className="pd-textarea"
                          style={{
                            minHeight:
                              "90px",
                          }}
                          value={
                            draft.adminNotes
                          }
                          onChange={(
                            event
                          ) =>
                            updateDraft(
                              ticket.supportRef,
                              "adminNotes",
                              event.target.value
                            )
                          }
                          maxLength="2000"
                        />
                      </div>

                      <button
                        className="pd-primary-button"
                        type="button"
                        onClick={() =>
                          saveTicket(
                            ticket.supportRef
                          )
                        }
                        disabled={loading}
                        style={{
                          width: "auto",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
