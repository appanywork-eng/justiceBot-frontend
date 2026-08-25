import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EDITORIAL_GUIDES } from "./editorial-guides.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const ORIGIN = "https://petitiondesk.com";
const PUBLISHER = "ca-pub-8064027830057594";
const REVIEW_DATE = "2026-08-25";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonScript(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function renderHead({ title, description, pathname, article = false }) {
  const canonical = `${ORIGIN}${pathname}`;
  const structuredData = article
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        mainEntityOfPage: canonical,
        datePublished: REVIEW_DATE,
        dateModified: REVIEW_DATE,
        author: {
          "@type": "Organization",
          name: "PetitionDesk Editorial Team",
          url: `${ORIGIN}/editorial-policy/`,
        },
        publisher: {
          "@type": "Organization",
          name: "PetitionDesk",
          url: ORIGIN,
        },
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description,
        url: canonical,
      };

  return `<!doctype html>
<html lang="en-NG">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <meta name="google-adsense-account" content="${PUBLISHER}" />
  <meta name="theme-color" content="#07553a" />
  <meta property="og:type" content="${article ? "article" : "website"}" />
  <meta property="og:site_name" content="PetitionDesk" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta name="twitter:card" content="summary" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/editorial.css" />
  <script type="application/ld+json">${jsonScript(structuredData)}</script>
${article ? `  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER}" crossorigin="anonymous"></script>\n` : ""}  <title>${escapeHtml(title)} | PetitionDesk</title>
</head>`;
}

function renderHeader() {
  return `<header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="/" aria-label="PetitionDesk homepage">Petition<span>Desk</span></a>
      <nav aria-label="Main navigation">
        <a href="/guides/">Complaint guides</a>
        <a href="/about/">About</a>
        <a class="button button-small" href="/#draft-petition">Draft a petition</a>
      </nav>
    </div>
  </header>`;
}

function renderFooter() {
  return `<footer class="site-footer">
    <div class="shell footer-inner">
      <div>
        <strong>PetitionDesk</strong>
        <p>Independent Nigerian complaint guidance and petition-drafting assistance. You review and send your own document.</p>
      </div>
      <nav aria-label="Publisher information">
        <a href="/guides/">All guides</a>
        <a href="/about/">About</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
        <a href="/editorial-policy/">Editorial policy</a>
        <a href="/faq/">Frequently asked questions</a>
        <a href="/contact">Contact</a>
      </nav>
      <p class="small-print">General information, not legal representation. Confirm current procedures with the responsible official institution.</p>
    </div>
  </footer>`;
}

function renderDocument({ title, description, pathname, content, article = false }) {
  return `${renderHead({ title, description, pathname, article })}
<body>
  ${renderHeader()}
  <main>${content}</main>
  ${renderFooter()}
</body>
</html>\n`;
}

function list(items, ordered = false) {
  const element = ordered ? "ol" : "ul";
  return `<${element}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n")}</${element}>`;
}

