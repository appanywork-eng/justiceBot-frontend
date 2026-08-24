import {
  useCallback,
  useEffect,
  useState,
} from "react";

function number(value) {
  return Number(
    value || 0
  ).toLocaleString();
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString();
}

function StatCard({
  label,
  value,
  note = "",
}) {
  return (
    <div
      style={{
        background:
          "#ffffff",
        border:
          "1px solid #dce8dd",
        borderRadius:
          "14px",
        padding:
          "16px",
        boxShadow:
          "0 3px 12px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          color:
            "#55605a",
          fontSize:
            "13px",
          fontWeight:
            700,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color:
            "#075f20",
          fontSize:
            "27px",
          fontWeight:
            900,
          marginTop:
            "5px",
        }}
      >
        {number(value)}
      </div>

      {note && (
        <div
          style={{
            color:
              "#777",
            fontSize:
              "11px",
            marginTop:
              "4px",
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

export default function AdminControlCentre({
  apiBase,
  adminToken,
  onExit,
}) {
  const [
    overview,
    setOverview,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [diagnostics, setDiagnostics] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [activeAction, setActiveAction] = useState("");

  const loadOverview =
    useCallback(
      async () => {
        if (
          !adminToken
        ) {
          setError(
            "Admin session has expired."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setError("");

          const headers = {
            "x-admin-token": adminToken,
          };

          const [response, diagnosticsResponse] =
            await Promise.all([
              fetch(`${apiBase}/admin/overview`, { headers }),
              fetch(`${apiBase}/admin/diagnostics`, { headers })
                .catch(() => null),
            ]);

          const data =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ||
              "Could not load administrator data."
            );
          }

          setOverview(
            data
          );

          if (diagnosticsResponse?.ok) {
            setDiagnostics(
              await diagnosticsResponse.json().catch(() => null)
            );
          }
        } catch (
          loadError
        ) {
          setError(
            loadError
              ?.message ||
            "Could not load administrator data."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        apiBase,
        adminToken,
      ]
    );

  async function runAdminAction(action, path, {
    method = "POST",
    body,
    successMessage,
  } = {}) {
    setActiveAction(action);
    setActionMessage("");
    setError("");

    try {
      const response = await fetch(`${apiBase}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "The administrator action could not be completed.");
      }

      setActionMessage(successMessage || "Administrator action completed.");
      await loadOverview();
    } catch (actionError) {
      setError(actionError?.message || "The administrator action could not be completed.");
    } finally {
      setActiveAction("");
    }
  }

  useEffect(
    () => {
      loadOverview();

      const timer =
        setInterval(
          loadOverview,
          30000
        );

      return () =>
        clearInterval(
          timer
        );
    },
    [
      loadOverview,
    ]
  );

  const metrics =
    overview
      ?.metrics ||
    {};

  const usersSummary =
    overview
      ?.usersSummary ||
    {};

  const users =
    Array.isArray(
      overview?.users
    )
      ? overview.users
      : [];

  const cards = [
    [
      "Total visits",
      metrics.visits,
    ],
    [
      "Active visitors now",
      metrics.active_users,
    ],
    [
      "Unique visitors today",
      metrics.daily_users,
    ],
    [
      "New visitors today",
      metrics.new_users_today,
    ],
    [
      "Unique visitors this month",
      metrics.monthly_users,
    ],
    [
      "All-time unique visitors",
      metrics.total_unique_users,
    ],
    [
      "Registered users",
      usersSummary.registered_users,
    ],
    [
      "Verified users",
      usersSummary.verified_users,
    ],
    [
      "New users — 24 hrs",
      usersSummary.new_users_24h,
    ],
    [
      "New users — 30 days",
      usersSummary.new_users_30d,
    ],
    [
      "Recent sign-ins — 24 hrs",
      usersSummary.recent_signins_24h,
    ],
    [
      "Petitions requested",
      metrics.generated,
    ],
    [
      "Petition previews",
      metrics.previewed,
    ],
    [
      "Failed generations",
      metrics.generation_failed,
    ],
    [
      "AI fallback recoveries",
      metrics.ai_fallbacks,
    ],
    [
      "Free petition unlocks",
      metrics.unlocked_free,
    ],
    [
      "Paid petition unlocks",
      metrics.unlocked_paid,
    ],
    [
      "Payment attempts",
      metrics.payment_initiated,
    ],
    [
      "Successful payments",
      metrics.payment_success,
    ],
    [
      "Unique successful payments",
      metrics.unique_paysuccess_txrefs,
    ],
    [
      "Users with free usage",
      usersSummary.users_with_free_usage,
    ],
    [
      "Free access exhausted",
      usersSummary.free_limit_reached,
    ],
    [
      "Users with free access left",
      usersSummary.users_with_free_remaining,
    ],
    [
      "Support requests",
      metrics.support_submitted,
    ],
    [
      "Admin sessions",
      metrics.admin_sessions,
    ],
    [
      "Blocked generation requests",
      metrics.generation_rate_limited,
    ],
    [
      "Failed admin logins",
      metrics.admin_login_failed,
    ],
    [
      "Rejected payment webhooks",
      metrics.webhook_rejected,
    ],
  ];

  return (
    <section
      id="admin-control-centre"
      style={{
        margin:
          "0 0 28px",
        padding:
          "22px",
        borderRadius:
          "18px",
        background:
          "#f4faf5",
        border:
          "2px solid #0b7429",
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap:
            "12px",
          flexWrap:
            "wrap",
        }}
      >
        <div>
          <div
            style={{
              color:
                "#0b7429",
              fontSize:
                "13px",
              fontWeight:
                900,
              textTransform:
                "uppercase",
              letterSpacing:
                ".05em",
            }}
          >
            Administrator
          </div>

          <h2
            style={{
              margin:
                "4px 0 4px",
              color:
                "#12351c",
            }}
          >
            PetitionDesk Control Centre
          </h2>

          <div
            style={{
              color:
                "#5c665f",
              fontSize:
                "13px",
            }}
          >
            Live administrative statistics · automatically refreshes every 30 seconds
          </div>
        </div>

        <div
          style={{
            display:
              "flex",
            gap:
              "8px",
          }}
        >
          <button
            type="button"
            onClick={
              loadOverview
            }
            style={{
              border:
                "1px solid #0b7429",
              background:
                "#ffffff",
              color:
                "#0b7429",
              borderRadius:
                "9px",
              padding:
                "10px 13px",
              fontWeight:
                800,
            }}
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => runAdminAction(
              "reload-sectors",
              "/admin/reload-sectors",
              { successMessage: "Institution routes and sector catalogues were refreshed." }
            )}
            disabled={Boolean(activeAction)}
            style={{
              border: "1px solid #0b7429",
              background: "#ffffff",
              color: "#0b7429",
              borderRadius: "9px",
              padding: "10px 13px",
              fontWeight: 800,
            }}
          >
            {activeAction === "reload-sectors" ? "Refreshing…" : "Refresh Routes"}
          </button>

          <button
            type="button"
            onClick={() => window.location.assign("/admin/support")}
            style={{
              border: "1px solid #0b7429",
              background: "#ffffff",
              color: "#0b7429",
              borderRadius: "9px",
              padding: "10px 13px",
              fontWeight: 800,
            }}
          >
            Support Inbox
          </button>

          <button
            type="button"
            onClick={
              onExit
            }
            style={{
              border:
                "none",
              background:
                "#8b1e1e",
              color:
                "#ffffff",
              borderRadius:
                "9px",
              padding:
                "10px 13px",
              fontWeight:
                800,
            }}
          >
            Exit Admin
          </button>
        </div>
      </div>

      {loading && (
        <div
          style={{
            marginTop:
              "18px",
            padding:
              "14px",
            background:
              "#ffffff",
            borderRadius:
              "10px",
          }}
        >
          Loading administrator data…
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop:
              "18px",
            padding:
              "14px",
            background:
              "#fff1f1",
            border:
              "1px solid #d99999",
            borderRadius:
              "10px",
            color:
              "#8b1e1e",
            fontWeight:
              700,
          }}
        >
          {error}
        </div>
      )}

      {actionMessage && (
        <div
          style={{
            marginTop: "14px",
            padding: "12px",
            background: "#eaf7ed",
            border: "1px solid #a8d2ae",
            borderRadius: "10px",
            color: "#075f20",
            fontWeight: 700,
          }}
        >
          {actionMessage}
        </div>
      )}

      {overview && (
        <>
          {diagnostics && (
            <div
              style={{
                marginTop: "18px",
                padding: "16px",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #dce8dd",
              }}
            >
              <h3 style={{ margin: "0 0 12px", color: "#174323" }}>
                Production System Status
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: "12px",
                  fontSize: "13px",
                  color: "#334039",
                }}
              >
                <div>
                  <strong>AI generation:</strong>{" "}
                  {diagnostics.ai?.configured ? "Ready" : "Not configured"}
                  <br />
                  <span>{diagnostics.ai?.model || "—"}</span>
                </div>

                <div>
                  <strong>Fallback models:</strong>{" "}
                  {diagnostics.ai?.fallbackModels?.join(", ") || "None"}
                  <br />
                  <span>Last success: {formatDate(diagnostics.ai?.lastAiSuccessAt)}</span>
                </div>

                <div>
                  <strong>Payments:</strong>{" "}
                  {diagnostics.payments?.configured ? "Ready" : "Not configured"}
                  <br />
                  <span>
                    Webhook: {diagnostics.payments?.webhookConfigured ? "Protected" : "Needs attention"}
                  </span>
                </div>

                <div>
                  <strong>Access policy:</strong>{" "}
                  {diagnostics.access?.freeAccessEnabled
                    ? `${diagnostics.access?.freePetitionLimit || 0} free petitions`
                    : "Free access disabled"}
                  <br />
                  <span>Then ₦{number(diagnostics.payments?.amountNgn)}</span>
                </div>

                <div>
                  <strong>Storage:</strong>{" "}
                  {diagnostics.storage?.firestoreAvailable ? "Firestore connected" : "Local memory"}
                  <br />
                  <span>
                    Rate limiting: {diagnostics.storage?.sharedRateLimiting ? "Shared" : "Instance-only"}
                  </span>
                </div>

                <div>
                  <strong>Deployed revision:</strong>{" "}
                  {diagnostics.revision || "—"}
                  <br />
                  <span>Last AI error: {diagnostics.ai?.lastAiErrorCode || "None"}</span>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(145px, 1fr))",
              gap:
                "12px",
              marginTop:
                "20px",
            }}
          >
            {cards.map(
              ([
                label,
                value,
              ]) => (
                <StatCard
                  key={
                    label
                  }
                  label={
                    label
                  }
                  value={
                    value
                  }
                />
              )
            )}
          </div>

          <div
            style={{
              marginTop:
                "24px",
              background:
                "#ffffff",
              borderRadius:
                "14px",
              border:
                "1px solid #dce8dd",
              overflow:
                "hidden",
            }}
          >
            <div
              style={{
                padding:
                  "16px",
                borderBottom:
                  "1px solid #e7eee8",
              }}
            >
              <h3
                style={{
                  margin:
                    0,
                  color:
                    "#174323",
                }}
              >
                Registered Users
              </h3>

              <div
                style={{
                  color:
                    "#687169",
                  fontSize:
                    "12px",
                  marginTop:
                    "4px",
                }}
              >
                Firebase-registered accounts and their free-petition usage.
              </div>
            </div>

            <div
              style={{
                overflowX:
                  "auto",
                maxHeight:
                  "500px",
                overflowY:
                  "auto",
              }}
            >
              <table
                style={{
                  width:
                    "100%",
                  borderCollapse:
                    "collapse",
                  minWidth:
                    "820px",
                  fontSize:
                    "13px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#eff7f0",
                      textAlign:
                        "left",
                    }}
                  >
                    {[
                      "Email",
                      "Verified",
                      "Joined",
                      "Last sign-in",
                      "Free used",
                      "Free left",
                      "Status",
                      "Action",
                    ].map(
                      (
                        heading
                      ) => (
                        <th
                          key={
                            heading
                          }
                          style={{
                            padding:
                              "11px",
                            borderBottom:
                              "1px solid #dce8dd",
                          }}
                        >
                          {
                            heading
                          }
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {users.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={
                          8
                        }
                        style={{
                          padding:
                            "20px",
                          textAlign:
                            "center",
                          color:
                            "#777",
                        }}
                      >
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    users.map(
                      (
                        user
                      ) => (
                        <tr
                          key={
                            user.uid
                          }
                        >
                          <td
                            style={{
                              padding:
                                "11px",
                              borderBottom:
                                "1px solid #edf1ed",
                              fontWeight:
                                700,
                            }}
                          >
                            {user.email ||
                              "—"}
                          </td>

                          <td
                            style={{
                              padding:
                                "11px",
                              borderBottom:
                                "1px solid #edf1ed",
                            }}
                          >
                            {user.emailVerified
                              ? "Yes"
                              : "No"}
                          </td>

                          <td
                            style={{
                              padding:
                                "11px",
                              borderBottom:
                                "1px solid #edf1ed",
                            }}
                          >
                            {formatDate(
                              user.createdAt
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "11px",
                              borderBottom:
                                "1px solid #edf1ed",
                            }}
                          >
                            {formatDate(
                              user.lastSignInAt
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "11px",
                              borderBottom:
                                "1px solid #edf1ed",
                            }}
                          >
                            {number(
                              user.freeUsed
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "11px",
                              borderBottom:
                                "1px solid #edf1ed",
                            }}
                          >
                            {number(
                              user.freeRemaining
                            )}
                          </td>

                          <td
                            style={{
                              padding:
                                "11px",
                              borderBottom:
                                "1px solid #edf1ed",
                              fontWeight:
                                800,
                              color:
                                user.disabled
                                  ? "#a11"
                                  : user.requiresPayment
                                  ? "#8a5a00"
                                  : "#08712b",
                            }}
                          >
                            {user.disabled
                              ? "Disabled"
                              : user.requiresPayment
                              ? "Paid access required"
                              : "Free access available"}
                          </td>

                          <td
                            style={{
                              padding: "11px",
                              borderBottom: "1px solid #edf1ed",
                            }}
                          >
                            <button
                              type="button"
                              disabled={Boolean(activeAction)}
                              onClick={() => runAdminAction(
                                `user-${user.uid}`,
                                `/admin/users/${encodeURIComponent(user.uid)}/status`,
                                {
                                  method: "PATCH",
                                  body: { disabled: !user.disabled },
                                  successMessage: user.disabled
                                    ? `${user.email || "User"} was re-enabled.`
                                    : `${user.email || "User"} was disabled.`,
                                }
                              )}
                              style={{
                                border: `1px solid ${user.disabled ? "#0b7429" : "#a11"}`,
                                borderRadius: "8px",
                                padding: "6px 9px",
                                background: "#ffffff",
                                color: user.disabled ? "#0b7429" : "#a11",
                                fontWeight: 700,
                              }}
                            >
                              {activeAction === `user-${user.uid}`
                                ? "Saving…"
                                : user.disabled
                                  ? "Enable"
                                  : "Disable"}
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {Array.isArray(
            overview.warnings
          ) &&
            overview
              .warnings
              .length >
              0 && (
              <div
                style={{
                  marginTop:
                    "14px",
                  fontSize:
                    "12px",
                  color:
                    "#8a5a00",
                }}
              >
                {overview.warnings.join(
                  " "
                )}
              </div>
            )}
        </>
      )}
    </section>
  );
}
