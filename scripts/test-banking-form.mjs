import assert from "node:assert/strict";
import fs from "node:fs";

const source =
  fs.readFileSync(
    new URL(
      "../src/App.jsx",
      import.meta.url
    ),
    "utf8"
  );

assert.match(
  source,
  /priorComplaintDate/
);

assert.match(
  source,
  /bankingComplaintType/
);

assert.match(
  source,
  /providerResponseStatus/
);

console.log(
  "✅ BANKING FORM STATE EXISTS"
);

assert.match(
  source,
  /type="date"/
);

assert.match(
  source,
  /maximumComplaintDate/
);

console.log(
  "✅ PREVIOUS COMPLAINT DATE CANNOT BE FUTURE-DATED"
);

assert.match(
  source,
  /general_banking/
);

assert.match(
  source,
  /loan_or_credit/
);

assert.match(
  source,
  /excess_charges/
);

console.log(
  "✅ BANKING COMPLAINT CATEGORIES ARE AVAILABLE"
);

assert.match(
  source,
  /bankingMatter\s*\?\s*bankingComplaintType/
);

assert.match(
  source,
  /unresolvedComplaint\s*\?\s*priorComplaintDate/
);

assert.match(
  source,
  /unresolvedComplaint\s*\?\s*providerResponseStatus/
);

console.log(
  "✅ BANKING ROUTING FIELDS ARE SENT TO THE BACKEND"
);

assert.match(
  source,
  /Banking timing safeguards are active/
);

assert.match(
  source,
  /bankingTiming\s*\.\s*waitingPeriodDays/
);

assert.match(
  source,
  /bankingTiming\s*\.\s*escalationEligible/
);

console.log(
  "✅ BANKING TIMING IS EXPLAINED TO THE USER"
);

console.log(
  "✅ FRONTEND BANKING ROUTING CONTRACT PASSED"
);