function renderGuide(guide) {
  const pathname = `/guides/${guide.slug}/`;
  const sourceLinks = guide.sources
    .map(
      ({ label, url }) =>
        `<li><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a></li>`,
    )
    .join("\n");
  const questions = guide.faqs
    .map(
      ({ question, answer }) =>
        `<section class="faq-item"><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></section>`,
    )
    .join("\n");

  const content = `<div class="shell article-shell">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span>/</span> <a href="/guides/">Complaint guides</a> <span>/</span> ${escapeHtml(guide.category)}</nav>
    <article class="article-card">
      <header class="article-header">
        <p class="eyebrow">${escapeHtml(guide.category)} · Nigerian complaint guidance</p>
        <h1>${escapeHtml(guide.title)}</h1>
        <p class="article-summary">${escapeHtml(guide.description)}</p>
        <p class="byline">By <a href="/editorial-policy/">PetitionDesk Editorial Team</a> · Reviewed <time datetime="${REVIEW_DATE}">25 August 2026</time></p>
      </header>

      <aside class="callout"><strong>Who this guide is for:</strong> ${escapeHtml(guide.audience)}</aside>

      <section aria-labelledby="understand"><h2 id="understand">Understand the problem before writing</h2>${guide.context.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")}</section>

      <section aria-labelledby="evidence"><h2 id="evidence">Build an evidence checklist</h2><p>Use records that relate directly to your complaint. Put events in date order, identify the organisation involved, and keep copies of every message or acknowledgement. Describe what your documents actually show; do not present an allegation as a proven finding.</p>${list(guide.checklist)}</section>

      <section aria-labelledby="recipient"><h2 id="recipient">Choose the institution that can respond</h2><p>${escapeHtml(guide.route)}</p><p>A company mentioned in a statement, address, receipt or background document is not automatically the institution responsible for the complaint. Identify who provided the disputed service, who made the decision, and who can supply records or correct the problem.</p></section>

      <section aria-labelledby="escalation"><h2 id="escalation">Decide whether escalation is justified</h2><p>${escapeHtml(guide.escalation)}</p><p>Before escalating, keep the original complaint reference, the institution's written answer where available, and a concise explanation of what remains unresolved. Check the current instructions published by the relevant authority instead of assuming that one deadline applies to every type of complaint.</p></section>

      <section aria-labelledby="example"><h2 id="example">Worked example: applying the route in practice</h2><p>${escapeHtml(guide.example)}</p></section>

      <section aria-labelledby="mistakes"><h2 id="mistakes">Avoid common mistakes and protect personal data</h2><p>${escapeHtml(guide.mistake)}</p><p>Remove passwords, one-time passcodes, card security codes and unrelated medical, financial or family information. Request a specific remedy supported by your evidence, such as an explanation, correction, investigation, refund or written decision.</p></section>

      <section aria-labelledby="questions"><h2 id="questions">Frequently asked questions</h2>${questions}</section>

      <section aria-labelledby="sources"><h2 id="sources">Official sources and contact starting points</h2><p>These links point to the organisations' published websites or complaint resources. Check that the channel and procedure remain current before sharing your complaint or evidence.</p><ul class="source-list">${sourceLinks}</ul></section>

      <aside class="editorial-note"><h2>Editorial note</h2><p>This original guide explains a practical complaint process; it is not legal representation, a government decision, or a promise that a complaint will succeed. PetitionDesk identifies available official channels and helps organise information, while the petitioner remains responsible for reviewing and sending the final document. Read our <a href="/editorial-policy/">editorial and correction policy</a>.</p></aside>

      <section class="article-action"><h2>Ready to organise your complaint?</h2><p>Start with your own facts, identify the correct institution, and review the finished petition carefully before you send it.</p><a class="button" href="/#draft-petition">Draft a petition on PetitionDesk</a></section>
    </article>
  </div>`;

  return renderDocument({ title: guide.title, description: guide.description, pathname, content, article: true });
}

function renderGuideIndex() {
  const guides = EDITORIAL_GUIDES.map(
    (guide) => `<article class="guide-card"><p class="eyebrow">${escapeHtml(guide.category)}</p><h2><a href="/guides/${guide.slug}/">${escapeHtml(guide.title)}</a></h2><p>${escapeHtml(guide.description)}</p><a class="text-link" href="/guides/${guide.slug}/">Read the complete guide →</a></article>`,
  ).join("\n");

  return renderDocument({
    title: "Nigerian complaint and petition guides",
    description: "Original practical guides covering banking, electricity, telecoms, aviation, healthcare, insurance, pensions, education, public services and other Nigerian complaint routes.",
    pathname: "/guides/",
    content: `<div class="shell content-shell"><header class="page-intro"><p class="eyebrow">PetitionDesk public editorial library</p><h1>Practical Nigerian complaint and petition guides</h1><p>Understand which organisation should receive a complaint, which records are useful, and when a regulator or oversight body may be relevant. Every guide contains an original worked example, evidence checklist, official starting points and a clear explanation of common routing mistakes.</p><p>Written by the PetitionDesk Editorial Team. Our guides are general information, not a substitute for qualified legal advice, and official requirements can change.</p></header><section class="guide-grid" aria-label="Complete complaint guides">${guides}</section><aside class="policy-panel"><h2>How we create these guides</h2><p>We prioritise the organisation responsible for the disputed action, link to published institutional sources, avoid invented contacts or legal claims, and correct errors when readers identify them. Learn more about our <a href="/editorial-policy/">editorial standards</a> and <a href="/about/">how PetitionDesk works</a>.</p></aside></div>`,
  });
}

