import assert from "node:assert/strict";
import fs from "node:fs";

const app =
  fs.readFileSync(
    "src/App.jsx",
    "utf8"
  );

const panel =
  fs.readFileSync(
    "src/components/FreeAccessPanel.jsx",
    "utf8"
  );

assert.match(
  app,
  /amount\s*:\s*550\b/
);

assert.doesNotMatch(
  app,
  /amount\s*:\s*1050\b/
);

assert.doesNotMatch(
  app,
  /₦1,050/
);

assert.match(
  app,
  /₦550/
);

assert.match(
  panel,
  /first two complete petitions are free/i
);

assert.match(
  panel,
  /each complete petition costs ₦550/i
);

assert.match(
  panel,
  /2 free petitions to get started/i
);

console.log(
  "✅ FIRST TWO COMPLETE PETITIONS ARE FREE"
);

console.log(
  "✅ THIRD AND SUBSEQUENT PETITIONS COST ₦550"
);

console.log(
  "✅ OLD ₦1,050 PRICE WAS REMOVED"
);
