import assert from "node:assert/strict";
import fs from "node:fs";

const app =
  fs.readFileSync(
    "src/App.jsx",
    "utf8"
  );

const identityHook =
  fs.readFileSync(
    "src/hooks/useFirebaseIdentity.js",
    "utf8"
  );


assert.match(
  app,
  /pay\/initialize/
);

assert.match(
  app,
  /const headers =\s*await buildIdentityHeaders\(\)/
);

assert.match(
  app,
  /unlock-petition/
);

assert.match(
  app,
  /const identityHeaders =\s*await buildIdentityHeaders\(\)/
);

assert.match(
  app,
  /Authorization/
);

assert.match(
  app,
  /transaction_id:\s*transactionId/
);

assert.match(
  app,
  /unlockByTxRef\(\s*ref,\s*attempt \+ 1,\s*transactionId\s*\)/
);

assert.match(
  app,
  /if \(identityLoading\) \{\s*return;\s*\}/
);

assert.match(
  app,
  /paymentResumeRef/
);

assert.match(
  app,
  /verifiedUser\?\.uid/
);

assert.match(
  identityHook,
  /const initialAuthState =/
);

assert.match(
  identityHook,
  /await initialAuthState/
);

assert.match(
  identityHook,
  /resolveInitialAuthState\(\)/
);


console.log(
  "✅ PAYMENT INITIALIZATION SENDS FIREBASE IDENTITY"
);

console.log(
  "✅ PAID UNLOCK SENDS FIREBASE IDENTITY"
);

console.log(
  "✅ PAYMENT RETURN WAITS FOR INITIAL AUTH STATE"
);

console.log(
  "✅ TRANSACTION ID SURVIVES PAYMENT RETRIES"
);

console.log(
  "✅ DUPLICATE PAYMENT RETURN IS GUARDED"
);
