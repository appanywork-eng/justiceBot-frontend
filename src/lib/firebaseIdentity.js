import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";

import {
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
} from "firebase/auth";

const EMAIL_STORAGE_KEY =
  "pd_email_for_signin";

let authPromise = null;

function normalizeEmail(
  value
) {
  return String(
    value ||
    ""
  )
    .trim()
    .toLowerCase();
}

async function fetchFirebaseConfiguration() {
  const configurationUrls = [
    "/__/firebase/init.json",

    "https://petitiondesk-backend.web.app/__/firebase/init.json",
  ];

  let lastError = null;

  for (
    const url
    of configurationUrls
  ) {
    try {
      const response =
        await fetch(
          url,
          {
            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          `Firebase configuration returned ${response.status}.`
        );
      }

      const configuration =
        await response.json();

      /*
       * appId is optional for FirebaseOptions.
       * Authentication requires these core
       * configuration values.
       */
      const requiredFields = [
        "apiKey",
        "authDomain",
        "projectId",
      ];

      const missingFields =
        requiredFields.filter(
          (
            field
          ) =>
            !String(
              configuration
                ?.[field] ||
              ""
            ).trim()
        );

      if (
        missingFields.length
      ) {
        throw new Error(
          `Firebase configuration is missing ${missingFields.join(", ")}.`
        );
      }

      return configuration;
    } catch (
      error
    ) {
      lastError =
        error;
    }
  }

  throw new Error(
    lastError?.message ||
    "Firebase configuration could not be loaded."
  );
}

export async function getFirebaseAuthClient() {
  if (!authPromise) {
    authPromise =
      (async () => {
        const firebaseConfiguration =
          await fetchFirebaseConfiguration();

        const app =
          getApps().length > 0
            ? getApp()
            : initializeApp(
                firebaseConfiguration
              );

        return getAuth(
          app
        );
      })();
  }

  return authPromise;
}

export function getStoredSignInEmail() {
  return normalizeEmail(
    localStorage.getItem(
      EMAIL_STORAGE_KEY
    )
  );
}

export function clearStoredSignInEmail() {
  localStorage.removeItem(
    EMAIL_STORAGE_KEY
  );
}

export async function sendPasswordlessSignInLink(
  email
) {
  const normalizedEmail =
    normalizeEmail(
      email
    );

  if (
    !normalizedEmail ||
    !normalizedEmail.includes(
      "@"
    )
  ) {
    throw new Error(
      "Enter a valid email address."
    );
  }

  const auth =
    await getFirebaseAuthClient();

  const continueUrl =
    new URL(
      "/",
      window.location.origin
    );

  continueUrl.searchParams.set(
    "pd_auth",
    "complete"
  );

  await sendSignInLinkToEmail(
    auth,
    normalizedEmail,
    {
      url:
        continueUrl.toString(),

      handleCodeInApp:
        true,
    }
  );

  localStorage.setItem(
    EMAIL_STORAGE_KEY,
    normalizedEmail
  );

  return normalizedEmail;
}

export async function currentUrlIsEmailSignInLink() {
  const auth =
    await getFirebaseAuthClient();

  return isSignInWithEmailLink(
    auth,
    window.location.href
  );
}

export async function completePasswordlessSignIn(
  email
) {
  const normalizedEmail =
    normalizeEmail(
      email
    );

  if (
    !normalizedEmail ||
    !normalizedEmail.includes(
      "@"
    )
  ) {
    throw new Error(
      "Enter the same email address that received the verification link."
    );
  }

  const auth =
    await getFirebaseAuthClient();

  if (
    !isSignInWithEmailLink(
      auth,
      window.location.href
    )
  ) {
    throw new Error(
      "This verification link is invalid, expired or has already been used."
    );
  }

  const credential =
    await signInWithEmailLink(
      auth,
      normalizedEmail,
      window.location.href
    );

  clearStoredSignInEmail();

  return credential.user;
}

export async function observeFirebaseUser(
  callback
) {
  const auth =
    await getFirebaseAuthClient();

  return onAuthStateChanged(
    auth,
    callback
  );
}

export async function signOutFirebaseUser() {
  const auth =
    await getFirebaseAuthClient();

  await signOut(
    auth
  );

  clearStoredSignInEmail();
}
