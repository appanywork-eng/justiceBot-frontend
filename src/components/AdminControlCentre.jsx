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

          const response =
            await fetch(
              `${apiBase}/admin/overview`,
              {
                headers: {
                  "x-admin-token":
                    adminToken,
                },
              }
            );

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

      {overview && (
        <>
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
                          7
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