function renderInfoPage({ title, description, pathname, body }) {
  return renderDocument({
    title,
    description,
    pathname,
    content: `<div class="shell content-shell"><article class="article-card policy-page"><p class="eyebrow">PetitionDesk publisher information</p><h1>${escapeHtml(title)}</h1><p class="article-summary">${escapeHtml(description)}</p><p class="byline">Last reviewed <time datetime="${REVIEW_DATE}">25 August 2026</time></p>${body}</article></div>`,
  });
}

const INFO_PAGES = [
  {
    title: "About PetitionDesk",
    pathname: "/about/",
    description: "Learn who PetitionDesk is for, how our Nigerian complaint guidance and petition drafting work, and what the service can and cannot do.",
    body: `<h2>What PetitionDesk does</h2><p>PetitionDesk is an independent digital service that helps people organise a complaint, understand which institution may be responsible, and prepare a formal petition using information they provide. Our public guides explain the practical difference between a service provider, a regulator, an oversight body and an organisation that is only mentioned as background.</p><p>We cover banking and financial services, telecoms, electricity, aviation, healthcare, insurance, pensions, education, policing and security, civil disputes, corruption concerns, public administration, judicial conduct, consular issues, international human-rights escalation, and land or building-control complaints.</p><h2>What PetitionDesk does not do</h2><p>PetitionDesk is not a government agency, regulator, court, emergency-response service or law firm. We do not issue binding legal opinions, decide cases, guarantee outcomes, or pretend that a draft has been officially submitted. The user reviews the completed document and sends it personally through their own email or the appropriate published institutional channel.</p><h2>How a complaint is prepared</h2><ol><li>You describe the problem and supply the dates, records and remedy that matter.</li><li>The service identifies the sector and the institution responsible for the disputed action rather than blindly selecting every company named in the background.</li><li>A draft is prepared and presented for your review. You should correct inaccurate or incomplete information before use.</li><li>You send the finished petition yourself and keep the delivery record or complaint reference.</li></ol><h2>Access and pricing</h2><p>Eligible verified users currently receive their first two complete petitions without payment. Additional complete petitions currently cost ₦550 each. Current access and pricing are presented in the application before a petition is unlocked; administrative access is separate from public user access.</p><h2>Our editorial commitment</h2><p>Our public complaint guides are created as original practical explanations for Nigerian users. We identify the publishing team, provide relevant official starting points, explain uncertainty, avoid invented addresses and unsupported legal claims, and publish a correction contact. Read the full <a href="/editorial-policy/">editorial policy</a> and browse the <a href="/guides/">complaint guide library</a>.</p><h2>Contact and corrections</h2><p>For service questions, editorial corrections, or privacy requests, email <a href="mailto:info@petitiondesk.com">info@petitiondesk.com</a> or use our <a href="/contact">contact page</a>. Please do not email passwords, one-time passcodes or payment-card security codes.</p>`,
  },
  {
    title: "Privacy policy",
    pathname: "/privacy/",
    description: "Understand which information PetitionDesk may process, how petition drafting, account verification, payments, support and editorial-page advertising work, and how to contact us.",
    body: `<h2>Information you choose to provide</h2><p>PetitionDesk may process your contact details, account-verification email, the facts you enter about a complaint, the organisation involved, document text, relevant transaction or reference details, support messages, and information needed to recognise completed petition access. Provide only information necessary to understand and resolve the specific complaint.</p><h2>How the information is used</h2><p>Information is used to verify user access, prepare and display a petition, identify an appropriate institutional route, administer free-petition allowances or paid access, respond to support requests, protect the service from misuse, and maintain the reliability of the application. You remain responsible for reviewing the petition before you send it to any institution.</p><h2>Service providers and processing</h2><p>Account verification and application storage may use Google Firebase and Firestore. Petition drafting may send relevant complaint text to Google's Gemini service. Payment processing uses Flutterwave where paid access applies. Hosting and security services may receive technical request information needed to operate the site. PetitionDesk does not ask you to provide your password, banking PIN, one-time passcode, full payment-card security code, or unrelated private records.</p><h2>Cookies, local storage and security</h2><p>The application may use browser storage, authentication state, request records and similar technical information to maintain sessions, restore payment results, protect administrator access, reduce abuse and keep the service working. Restrict the sensitive information you submit and use the site's official channels. No online service should be treated as a reason to disclose secrets that an institution would never legitimately request.</p><h2>Google advertising on public editorial guides</h2><p>Google-served advertising is restricted to substantial public complaint-guide articles. Ads are not intentionally loaded on the petition drafting application, administrative dashboard, verification, payment, support or other operational screens. Google and its advertising partners may use cookies or similar technologies on eligible editorial pages where applicable. Learn how Google uses information on partner sites at <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google's partner-site privacy explanation</a>.</p><p>Petition complaint details should not be used as a reason to place ads inside private petition forms or administrative screens. Avoid entering sensitive personal information into any public page or advertising interaction.</p><h2>Access, correction and deletion requests</h2><p>If you need help understanding, correcting or requesting deletion of information associated with your use of PetitionDesk, contact <a href="mailto:info@petitiondesk.com">info@petitiondesk.com</a>. We may need enough information to confirm that the request relates to your own account. We do not publish a universal retention promise here because operational records, payment obligations, security investigations and user requests can require different handling.</p><h2>Changes and questions</h2><p>This policy describes the service in plain language and may be updated as features or providers change. Check this page for the current version and contact us if anything is unclear. Read our <a href="/terms/">terms of use</a> and <a href="/editorial-policy/">editorial policy</a> for further context.</p>`,
  },
  {
    title: "Terms of use",
    pathname: "/terms/",
    description: "Read the conditions for using PetitionDesk, including user responsibilities, verified access, petition pricing, official routing and the limits of automated drafting.",
    body: `<h2>Purpose of the service</h2><p>PetitionDesk provides complaint guidance, institutional-routing assistance and draft-document preparation. It is an independent service, not a court, government authority, emergency service, regulator or retained legal representative. A generated document is a draft for your own review rather than a guarantee of legal accuracy or a successful outcome.</p><h2>Your information and responsibility</h2><p>Supply information you are entitled to use. Keep descriptions factual and distinguish allegations from established findings. Do not invent transactions, impersonate another person, threaten recipients, harass institutions, disclose other people's unnecessary private information, or submit passwords, one-time passcodes, card security codes or banking PINs.</p><h2>Review and submission</h2><p>Automated drafting can misunderstand an institution, date, requested remedy or legal context. Check the complete document and the recommended recipient before relying on it. PetitionDesk does not automatically guarantee that a petition has been filed: you review and send your own document through your email or an appropriate published official channel.</p><h2>Access and payment</h2><p>Eligible verified public users currently receive two complete petitions without payment. Additional complete petitions currently cost ₦550 each, subject to the price shown before unlocking. Payment providers may apply their own terms and verification processes. Administrator access and any authorised administrative drafting privileges are controlled separately from public customer access.</p><h2>Official channels and changing procedures</h2><p>Institutional responsibilities, websites, complaint timelines and official contacts may change. The fact that a bank, employer, platform or institution appears in a record does not automatically make it the correct complaint recipient. Check the current published channel and seek professional legal advice where the seriousness, complexity or deadline requires it.</p><h2>Service integrity</h2><p>We may limit abusive requests, protect administrative functions, investigate suspected fraudulent activity, or change service features when needed for reliability and security. You must not attempt to access another person's account, bypass payment controls, attack the service, or misuse support channels.</p><h2>Contact</h2><p>Send service questions or corrections to <a href="mailto:info@petitiondesk.com">info@petitiondesk.com</a>. Read the <a href="/privacy/">privacy policy</a> to understand the information you provide and the <a href="/editorial-policy/">editorial policy</a> for how public guidance is produced.</p>`,
  },
  {
    title: "Editorial and correction policy",
    pathname: "/editorial-policy/",
    description: "See how the PetitionDesk Editorial Team creates original Nigerian complaint guides, selects official sources, identifies uncertainty, separates advertising and handles corrections.",
    body: `<h2>Who publishes our guides</h2><p>Public complaint guides are published by the PetitionDesk Editorial Team. Each substantive guide identifies the publisher, shows a review date, explains the audience, and links to the institutional sources that readers can check themselves. We do not present the material as a court ruling, personalised legal representation or an official statement from a regulator.</p><h2>How topics are selected</h2><p>We choose subjects that match problems people actually encounter in Nigerian financial services, utilities, aviation, healthcare, education, public administration and other complaint sectors. Every guide aims to explain the responsible institution, relevant records, practical escalation considerations and mistakes that commonly send complaints to the wrong recipient.</p><h2>Originality and evidence</h2><p>Articles are written as original practical explanations rather than copied regulator pages or interchangeable keyword-filled templates. Worked examples clarify the institutional relationship; readers should not mistake an example for a finding about their own case. We prefer official institutional websites and published complaint channels as starting points, while recognising that a regulator's remit and current process must still be checked.</p><h2>Accuracy and uncertainty</h2><p>We avoid unsupported legal claims, invented email addresses, fabricated complaint deadlines and definitive allegations that available documents do not prove. Where routing depends on who supplied a service, who processed a transaction and who controls a disputed decision, we identify those separate roles rather than treating every named organisation as equally responsible.</p><h2>Financial, medical and legal caution</h2><p>Complaints can involve money, health, detention, employment, housing and other high-impact issues. Our guides provide general information and evidence-organising assistance, not a substitute for qualified legal, medical, financial or emergency advice. Urgent safety concerns should be taken to appropriate emergency services or qualified professionals.</p><h2>Advertising and independence</h2><p>Google advertising is limited to substantial public guide articles. Administrative dashboards, verification flows, payment screens, petition drafting tools and support screens are not intended to carry ads. Advertising does not determine which institution is recommended or change our explanation of who is responsible for a complaint.</p><h2>Corrections and review</h2><p>If an official link changes, a guide misidentifies a responsible body, or information appears inaccurate, send the guide title, the specific issue and an official supporting source to <a href="mailto:info@petitiondesk.com">info@petitiondesk.com</a>. We assess corrections against reliable current information and update public pages when appropriate.</p><p>Browse all <a href="/guides/">PetitionDesk complaint guides</a> or learn <a href="/about/">how the service works</a>.</p>`,
  },
  {
    title: "Frequently asked questions",
    pathname: "/faq/",
    description: "Answers to common questions about PetitionDesk, verified free petitions, ₦550 paid access, correct complaint recipients, evidence, privacy and submission.",
    body: `<h2>Does PetitionDesk send a petition automatically?</h2><p>No. PetitionDesk helps prepare a document and identify a relevant official channel, but the user reviews the completed petition and sends it personally. Keep your delivery record, acknowledgement or complaint reference.</p><h2>How many petitions are free?</h2><p>Eligible verified public users currently receive their first two complete petitions without payment. Subsequent complete petitions currently cost ₦550 each. Verify the current price displayed before unlocking.</p><h2>Why must my email be verified?</h2><p>Verification helps recognise an individual account, apply the free-petition allowance fairly, and reduce fraudulent or duplicate claims. Administrative authentication is separate from public user verification.</p><h2>Which institution should receive my complaint?</h2><p>Start with the organisation responsible for the disputed service, decision or transaction. For example, the bank that merely holds an account is not automatically responsible for a disputed mandate controlled by a separate lender or payment platform. Use relevant official complaint channels and escalate only where the oversight body actually has authority.</p><h2>Can I complain to multiple organisations?</h2><p>Yes, where each organisation has a distinct role supported by the facts. A lender, payment processor and bank may need different requests. Avoid copying unrelated institutions just because their names appear in the background.</p><h2>What evidence should I attach?</h2><p>Use records that establish the timeline, disputed amount or decision, institutional identity, prior complaint and requested remedy. Hide unrelated personal information. Never provide your password, one-time passcode, card security code or banking PIN.</p><h2>Is PetitionDesk a government agency or law firm?</h2><p>No. PetitionDesk is an independent digital complaint-guidance and drafting service. It does not make official decisions, guarantee a successful complaint, or replace legal representation.</p><h2>Where can I learn about my sector?</h2><p>Visit the <a href="/guides/">public complaint guide library</a> for original guides covering financial services, utilities, health, education, transport, public institutions, civil disputes and other complaint areas.</p><h2>How can I request a correction or privacy help?</h2><p>Email <a href="mailto:info@petitiondesk.com">info@petitiondesk.com</a>. Include enough information to identify the issue, but do not email unnecessary confidential records.</p>`,
  },
];

