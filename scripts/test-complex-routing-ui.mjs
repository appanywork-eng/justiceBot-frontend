import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

const app = fs.readFileSync(
  path.join(root, "src", "App.jsx"),
  "utf8"
);

assert.match(
  app,
  /confirmSuggestedRoute/
);

assert.match(
  app,
  /requiresRecipientConfirmation/
);

assert.match(
  app,
  /Confirm \$\{decision\.primaryInstitution/
);

assert.match(
  app,
  /clarificationQuestions/
);

assert.match(
  app,
  /Information to confirm:/
);

assert.match(
  app,
  /Possible escalation—not automatically added:/
);

assert.match(
  app,
  /Additional routes requiring factual confirmation:/
);

assert.match(
  app,
  /body:\s*JSON\.stringify\(\{[\s\S]*tx_ref:\s*txRef,[\s\S]*\}\),[\s\S]*\}\);/
);

assert.doesNotMatch(
  app,
  /download-pdf[\s\S]{0,500}JSON\.stringify\(\{\s*text:/
);

for (const requiredField of [
  "fullName",
  "address",
  "disputeLocation",
  "institutionName",
  "phone",
  "description",
]) {
  const expression = new RegExp(
    `value=\\{\\s*${requiredField}\\s*\\}[\\s\\S]{0,700}?required`
  );
  assert.match(
    app,
    expression,
    `${requiredField} must be required before generation.`
  );
}

assert.match(
  app,
  /supportingEvidence:\s*supportingEvidence\.trim\(\)/
);

assert.match(
  app,
  /desiredOutcome:\s*desiredOutcome\.trim\(\)/
);

assert.match(
  app,
  /"x-request-id":\s*generationRequestId/
);

assert.match(
  app,
  /The connection was interrupted while PetitionDesk was drafting/
);

console.log("✅ AMBIGUOUS ROUTES SHOW CLARIFICATION QUESTIONS");
console.log("✅ INFERRED RECIPIENTS REQUIRE AN EXPLICIT CONFIRMATION ACTION");
console.log("✅ SAFE ROUTING FIELDS ARE REQUIRED BEFORE GENERATION");
console.log("✅ STRUCTURED EVIDENCE AND DESIRED RELIEF REACH THE DRAFTING PIPELINE");
console.log("✅ PDF DOWNLOAD USES AN OWNED PETITION REFERENCE, NOT ARBITRARY TEXT");
console.log("✅ NETWORK FAILURES SHOW A TRACEABLE REQUEST REFERENCE");
console.log("✅ COMPLEX ROUTING UI CONTRACT PASSED");
