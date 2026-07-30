export default function FreeAccessPanel({
  enabled,
  accessLoading,
  accessStatus,
  user,
  identityLoading,
  identityBusy,
  identityMessage,
  identityError,
  needsEmailConfirmation,
  email,
  setEmail,
  onSendLink,
  onCompleteLink,
  onSignOut,
}) {
  if (
    !enabled
  ) {
    return null;
  }

  const freeLimit =
    Number(
      accessStatus
        ?.freeLimit ??
      2
    );

  const freeRemaining =
    Number(
      accessStatus
        ?.freeRemaining ??
      0
    );

  return (
    <section
      style={{
        margin:
          "0 0 26px",
        padding:
          "22px",
        border:
          "1px solid #d8c47b",
        borderRadius:
          "16px",
        background:
          "linear-gradient(135deg, #fffdf5, #f4fff6)",
        boxShadow:
          "0 8px 24px rgba(28, 74, 43, 0.08)",
        color:
          "#17351f",
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
            "16px",
          flexWrap:
            "wrap",
        }}
      >
        <div
          style={{
            flex:
              "1 1 420px",
          }}
        >
          <div
            style={{
              color:
                "#946600",
              fontSize:
                "12px",
              fontWeight:
                "800",
              letterSpacing:
                "0.11em",
              textTransform:
                "uppercase",
            }}
          >
            First-time access
          </div>

          <h2
            style={{
              margin:
                "5px 0 8px",
              color:
                "#075c36",
              fontSize:
                "23px",
              lineHeight:
                1.25,
            }}
          >
            Your first two complete petitions are free
          </h2>

          <p
            style={{
              margin:
                0,
              maxWidth:
                "650px",
              color:
                "#44584a",
              lineHeight:
                1.6,
            }}
          >
            Verify your email, describe what happened and review the recommended authority. A free use is counted only when the complete petition is successfully unlocked.
          </p>
        </div>

        {user && (
          <div
            style={{
              minWidth:
                "170px",
              padding:
                "12px 14px",
              borderRadius:
                "12px",
              background:
                "#e8f6eb",
              border:
                "1px solid #9ec9a7",
              textAlign:
                "center",
            }}
          >
            {accessLoading ? (
              <strong
                style={{
                  display:
                    "block",
                  color:
                    "#075c36",
                }}
              >
                Checking balance…
              </strong>
            ) : (
              <>
                <strong
                  style={{
                    display:
                      "block",
                    color:
                      "#075c36",
                    fontSize:
                      "22px",
                  }}
                >
                  {freeRemaining} of {freeLimit}
                </strong>

                <span
                  style={{
                    color:
                      "#47634f",
                    fontSize:
                      "13px",
                  }}
                >
                  free petitions remaining
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {(
        identityMessage ||
        identityError
      ) && (
        <div
          style={{
            marginTop:
              "16px",
            padding:
              "12px 14px",
            borderRadius:
              "10px",
            background:
              identityError
                ? "#fff1f1"
                : "#edf9ef",
            border:
              identityError
                ? "1px solid #dca4a4"
                : "1px solid #a9d0b0",
            color:
              identityError
                ? "#8b1f1f"
                : "#175d29",
            lineHeight:
              1.5,
          }}
        >
          {
            identityError ||
            identityMessage
          }
        </div>
      )}

      {!user &&
        !identityLoading && (
        <div
          style={{
            display:
              "flex",
            alignItems:
              "stretch",
            gap:
              "10px",
            flexWrap:
              "wrap",
            marginTop:
              "18px",
          }}
        >
          <input
            type="email"
            value={
              email
            }
            onChange={(
              event
            ) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="Enter your email address"
            style={{
              flex:
                "1 1 260px",
              minWidth:
                0,
              padding:
                "14px",
              border:
                "1px solid #b7cbbb",
              borderRadius:
                "10px",
              fontSize:
                "16px",
              background:
                "#ffffff",
            }}
          />

          <button
            type="button"
            disabled={
              identityBusy ||
              !email.trim()
            }
            onClick={() =>
              needsEmailConfirmation
                ? onCompleteLink(
                    email
                  )
                : onSendLink(
                    email
                  )
            }
            style={{
              flex:
                "0 1 auto",
              padding:
                "14px 18px",
              border:
                "none",
              borderRadius:
                "10px",
              background:
                identityBusy
                  ? "#9ca69e"
                  : "#075c36",
              color:
                "#ffffff",
              fontWeight:
                "800",
              cursor:
                identityBusy
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {identityBusy
              ? "Please wait..."
              : needsEmailConfirmation
              ? "Complete Verification"
              : "Send Verification Link"}
          </button>
        </div>
      )}

      {identityLoading && (
        <div
          style={{
            marginTop:
              "16px",
            color:
              "#526357",
          }}
        >
          Checking your verified access…
        </div>
      )}

      {user && (
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap:
              "12px",
            flexWrap:
              "wrap",
            marginTop:
              "17px",
            paddingTop:
              "15px",
            borderTop:
              "1px solid #d8e6da",
          }}
        >
          <div>
            <strong
              style={{
                color:
                  "#075c36",
              }}
            >
              ✓ Verified email
            </strong>

            <div
              style={{
                marginTop:
                  "3px",
                color:
                  "#526357",
                fontSize:
                  "14px",
              }}
            >
              {
                user.email
              }
            </div>
          </div>

          <button
            type="button"
            onClick={
              onSignOut
            }
            disabled={
              identityBusy
            }
            style={{
              padding:
                "9px 13px",
              border:
                "1px solid #9db5a2",
              borderRadius:
                "9px",
              background:
                "#ffffff",
              color:
                "#075c36",
              fontWeight:
                "700",
              cursor:
                identityBusy
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </section>
  );
}