const EDITORIAL_CSS = `:root{color-scheme:light;--green:#07553a;--green-dark:#103b29;--ink:#172b23;--muted:#526359;--line:#dbe7df;--paper:#fff;--surface:#f4f8f5;--gold:#a67116;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--surface);font-size:17px;line-height:1.75}.shell{width:min(1120px,calc(100% - 36px));margin:0 auto}.site-header{position:sticky;top:0;z-index:4;background:rgba(255,255,255,.97);border-bottom:1px solid var(--line)}.header-inner{min-height:76px;display:flex;justify-content:space-between;align-items:center;gap:22px}.brand{font-size:27px;font-weight:850;color:var(--green-dark);text-decoration:none;letter-spacing:-.7px}.brand span{color:#208552}.site-header nav,.site-footer nav{display:flex;align-items:center;gap:20px}.site-header nav>a,.site-footer nav>a{font-size:15px;color:var(--green-dark);font-weight:650;text-decoration:none}.button,.site-header nav>a.button{display:inline-block;color:white;background:var(--green);border-radius:11px;padding:12px 18px;font-weight:750;text-decoration:none}.button-small{font-size:14px!important;padding:9px 13px!important}.content-shell,.article-shell{padding-top:45px;padding-bottom:76px}.article-shell{width:min(860px,calc(100% - 34px))}.breadcrumbs{font-size:14px;color:var(--muted);margin:0 0 20px}.breadcrumbs a,.article-card a,.policy-panel a,.guide-card a{color:var(--green);text-underline-offset:3px}.breadcrumbs span{margin:0 7px}.article-card,.guide-card,.policy-panel{background:var(--paper);border:1px solid var(--line);border-radius:18px}.article-card{padding:44px 50px;box-shadow:0 16px 48px rgba(17,54,34,.045)}.eyebrow{font-size:13px;font-weight:780;letter-spacing:.7px;text-transform:uppercase;color:var(--gold)}h1,h2,h3{color:var(--green-dark);line-height:1.22}h1{font-size:clamp(32px,5vw,52px);letter-spacing:-1.2px;margin:10px 0 16px}h2{font-size:clamp(23px,3.8vw,32px);margin-top:39px;margin-bottom:12px}h3{font-size:19px;margin:23px 0 7px}.article-summary,.page-intro>p:not(.eyebrow){font-size:19px;color:var(--muted)}.byline{font-size:14px;color:var(--muted)}.callout,.editorial-note,.article-action,.policy-panel{padding:20px 23px;background:#f2f8f3;border-left:4px solid #398a54;border-radius:12px;margin:29px 0}.article-card li{margin:8px 0}.source-list a{overflow-wrap:anywhere}.editorial-note h2,.article-action h2,.policy-panel h2{font-size:23px;margin-top:2px}.article-action{border-left-color:var(--gold)}.page-intro{max-width:830px;margin-bottom:32px}.guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}.guide-card{padding:24px}.guide-card h2{font-size:22px;margin:10px 0}.guide-card h2>a{text-decoration:none}.guide-card>p:not(.eyebrow){font-size:15px;color:var(--muted)}.text-link{font-size:15px;font-weight:700}.policy-page{max-width:860px;margin:auto}.site-footer{background:#fff;border-top:1px solid var(--line)}.footer-inner{padding:34px 0}.footer-inner>div>strong{font-size:20px;color:var(--green-dark)}.footer-inner>div>p,.small-print{color:var(--muted);font-size:14px}.site-footer nav{flex-wrap:wrap;gap:12px 19px}.faq-item{padding:3px 0 10px;border-bottom:1px solid var(--line)}@media(max-width:620px){body{font-size:16px}.shell{width:calc(100% - 26px)}.header-inner{min-height:68px;gap:10px}.brand{font-size:22px}.site-header nav{gap:10px}.site-header nav>a:first-child{font-size:13px}.site-header nav>a:nth-child(2){display:none}.button-small{font-size:12px!important;padding:9px 10px!important}.content-shell,.article-shell{padding-top:27px;padding-bottom:48px}.article-card{padding:27px 19px;border-radius:14px}.guide-grid{grid-template-columns:1fr}.breadcrumbs{font-size:12px}.callout,.editorial-note,.article-action,.policy-panel{padding:15px 16px}.article-summary,.page-intro>p:not(.eyebrow){font-size:17px}}\n`;

