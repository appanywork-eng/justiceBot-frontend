import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { EDITORIAL_GUIDES } from "./editorial-guides.mjs";

const PUBLISHER = "ca-pub-8064027830057594";
const AD_SCRIPT = /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/gu;
const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

function visibleWordCount(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/giu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
}

const appShell = read("index.html");
assert.match(appShell, /name="google-adsense-account"/u, "The public shell must retain AdSense ownership verification.");
assert.match(appShell, new RegExp(PUBLISHER, "u"));
assert.doesNotMatch(appShell, /pagead2\.googlesyndication\.com/u, "Forms, verification, payment and admin screens must not load advertisements.");

const adsTxt = read("public/ads.txt");
assert.match(adsTxt, /google\.com,\s*pub-8064027830057594,\s*DIRECT/u);

assert.equal(EDITORIAL_GUIDES.length, 18, "Publish all 16 sector guides and both foundational guides.");
assert.equal(new Set(EDITORIAL_GUIDES.map((guide) => guide.slug)).size, EDITORIAL_GUIDES.length);
assert.equal(new Set(EDITORIAL_GUIDES.map((guide) => guide.title)).size, EDITORIAL_GUIDES.length);

const sitemap = read("public/sitemap.xml");
const robots = read("public/robots.txt");
const counts = [];

for (const guide of EDITORIAL_GUIDES) {
  const relative = `public/guides/${guide.slug}/index.html`;
  const page = read(relative);
  const canonical = `https://petitiondesk.com/guides/${guide.slug}/`;
  const scriptMatches = [...page.matchAll(AD_SCRIPT)];
  AD_SCRIPT.lastIndex = 0;

  assert.equal(scriptMatches.length, 1, `${guide.slug}: ads may load exactly once, on a substantial guide only.`);
  assert.ok(page.includes(`href="${canonical}"`), `${guide.slug}: canonical URL is missing.`);
  assert.ok(page.includes(`<h1>${guide.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;")}</h1>`), `${guide.slug}: visible article heading is missing.`);
  assert.match(page, /PetitionDesk Editorial Team/u);
  assert.match(page, /<time datetime="2026-08-25">/u);
  assert.match(page, /"@type":"Article"/u);
  assert.match(page, /Build an evidence checklist/u);
  assert.match(page, /Choose the institution that can respond/u);
  assert.match(page, /Worked example: applying the route in practice/u);
  assert.match(page, /Official sources and contact starting points/u);
  assert.match(page, /not legal representation/u);
  assert.ok(guide.sources.length > 0, `${guide.slug}: at least one official institutional source is required.`);
  assert.ok(guide.faqs.length >= 2, `${guide.slug}: practical questions and answers are required.`);
  assert.doesNotMatch(page, /lorem ipsum|coming soon|under construction/iu);
  assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${guide.slug}: article must be listed in the sitemap.`);

  const words = visibleWordCount(page);
  assert.ok(words >= 750, `${guide.slug}: expected substantial original publisher content, found ${words} visible words.`);
  counts.push(words);
}

for (const pathname of ["guides", "about", "privacy", "terms", "editorial-policy", "faq"]) {
  const page = read(`public/${pathname}/index.html`);
  assert.doesNotMatch(page, /pagead2\.googlesyndication\.com/u, `${pathname}: navigation and trust pages must not load advertisements.`);
  assert.match(page, /<h1>/u, `${pathname}: a visible page title is required.`);
  assert.ok(sitemap.includes(`<loc>https://petitiondesk.com/${pathname}/</loc>`));
}

const bankingGuide = read("public/guides/banking-and-financial-complaints/index.html");
assert.match(bankingGuide, /VeendHQ/u);
assert.match(bankingGuide, /Remita/u);
assert.match(bankingGuide, /FirstBank statement/u);
assert.match(bankingGuide, /supporting evidence, not proof that FirstBank provided the loan/u);

assert.match(robots, /Allow:\s*\//u);
assert.match(robots, /Disallow:\s*\/admin\//u);
assert.match(robots, /Disallow:\s*\/api\//u);
assert.match(robots, /Sitemap:\s*https:\/\/petitiondesk\.com\/sitemap\.xml/u);
assert.doesNotMatch(sitemap, /\/admin\/|\/api\//u);

const firebase = JSON.parse(read("firebase.json"));
const adminHeaders = firebase.hosting.headers.find((entry) => entry.source === "/admin/**");
assert.ok(adminHeaders, "Administrative pages need explicit no-index headers.");
assert.ok(adminHeaders.headers.some((entry) => entry.key === "X-Robots-Tag" && entry.value.includes("noindex")));

const privacy = read("public/privacy/index.html");
assert.match(privacy, /Google advertising on public editorial guides/u);
assert.match(privacy, /Firestore/u);
assert.match(privacy, /Flutterwave/u);
assert.match(privacy, /Gemini/u);
assert.match(privacy, /info@petitiondesk\.com/u);

const about = read("public/about/index.html");
assert.match(about, /not a government agency/u);
assert.match(about, /₦550/u);

const footer = read("src/components/layout/SiteFooter.jsx");
for (const pathname of ["/guides/", "/about/", "/privacy/", "/terms/", "/editorial-policy/"]) {
  assert.ok(footer.includes(pathname), `The public application footer must link to ${pathname}.`);
}

const supportedIssues = read("src/components/layout/SupportedIssues.jsx");
for (const guide of EDITORIAL_GUIDES.filter((entry) => !["how-to-write-a-formal-petition-in-nigeria", "evidence-checklist-and-personal-data-safety"].includes(entry.slug))) {
  assert.ok(supportedIssues.includes(guide.slug), `The public homepage must expose the ${guide.slug} sector guide.`);
}

console.log("✅ ADSENSE OWNERSHIP VERIFICATION REMAINS WITHOUT GLOBAL AUTO ADS");
console.log("✅ PETITION, ADMINISTRATION, PAYMENT AND SUPPORT SCREENS DO NOT LOAD ADS");
console.log("✅ ALL 16 COMPLAINT SECTORS HAVE ORIGINAL PUBLIC EDITORIAL GUIDES");
console.log(`✅ ${EDITORIAL_GUIDES.length} COMPLETE ARTICLES CONTAIN ${counts.reduce((sum, count) => sum + count, 0)} VISIBLE WORDS`);
console.log(`✅ SHORTEST COMPLETE GUIDE CONTAINS ${Math.min(...counts)} VISIBLE WORDS`);
console.log("✅ ADS LOAD ONLY ON SUBSTANTIAL PUBLISHER-CREATED ARTICLE PAGES");
console.log("✅ ABOUT, PRIVACY, TERMS, FAQ AND EDITORIAL POLICIES ARE PUBLISHED");
console.log("✅ ROBOTS, CANONICAL URLS, STRUCTURED DATA AND A COMPLETE SITEMAP ARE PRESENT");
console.log("✅ VEENDHQ / REMITA LOAN ROUTING EXAMPLE DOES NOT MISIDENTIFY FIRSTBANK");
console.log("✅ ADSENSE PUBLISHER-COMPLIANCE REGRESSION CONTRACT PASSED");
