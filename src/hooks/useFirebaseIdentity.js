import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  completePasswordlessSignIn,
  currentUrlIsEmailSignInLink,
  getStoredSignInEmail,
  observeFirebaseUser,
  sendPasswordlessSignInLink,
  signOutFirebaseUser,
} from "../lib/firebaseIdentity.js";

function friendlyIdentityError(
  error
) {
  const code =
    String(
      error?.code ||
      ""
    );

  if (
    code.includes(
      "invalid-action-code"
    ) ||
    code.includes(
      "expired-action-code"
    )
  ) {
    return "This verification link has expired or has already been used. Request a new verification link.";
  }

  if (
    code.includes(
      "invalid-email"
    )
  ) {
    return "Enter a valid email address.";
  }

  if (
    code.includes(
      "too-many-requests"
    )
  ) {
    return "Too many verification attempts were made. Wait briefly and try again.";
  }

  if (
    code.includes(
      "unauthorized-domain"
    )
  ) {
    return "This website address is not yet authorised for email verification.";
  }

  return (
    error?.message ||
    "Email verification failed."
  );
}

function cleanAuthenticationUrl() {
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
}

export default function useFirebaseIdentity() {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    needsEmailConfirmation,
    setNeedsEmailConfirmation,
  ] = useState(false);

  useEffect(
    () => {
      let disposed =
        false;

      let unsubscribe =
        () => {};

      async function initialiseIdentity() {
        try {
          const isEmailLink =
            await currentUrlIsEmailSignInLink();

          if (isEmailLink) {
            const storedEmail =
              getStoredSignInEmail();

            if (storedEmail) {
              await completePasswordlessSignIn(
                storedEmail
              );

              cleanAuthenticationUrl();

              if (!disposed) {
                setNeedsEmailConfirmation(
                  false
                );

                setMessage(
                  "Your email has been verified successfully."
                );
              }
            } else if (!disposed) {
              setNeedsEmailConfirmation(
                true
              );

              setMessage(
                "Enter the same email address that received this verification link."
              );
            }
          }

          unsubscribe =
            await observeFirebaseUser(
              (
                nextUser
              ) => {
                if (!disposed) {
                  setUser(
                    nextUser
                  );
                }
              }
            );

          if (disposed) {
            unsubscribe();
          }
        } catch (
          initialisationError
        ) {
          if (!disposed) {
            setError(
              friendlyIdentityError(
                initialisationError
              )
            );
          }
        } finally {
          if (!disposed) {
            setLoading(
              false
            );
          }
        }
      }

      initialiseIdentity();

      return () => {
        disposed =
          true;

        unsubscribe();
      };
    },
    []
  );

  const sendLink =
    useCallback(
      async (
        email
      ) => {
        setBusy(true);
        setError("");
        setMessage("");

        try {
          const normalizedEmail =
            await sendPasswordlessSignInLink(
              email
            );

          setMessage(
            `A secure verification link was sent to ${normalizedEmail}. Open the email and tap the link to continue.`
          );

          setNeedsEmailConfirmation(
            false
          );
        } catch (
          sendError
        ) {
          setError(
            friendlyIdentityError(
              sendError
            )
          );
        } finally {
          setBusy(false);
        }
      },
      []
    );

  const completeLink =
    useCallback(
      async (
        email
      ) => {
        setBusy(true);
        setError("");
        setMessage("");

        try {
          const completedUser =
            await completePasswordlessSignIn(
              email
            );

          setUser(
            completedUser
          );

          setNeedsEmailConfirmation(
            false
          );

          setMessage(
            "Your email has been verified successfully."
          );

          cleanAuthenticationUrl();
        } catch (
          completionError
        ) {
          setError(
            friendlyIdentityError(
              completionError
            )
          );
        } finally {
          setBusy(false);
        }
      },
      []
    );

  const signOutUser =
    useCallback(
      async () => {
        setBusy(true);
        setError("");
        setMessage("");

        try {
          await signOutFirebaseUser();

          setUser(
            null
          );

          setMessage(
            "You have signed out."
          );
        } catch (
          signOutError
        ) {
          setError(
            friendlyIdentityError(
              signOutError
            )
          );
        } finally {
          setBusy(false);
        }
      },
      []
    );

  return {
    user,
    loading,
    busy,
    message,
    error,
    needsEmailConfirmation,
    sendLink,
    completeLink,
    signOutUser,
  };
}