function textWordCount(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/giu, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
}

async function writePage(pathname, contents) {
  const directory = path.join(PUBLIC, pathname.replace(/^\//u, ""));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), contents, "utf8");
}

await mkdir(PUBLIC, { recursive: true });
await rm(path.join(PUBLIC, "guides"), { recursive: true, force: true });
await writeFile(path.join(PUBLIC, "editorial.css"), EDITORIAL_CSS, "utf8");
await writePage("/guides/", renderGuideIndex());

const counts = [];
for (const guide of EDITORIAL_GUIDES) {
  const page = renderGuide(guide);
  await writePage(`/guides/${guide.slug}/`, page);
  counts.push({ slug: guide.slug, words: textWordCount(page) });
}

for (const page of INFO_PAGES) {
  await writePage(page.pathname, renderInfoPage(page));
}

const sitemapPaths = ["/", "/guides/", ...EDITORIAL_GUIDES.map((guide) => `/guides/${guide.slug}/`), ...INFO_PAGES.map((page) => page.pathname), "/contact"];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map((pathname) => `  <url><loc>${ORIGIN}${pathname}</loc><lastmod>${REVIEW_DATE}</lastmod></url>`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(PUBLIC, "sitemap.xml"), sitemap, "utf8");
await writeFile(path.join(PUBLIC, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /payment/\n\nSitemap: ${ORIGIN}/sitemap.xml\n`, "utf8");

const minimum = counts.reduce((lowest, current) => (current.words < lowest.words ? current : lowest));
console.log(`Generated ${counts.length} substantial public complaint guides covering all 16 PetitionDesk sectors.`);
console.log(`Generated ${INFO_PAGES.length} publisher trust pages, a guide index, robots.txt and a ${sitemapPaths.length}-URL sitemap.`);
console.log(`Shortest guide: ${minimum.slug} (${minimum.words} words). Total guide words: ${counts.reduce((sum, current) => sum + current.words, 0)}.`);

export { EDITORIAL_GUIDES, INFO_PAGES, ORIGIN, PUBLIC, PUBLISHER, REVIEW_DATE, textWordCount };
