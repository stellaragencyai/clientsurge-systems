import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function read(path) {
  return readFileSync(join(repoRoot, path), "utf8");
}

function assertIncludes(findings, source, needle, label) {
  if (!source.includes(needle)) findings.push(`missing:${label}`);
}

function assertNotIncludes(findings, source, needle, label) {
  if (source.includes(needle)) findings.push(`forbidden:${label}`);
}

export function collectSeoTrustAudit() {
  const findings = [];
  const publicRouteMetadata = read("src/lib/publicRouteMetadata.js");
  const siteDocuments = read("src/lib/siteDocuments.js");
  const legalPage = read("src/internal-pages/LegalPage.jsx");
  const smsTerms = read("src/pages/SmsTermsPage.jsx");
  const testimonialsPage = read("src/pages/TestimonialsPage.jsx");
  const testimonials = read("src/components/landing/Testimonials.jsx");
  const proofPage = read("src/pages/ProofPage.jsx");

  for (const path of ["/", "/pricing", "/automations", "/industries", "/proof", "/faq", "/how-it-works", "/about", "/blog", "/testimonials", "/roadmap", "/contact", "/privacy", "/terms", "/sms-terms", "/refund-policy"]) {
    assertIncludes(findings, publicRouteMetadata, `"${path}"`, `public_route_metadata:${path}`);
    assertIncludes(findings, siteDocuments, `"${path}"`, `sitemap_meta:${path}`);
  }

  for (const path of ["/product-signup", "/store", "/client-portal", "/setup", "/admin", "/api/"]) {
    assertIncludes(findings, publicRouteMetadata, `"${path}"`, `noindex_or_robots:${path}`);
  }

  assertIncludes(findings, publicRouteMetadata, "Workflow Scenarios and Trust Signals", "testimonials_truthful_metadata");
  assertIncludes(findings, testimonialsPage, "not verified customer testimonials", "testimonials_page_disclaimer");
  assertIncludes(findings, testimonials, "workflow scenarios", "testimonials_component_scenario_label");
  assertIncludes(findings, testimonials, "not verified customer testimonials", "testimonials_component_disclaimer");
  assertIncludes(findings, proofPage, "We do not invent client testimonials.", "proof_no_fake_testimonials");
  assertIncludes(findings, proofPage, "Are results guaranteed?", "proof_no_guaranteed_results_faq");

  assertIncludes(findings, legalPage, "SMS Opt-Out Guardrails", "legal_sms_guardrail_label");
  assertIncludes(findings, legalPage, "Truthful Proof Labels", "legal_truthful_proof_label");
  assertIncludes(findings, legalPage, "We do not sell your personal information", "privacy_no_sale_copy");
  assertIncludes(findings, smsTerms, "Consent Not Required for Purchase", "sms_terms_consent_not_required");
  assertIncludes(findings, smsTerms, "replying STOP", "sms_terms_stop_language");

  assertNotIncludes(findings, legalPage, "10DLC SMS Compliant", "unverified_10dlc_claim");
  assertNotIncludes(findings, testimonials, "Real Workflow Results", "testimonial_section_overclaims_real_results");
  assertNotIncludes(findings, testimonialsPage, "Launch Scenarios & Testimonials", "testimonials_title_implies_verified_quotes");

  return {
    summary: {
      checked_files: 7,
      findings_count: findings.length,
    },
    findings,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = collectSeoTrustAudit();
  if (process.argv.includes("--write")) {
    const outDir = join(repoRoot, "tmp");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "area9-seo-trust-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}
