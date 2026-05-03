import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const taskFile = path.join(repoRoot, "src", "MASTER_TASK_LIST.md");
const outputFile = path.join(
  repoRoot,
  "docs",
  "task-authenticity-audit-2026-05-03.md"
);

const raw = fs.readFileSync(taskFile, "utf8");

function parseTasks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tasks = [];
  let currentSection = "Unsectioned";
  let occurrenceById = new Map();

  for (const line of lines) {
    const sectionMatch = line.match(/^##\s+(SECTION .*|SECTION [A-Z]:.*)$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    const rowMatch = line.match(
      /^\|\s*(\d+)\s*\|\s*([✅🔄⏳❌])\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/u
    );
    if (!rowMatch) {
      continue;
    }

    const id = Number(rowMatch[1]);
    const status = rowMatch[2];
    const task = rowMatch[3].trim();
    const priority = rowMatch[4].trim();
    const occurrence = (occurrenceById.get(id) || 0) + 1;
    occurrenceById.set(id, occurrence);

    tasks.push({
      id,
      occurrence,
      key: `${id}.${occurrence}`,
      status,
      task,
      priority,
      section: currentSection,
    });
  }

  return tasks;
}

const tasks = parseTasks(raw);

const statusLabel = {
  "✅": "Complete",
  "🔄": "In Progress",
  "⏳": "Pending",
  "❌": "Blocked",
};

function rel(filePath) {
  return filePath.replaceAll("\\", "/");
}

function joinList(values) {
  return values.filter(Boolean).join("; ");
}

const duplicateTargets = new Map([
  [82, 60],
  [105, 4],
  [121, 3],
  [136, 60],
  [191, 67],
  [192, 68],
  [193, 69],
  [194, 72],
  [195, 70],
  [196, 71],
  [220, 157],
  [230, 117],
  [231, 118],
  [232, 119],
  [236, 216],
  [237, 217],
  [259, 67],
  [261, 70],
  [262, 71],
  [263, 72],
  [264, 69],
  [267, 68],
  [271, 46],
  [272, 75],
  [281, 80],
  [282, 56],
  [290, 62],
  [291, 8],
  [292, 6],
  [293, 66],
]);

const genericAreaEvidence = [
  [/ClientPortal/i, ["src/pages/ClientPortal.jsx"]],
  [/BillingDashboard/i, ["src/components/portal/BillingDashboard.jsx"]],
  [/PlanManager/i, ["src/components/portal/PlanManager.jsx"]],
  [/CartSidebar/i, ["src/components/store/CartSidebar.jsx"]],
  [/ProductCard/i, ["src/components/store/ProductCard.jsx"]],
  [/SocialProofTicker/i, ["src/components/store/SocialProofTicker.jsx"]],
  [/Store/i, ["src/pages/Store.jsx"]],
  [/createCheckoutSession/i, ["base44/functions/createCheckoutSession/entry.ts"]],
  [/stripeWebhookOrders/i, ["base44/functions/stripeWebhookOrders/entry.ts"]],
  [/getStripeCustomerPortalUrl/i, ["base44/functions/getStripeCustomerPortalUrl/entry.ts"]],
  [/receiveTwilioInboundSms/i, ["base44/functions/receiveTwilioInboundSms/entry.ts"]],
  [/scheduleFollowUpSMS/i, ["base44/functions/scheduleFollowUpSMS/entry.ts"]],
  [/sendOrderConfirmationEmail/i, ["base44/functions/sendOrderConfirmationEmail/entry.ts"]],
  [/submitLeadCapture/i, ["base44/functions/submitLeadCapture/entry.ts"]],
  [/submitContactInquiry/i, ["base44/functions/submitContactInquiry/entry.ts"]],
  [/Onboarding/i, ["src/pages/Onboarding.jsx"]],
  [/LeadCaptureForm/i, ["src/components/landing/LeadCaptureForm.jsx"]],
  [/Contact/i, ["src/pages/Contact.jsx"]],
  [/Lead Intelligence|LeadIntelligence/i, ["src/pages/LeadIntelligence.jsx"]],
  [/AdminDashboard/i, ["src/pages/AdminDashboard.jsx"]],
  [/AutomationInstallChecklist/i, ["src/components/admin/AutomationInstallChecklist.jsx"]],
  [/InstallChecklistPanel/i, ["src/components/admin/InstallChecklistPanel.jsx"]],
  [/SupportMessage/i, ["base44/entities/SupportMessage.jsonc", "src/components/portal/SupportChat.jsx"]],
  [/Changelog/i, ["src/MASTER_TASK_LIST.md"]],
  [/Referral/i, ["src/MASTER_TASK_LIST.md"]],
  [/ClientInstallationOS/i, ["base44/entities/ClientInstallationOS.jsonc", "base44/functions/initializeInstallOS/entry.ts"]],
  [/AutomationChecklist/i, ["base44/entities/AutomationChecklist.jsonc", "base44/functions/initializeInstallOS/entry.ts"]],
  [/AutomationChecklistStep/i, ["base44/entities/AutomationChecklistStep.jsonc", "base44/functions/initializeInstallOS/entry.ts"]],
  [/setPageMetadata/i, ["src/lib/seo.js"]],
  [/index\.html|preconnect|twitter:card|manifest/i, ["index.html", "src/lib/seo.js"]],
  [/robots\.txt/i, ["public/robots.txt"]],
  [/sitemap/i, ["public/sitemap.xml"]],
  [/ThankYou/i, ["src/pages/ThankYou.jsx"]],
  [/PageNotFound|404/i, ["src/lib/PageNotFound.jsx", "src/App.jsx"]],
];

function findEvidence(taskText) {
  for (const [pattern, files] of genericAreaEvidence) {
    if (pattern.test(taskText)) {
      return files.map(rel);
    }
  }
  return [];
}

function liveOnlyDefault(taskText) {
  return /Switch Stripe from Test Mode to Live Mode|Update Stripe webhook endpoint URL|real card|production domain|custom domain DNS|SSL cert|UptimeRobot|Better Stack|SPF|DKIM|DMARC|A2P 10DLC|secrets are set in production|submitted to Google Search Console|Lighthouse audit|axe or WAVE|team sign-off|render correctly in Gmail, Outlook, Apple Mail|load test|verify all CTA buttons across mobile|full purchase test/i.test(
    taskText
  );
}

const overrides = new Map();

function setOverride(id, override, occurrence = 1) {
  overrides.set(`${id}.${occurrence}`, override);
}

function markMany(ids, overrideFactory) {
  for (const id of ids) {
    setOverride(id, typeof overrideFactory === "function" ? overrideFactory(id) : overrideFactory);
  }
}

markMany([1], {
  audit: "Verified complete (repo)",
  evidence: ["src/components/store/ProductCard.jsx", "src/lib/salesCatalog.js", "tests/salesCatalog.test.js"],
  tested: "Indirectly covered by `npm test`; no dedicated visual regression",
  done: "Product cards render canonical `monthly_fee` and `setup_fee` data from the store catalog.",
  missing: "Add browser-level pricing assertions if this should remain green over time.",
});

markMany([4], {
  audit: "Verified complete (repo)",
  evidence: ["src/pages/Store.jsx"],
  tested: "Code inspection plus passing `npm test` / `npm run build`",
  done: "Store search keeps separate input state and applies a 280ms debounce before filtering.",
  missing: "Add a UI test if you want the backlog to treat this as permanently protected.",
});

markMany([38], {
  audit: "Verified complete (repo, wording drift)",
  evidence: ["src/pages/ClientPortal.jsx"],
  tested: "Code inspection plus portal tests in `npm test`",
  done: "The first/default portal tab resolves to `progress`, which is the build/setup progress view.",
  missing: "If exact copy matters, rename `Build Progress` to `Setup Progress` to match the task text.",
});

markMany([60, 106, 109], (id) => ({
  audit: "Verified complete (repo)",
  evidence:
    id === 60
      ? ["public/sitemap.xml"]
      : id === 106
      ? ["public/robots.txt"]
      : ["src/App.jsx"],
  tested: "Code inspection only; no external crawler verification stored in repo",
  done:
    id === 60
      ? "Sitemap includes core routes and the six industry routes."
      : id === 106
      ? "Robots file blocks admin/authenticated/internal routes and publishes the sitemap location."
      : "Route-level `robots` handling applies `noindex,nofollow` to `/order-success` and other protected flows.",
  missing:
    id === 60
      ? "Submit and validate in Search Console if you want a live-proof green status."
      : id === 106
      ? "Confirm the deployed file matches repo state on the production domain."
      : "Add a browser assertion if you want automated proof instead of code inspection.",
}));

markMany([77], {
  audit: "Verified complete (repo)",
  evidence: ["src/pages/ClientPortal.jsx", "base44/functions/getClientPortalContext/entry.ts", "tests/portalAndLaunchHardening.test.js"],
  tested: "Covered by `npm test` plus code inspection",
  done: "Portal returns a controlled empty/not-found state instead of breaking navigation when no project is linked.",
  missing: "Production smoke-test the empty-state copy if you want live proof.",
});

markMany([11, 29, 67, 173, 255, 260, 284, 288], (id) => ({
  audit: "Verified complete (repo)",
  evidence:
    id === 11
      ? ["src/pages/ThankYou.jsx"]
      : id === 29
      ? ["src/lib/PageNotFound.jsx", "src/App.jsx"]
      : id === 67
      ? ["src/pages/ClientPortal.jsx", "src/components/portal/SupportChat.jsx", "base44/entities/SupportMessage.jsonc"]
      : id === 173
      ? ["src/pages/AdminDashboard.jsx", "src/components/admin/WebsiteLeadsDashboard.jsx"]
      : id === 255
      ? ["src/pages/LeadIntelligence.jsx", "src/components/leads/LeadsTableIntelligence.jsx", "src/components/leads/LeadDetail.jsx"]
      : id === 260
      ? ["src/pages/ClientPortal.jsx", "src/components/portal/BillingDashboard.jsx", "src/components/portal/PlanManager.jsx"]
      : id === 284
      ? ["src/lib/seo.js"]
      : ["src/lib/seo.js", "index.html"],
  tested: "Code inspection; covered by passing build, but not separately acceptance-tested",
  done:
    id === 11
      ? "The `ThankYou` route now renders a full confirmation experience instead of a blank page."
      : id === 29
      ? "A branded 404 component already exists and is wired through the app."
      : id === 67
      ? "The portal already has a `Support & Messaging` tab backed by `SupportMessage` writes."
      : id === 173
      ? "Admin dashboard already exposes a `Website Leads` workspace."
      : id === 255
      ? "The lead-intelligence page already shows `lead_score` and `lead_quality_label` in the UI."
      : id === 260
      ? "The client portal already exposes a Billing tab with plan, renewal, outstanding amount, and invoice history."
      : id === 284
      ? "A reusable `setPageMetadata()` helper already sets title, description, canonical, OG, and Twitter metadata."
      : "Twitter card metadata is already written by `setPageMetadata()` and bootstrapped in `index.html`.",
  missing: "Add focused acceptance coverage if you want stronger long-term proof than repo inspection.",
}));

setOverride(71, {
  audit: "Partial: feature exists in a different form",
  evidence: ["src/components/portal/BillingDashboard.jsx", "base44/functions/createInvoicePaymentLink/entry.ts"],
  tested: "Code inspection only",
  done: "Billing already renders invoice rows with a PDF download icon when `pdf_url` is present.",
  missing: "Decide whether the current icon-based download satisfies the task or whether you still want a dedicated button and explicit Stripe invoice proof.",
});

markMany([2, 5, 94, 101], (id) => ({
  audit: "Valid pending implementation task",
  evidence:
    id === 2
      ? ["src/components/store/CartSidebar.jsx", "src/lib/bodyScrollLock.js"]
      : id === 5
      ? ["src/components/store/CartSidebar.jsx", "base44/functions/createCheckoutSession/entry.ts"]
      : id === 94
      ? ["src/pages/Contact.jsx", "src/components/store/CartSidebar.jsx"]
      : ["src/components/store/CartSidebar.jsx"],
  tested: "Code inspection only",
  done:
    id === 2
      ? "A shared body-scroll-lock helper exists and other overlays already use it."
      : id === 5
      ? "Checkout now expects explicit legal acceptance on the backend."
      : id === 94
      ? "Legal pages exist and can be linked, but the audited surfaces do not currently prove the claimed behavior."
      : "Basic Stripe redirect logic exists.",
  missing:
    id === 2
      ? "CartSidebar does not import or apply `acquireBodyScrollLock()` on open/close."
      : id === 5
      ? "CartSidebar does not render an SMS consent checkbox and does not send `accepted_legal` to checkout."
      : id === 94
      ? "The contact form and checkout sidebar do not currently show a clear in-form privacy link as claimed."
      : "There is no visible 12-second timeout fallback or recovery path if the Stripe redirect stalls.",
}));

markMany([27], {
  audit: "In progress claim is weak; core requirement still missing",
  evidence: ["src/main.jsx", "src/components/ui/sonner.jsx"],
  tested: "Code inspection only",
  done: "The codebase already depends on `next-themes` in the toast layer.",
  missing: "Wrap the app in a real `ThemeProvider`, persist theme state, and ensure dark-mode classes reach the document root.",
});

markMany([43], {
  audit: "In progress claim is weak; implementation missing",
  evidence: ["src/components/store/CartSidebar.jsx", "src/lib/bodyScrollLock.js"],
  tested: "Code inspection only",
  done: "The shared scroll-lock utility exists and is already used by other overlays.",
  missing: "Import it into `CartSidebar`, acquire on open, release on close/unmount, and add a regression test or browser check.",
});

markMany([47], {
  audit: "In progress claim is weak; still hardcoded",
  evidence: ["src/components/store/SocialProofTicker.jsx"],
  tested: "Code inspection only",
  done: "The ticker UI exists and rotates messages.",
  missing: "Replace the `mockPurchases` array with real order-backed data or explicitly mark the widget as demo-only.",
});

markMany([70, 195], {
  audit: "Partial: payment portal exists, cancel flow does not match task",
  evidence: ["src/components/portal/BillingDashboard.jsx", "base44/functions/getStripeCustomerPortalUrl/entry.ts", "src/components/portal/PlanManager.jsx"],
  tested: "Code inspection only; no live portal proof",
  done: "Billing already opens Stripe/customer payment tooling, and PlanManager supports manual cancellation requests.",
  missing: "Expose an explicit cancel-subscription CTA that intentionally routes to a verified working Stripe portal cancellation flow.",
});

markMany([72, 194], {
  audit: "Partial: banner exists but is not wired where the task claims",
  evidence: ["src/components/portal/PaymentFailedBanner.jsx", "src/pages/ClientPortal.jsx"],
  tested: "Code inspection only",
  done: "A payment-failed banner component exists and can detect past-due/unpaid states.",
  missing: "Mount it in the portal flow and verify it keys off the canonical order/subscription state the task expects.",
});

markMany([146], {
  audit: "Verified complete (repo)",
  evidence: ["base44/functions/createCheckoutSession/entry.ts"],
  tested: "Code inspection only; no separate checkout metadata test",
  done: "`subscription_data.metadata.order_id` is already written into Stripe checkout session creation.",
  missing: "Add a direct automated assertion if you want stronger proof than code inspection alone.",
});

markMany([147], {
  audit: "Verified complete (repo)",
  evidence: ["base44/functions/stripeWebhookOrders/entry.ts", "base44/functions/_shared/subscriptionSync.js", "tests/subscriptionSync.test.js"],
  tested: "Covered by `npm test`",
  done: "`invoice.payment_failed` flows through subscription sync and maps the order into `past_due` billing state.",
  missing: "Do a live Stripe failure test if you want environment-proof instead of repo-proof.",
});

markMany([148], {
  audit: "Partial: billing warning state exists, recovery-email path is still missing",
  evidence: ["base44/functions/stripeWebhookOrders/entry.ts", "base44/functions/createInvoicePaymentLink/entry.ts"],
  tested: "Code inspection only",
  done: "The backend can create payment-update links and mark billing into a warning state.",
  missing: "Trigger a dedicated recovery email on payment failure and prove it contains the correct update-payment URL.",
});

markMany([126], {
  audit: "Mostly done in repo; still needs explicit verification",
  evidence: ["base44/functions/scheduleFollowUpSMS/entry.ts"],
  tested: "Covered indirectly by passing test suite, but no timezone-specific assertion found",
  done: "Follow-up SMS logic was hardened around Phoenix business-hours gating.",
  missing: "Add a timezone-focused test that proves Phoenix handling across edge times and DST assumptions.",
});

markMany([127], {
  audit: "Valid pending, currently blocked by canonical lockdown",
  evidence: ["base44/functions/receiveTwilioInboundSms/entry.ts"],
  tested: "Code inspection only",
  done: "The repo explicitly quarantines the legacy inbound SMS endpoint instead of pretending it works canonically.",
  missing: "Rebuild inbound STOP handling on the canonical runtime path rather than the disabled legacy endpoint.",
});

markMany([128], {
  audit: "Partial: one major send path is hardened, not all send paths",
  evidence: ["base44/functions/scheduleFollowUpSMS/entry.ts"],
  tested: "Code inspection only",
  done: "Follow-up SMS now appends opt-out language if a template omits it.",
  missing: "Audit every outbound SMS entrypoint and enforce the same STOP-language rule everywhere.",
});

markMany([131], {
  audit: "Valid pending, code exists but render truth is unproven",
  evidence: ["base44/functions/sendOrderConfirmationEmail/entry.ts"],
  tested: "Template code only; no client render proof stored in repo",
  done: "A canonical order-confirmation template exists and loops through purchased items.",
  missing: "Render/send proof for all service-name combinations across the actual template output.",
});

markMany([139], {
  audit: "Valid pending; scoring surfaces exist but this specific verification is not proved",
  evidence: ["src/pages/LeadIntelligence.jsx", "src/components/leads/LeadsTableIntelligence.jsx"],
  tested: "No dedicated score-audit test found",
  done: "Lead scores and labels are surfaced in multiple admin and lead-intelligence views.",
  missing: "Trace the actual score-calculation implementation against every intended scoring factor and add assertions for the edge cases.",
});

markMany([154, 155], (id) => ({
  audit: "Partial: the surface exists; accuracy claim is still unverified",
  evidence:
    id === 154
      ? ["src/components/admin/RevenueDashboard.jsx"]
      : ["base44/functions/getClientAnalytics/entry.ts", "tests/portalAndLaunchHardening.test.js"],
  tested: id === 155 ? "Some coverage exists in `npm test`" : "Code inspection only",
  done:
    id === 154
      ? "Revenue/MRR views exist in admin."
      : "Client analytics was hardened away from obvious mock/ownership drift in the recent backend work.",
  missing:
    id === 154
      ? "Confirm the MRR math source is canonical paid orders and add a regression test."
      : "Audit every returned metric field for real entity sourcing and remove any remaining placeholder values.",
}));

markMany([157, 220], (id) => ({
  audit: "Pending, but duplicated",
  evidence: ["src/MASTER_TASK_LIST.md"],
  tested: "Not applicable",
  done: "The backlog captures the need for an `AuditLog` entity in two different places.",
  missing: id === 157 ? "Implement one canonical `AuditLog` entity and delete the duplicate row." : "Merge this duplicate into #157 and then implement the single canonical entity.",
}));

markMany([168, 173, 179, 188], (id) => ({
  audit: "Stale pending: already built in repo",
  evidence:
    id === 168
      ? ["src/components/admin/LeadBulkToolbar.jsx", "src/components/admin/LeadManagementDashboard.jsx"]
      : id === 173
      ? ["src/pages/AdminDashboard.jsx", "src/components/admin/WebsiteLeadsDashboard.jsx"]
      : id === 179
      ? ["src/components/admin/LeadManagementDashboard.jsx", "src/components/admin/LeadScoreBadge.jsx"]
      : ["src/components/admin/AutomationInstallChecklist.jsx"],
  tested: "Code inspection only",
  done:
    id === 168
      ? "Bulk lead actions already exist in the admin lead workspace."
      : id === 173
      ? "Admin dashboard already exposes a Website Leads tab."
      : id === 179
      ? "Admin leads already render color-coded lead-score badges."
      : "Automation install checklist already shows a progress bar and completed-step counts.",
  missing: "Update the task status or narrow the task text if a different acceptance criterion is intended.",
}));

markMany([201, 202, 203, 204, 206, 211, 212, 213], (id) => ({
  audit: "Live / ops verification required",
  evidence:
    id <= 206
      ? ["base44/functions/createCheckoutSession/entry.ts", "base44/functions/stripeWebhookOrders/entry.ts", "base44/functions/getStripeCustomerPortalUrl/entry.ts"]
      : ["src/MASTER_TASK_LIST.md"],
  tested: "Not repo-verifiable without live credentials, vendor dashboards, or deployed domain access",
  done:
    id === 204
      ? "Webhook handling exists for renewal-related invoice events, but live renewal proof is not stored here."
      : "The repo contains the code paths that will consume these live configuration changes.",
  missing:
    id === 201
      ? "Set live Stripe keys in the real environment and confirm no test keys remain active."
      : id === 202
      ? "Point Stripe’s live webhook endpoint at the production domain and verify signatures succeed."
      : id === 203
      ? "Run a real-card purchase on the live domain and record order/email/subscription outcomes."
      : id === 204
      ? "Wait for or simulate a live renewal cycle and capture proof that `invoice.paid` is handled correctly."
      : id === 206
      ? "Open the portal for multiple paid customers and prove the returned Stripe portal URL works for each."
      : id === 211
      ? "Confirm DNS and certificate status on the actual live host."
      : id === 212
      ? "Create a real monitor against a deployed health endpoint; the health endpoint itself is still missing."
      : "Use the vendor dashboard or production environment to verify this external requirement.",
}));

setOverride(213, {
  audit: "Live / ops verification required",
  evidence: ["src/MASTER_TASK_LIST.md"],
  tested: "Not repo-verifiable",
  done: "This row represents external Resend deliverability setup, not code.",
  missing: "Verify SPF, DKIM, and DMARC in the sending domain and record live proof.",
}, 1);

setOverride(213, {
  audit: "Live / ops verification required",
  evidence: ["src/MASTER_TASK_LIST.md"],
  tested: "Not repo-verifiable",
  done: "This second `#213` row is an external Twilio compliance requirement, not repo code.",
  missing: "Confirm A2P 10DLC registration on the real Twilio number and renumber this duplicate task ID.",
}, 2);

markMany([214, 295, 296, 297], (id) => ({
  audit: "Partial foundation only",
  evidence:
    id === 214
      ? ["src/lib/analytics.js", "index.html"]
      : id === 295 || id === 296
      ? ["src/lib/analytics.js"]
      : ["src/pages/Contact.jsx", "src/components/landing/LeadCaptureForm.jsx"],
  tested: "Code inspection only",
  done:
    id === 214
      ? "A lightweight client analytics helper exists, but GA4 is not actually bootstrapped in the page shell."
      : id === 295 || id === 296
      ? "The repo has a reusable `trackEvent()` helper ready for wiring."
      : "Contact already captures UTM values in form state before submission.",
  missing:
    id === 214
      ? "Install a real GA4/gtag snippet and wire the named conversion events."
      : id === 295
      ? "Call `trackEvent()` on the real checkout CTA surfaces and verify the events fire."
      : id === 296
      ? "Instrument public form submit success paths and verify the events fire."
      : "Persist UTM values on the actual lead record path for every relevant form, not just the contact form state.",
}));

markMany([221, 222, 235], (id) => ({
  audit: "Valid pending",
  evidence: ["src/MASTER_TASK_LIST.md"],
  tested: "No matching implementation found",
  done:
    id === 235
      ? "Portal and backlog language already anticipate a changelog feed."
      : "The need is documented, but no entity/schema implementation is present.",
  missing:
    id === 221
      ? "Create the `Changelog` entity, define fields and RLS, then wire portal reads."
      : id === 222
      ? "Create the `Referral` entity, define fields and RLS, then wire referral creation/reads."
      : "Seed the first published changelog records after the entity exists.",
}));

markMany([223, 224, 225, 227, 228, 229], {
  audit: "Valid pending",
  evidence: ["base44/entities"],
  tested: "No matching schema fields found for the requested change",
  done: "The surrounding entities already exist.",
  missing: "Add the field(s), update writes/reads, and add schema-level plus flow-level tests.",
});

markMany([251, 252, 253, 254, 256, 257, 258, 270], (id) => ({
  audit:
    id === 252
      ? "Valid pending; current inbound-SMS path is intentionally quarantined"
      : id === 256
      ? "Partial / wrong-scope claim: analytics reads exist, but the page is still a legacy workspace"
      : "Valid pending",
  evidence:
    id === 252
      ? ["base44/functions/receiveTwilioInboundSms/entry.ts", "base44/functions/automationOrchestrator/entry.ts"]
      : ["base44/functions/automationOrchestrator/entry.ts", "src/pages/LeadIntelligence.jsx", "src/components/admin/AILeadInsightPanel.jsx"],
  tested: "Code inspection only",
  done:
    id === 251
      ? "The `scoreLeadIntelligence` function is deployed and documented."
      : id === 252
      ? "The repo clearly blocks the legacy inbound SMS handler instead of pretending it is canonical."
      : id === 253
      ? "The `predictChurnRisk` function is deployed and available to the orchestrator."
      : id === 254
      ? "The orchestrator function exists and can already fan out to AI helpers."
      : id === 256
      ? "Lead Intelligence already reads `LeadAnalytics`, but only inside the legacy `Lead` workspace."
      : id === 257
      ? "Admin already has an AI qualification panel, but it targets `aiQualifyLead`, not the requested rescore path."
      : id === 258
      ? "Portal lead surfaces exist, so there is a place to render predictions once a canonical source exists."
      : "Churn-risk logic exists at the function level, but no admin panel consumes it yet.",
  missing:
    id === 251
      ? "Wire it to canonical WebsiteLead creation or explicitly rewrite the task around the canonical lead path."
      : id === 252
      ? "Implement classify-intent on the canonical inbound reply path, not the disabled legacy handler."
      : id === 253
      ? "Schedule weekly churn runs, persist results, and notify Nolan on high-risk scores."
      : id === 254
      ? "Add an admin control surface that intentionally invokes the orchestrator and records the result."
      : id === 256
      ? "Decide whether this feature belongs on the legacy page or the canonical customer-leads workspace, then wire the right data source."
      : id === 257
      ? "Add a real rescore action in the admin lead list and persist the canonical output."
      : id === 258
      ? "Generate/store prediction output and expose it in the portal leads experience."
      : "Persist churn scores and render a canonical panel in admin.",
}));

markMany([261, 262, 263, 265, 266], (id) => ({
  audit:
    id === 261
      ? "Duplicate of #70 with the same gap"
      : id === 262
      ? "Duplicate of #71 with the same gap"
      : id === 263
      ? "Duplicate of #72 with the same gap"
      : id === 265 || id === 266
      ? "Partial foundation only"
      : "Valid pending",
  evidence:
    id === 265 || id === 266
      ? ["src/components/portal/BuildTracker.jsx", "src/components/admin/InstallChecklistPanel.jsx", "base44/functions/initializeInstallOS/entry.ts"]
      : ["src/pages/ClientPortal.jsx", "src/components/portal/BillingDashboard.jsx", "src/components/portal/PaymentFailedBanner.jsx"],
  tested: "Code inspection only",
  done:
    id === 265
      ? "Automation checklist entities and admin surfaces already exist."
      : id === 266
      ? "The portal already shows progress from mirrored project/order state."
      : "The related portal foundation already exists.",
  missing:
    id === 261
      ? "Merge into #70 and implement the explicit Stripe-portal cancel flow once."
      : id === 262
      ? "Merge into #71 and decide whether the existing invoice download UX is sufficient."
      : id === 263
      ? "Merge into #72 and wire the payment-failed banner into the actual portal flow."
      : id === 265
      ? "Read `AutomationChecklist` / `AutomationChecklistStep` directly in the client portal and expose live per-service progress."
      : "Switch the portal progress source from mirror fields to canonical `ClientInstallationOS` fields if that is now the intended truth source.",
}));

markMany([276, 277], (id) => ({
  audit: "Partial foundation only",
  evidence:
    id === 276
      ? ["src/components/admin/InstallChecklistPanel.jsx", "src/components/admin/AutomationInstallChecklist.jsx"]
      : ["src/components/admin/AutomationInstallChecklist.jsx", "src/components/admin/InstallOrderWorkspace.jsx", "base44/entities/AutomationChecklist.jsonc"],
  tested: "Code inspection only",
  done:
    id === 276
      ? "Checklist components already exist and read checklist/step entities on the admin side."
      : "Some onboarding/live/twilio state is already visible in admin install surfaces.",
  missing:
    id === 276
      ? "Decide which checklist component is canonical, wire it where operators actually work, and remove overlap."
      : "Expose the exact requested fields consistently in the intended admin view and add proof that the values stay in sync.",
}));

markMany([278, 279, 280, 299, 300], (id) => ({
  audit: "Valid pending",
  evidence:
    id === 280
      ? ["src/pages/ClientPortal.jsx", "src/components/portal/BuildTracker.jsx"]
      : id === 300
      ? ["src/components/landing/LeadCaptureForm.jsx", "src/pages/Contact.jsx", "src/components/store/CartSidebar.jsx"]
      : ["src/MASTER_TASK_LIST.md"],
  tested: "No matching end-to-end implementation found",
  done:
    id === 280
      ? "There is already a client-authenticated progress view to borrow from."
      : id === 300
      ? "Public forms exist, so there are known insertion points for compliant disclosure."
      : "The need is documented, but implementation is not present.",
  missing:
    id === 278
      ? "Add a canonical live-email trigger tied to the true go-live field and prove it sends exactly once."
      : id === 279
      ? "Add a Telegram integration path, secret storage, event trigger, and delivery proof."
      : id === 280
      ? "Build the public `/setup` status route, define auth/privacy rules, and source the right progress data."
      : id === 299
      ? "Add a real skip link, main-content anchors, and keyboard-visibility styling across layouts."
      : "Add the TCPA disclosure to every public lead form, persist consent proof, and verify copy/legal accuracy.",
}));

markMany([281], {
  audit: "Duplicate of #80; both remain valid and incomplete",
  evidence: ["src/pages/Onboarding.jsx"],
  tested: "Code inspection only",
  done: "The onboarding form has required fields, but section-to-section gating is still loose.",
  missing: "Merge this duplicate into #80 and add real validation before navigation and final submit.",
});

markMany([285, 289], (id) => ({
  audit: "Partial foundation only",
  evidence: ["index.html"],
  tested: "Code inspection only",
  done:
    id === 285
      ? "Index already preconnects fonts and Resend."
      : "Index already contains some preconnect groundwork.",
  missing:
    id === 285
      ? "Add the remaining intended origins (for example Stripe) only if they are actually needed in the browser shell."
      : "Add only the browser-relevant third-party origins and confirm they correspond to real frontend network usage.",
}));

markMany([290], {
  audit: "Duplicate of #62; still incomplete",
  evidence: ["index.html"],
  tested: "Code inspection only",
  done: "The app shell references `/manifest.json`.",
  missing: "Create the manifest file itself, decide whether a service worker belongs in scope, and then close both tasks together.",
});

markMany([294], {
  audit: "Valid pending",
  evidence: ["index.html", "src/lib/analytics.js"],
  tested: "Code inspection only",
  done: "Analytics helper code exists and the page shell is the correct place to bootstrap GA4.",
  missing: "Install a real GA4 property ID and prove the gtag snippet loads in the deployed site.",
});

markMany([241, 242, 243, 244, 245, 246, 247, 248, 249, 250], {
  audit: "Final-stage manual or live verification required",
  evidence: ["src/MASTER_TASK_LIST.md"],
  tested: "Not fully repo-verifiable",
  done: "The codebase now has a stronger baseline (`npm test`, `npm run lint`, and `npm run build` are green), but these rows are launch-proof checks, not repo-only changes.",
  missing: "Run the named final check in the real launch environment and record the result explicitly before calling it green.",
});

function buildDefaultAssessment(task) {
  if (duplicateTargets.has(task.id)) {
    const target = duplicateTargets.get(task.id);
    return {
      audit: `Duplicate / overlap with #${target}`,
      evidence: ["src/MASTER_TASK_LIST.md"],
      tested: "Not applicable",
      done: "The backlog already contains this requirement under another task.",
      missing: `Merge this row into #${target}, then keep only one canonical acceptance criterion.`,
    };
  }

  if (liveOnlyDefault(task.task)) {
    return {
      audit: "Live / ops verification required",
      evidence: findEvidence(task.task).length ? findEvidence(task.task) : ["src/MASTER_TASK_LIST.md"],
      tested: "Not repo-verifiable without deployed environment access",
      done: "The task is framed as an environment, vendor, or final QA check rather than a pure repo change.",
      missing: "Perform the named live verification and attach proof before marking it complete.",
    };
  }

  const areaEvidence = findEvidence(task.task);
  const looksLikeVerification = /verify|test|confirm|audit/i.test(task.task);

  return {
    audit: looksLikeVerification ? "Valid pending verification task" : "Valid pending implementation task",
    evidence: areaEvidence.length ? areaEvidence : ["src/MASTER_TASK_LIST.md"],
    tested: "No direct proof found beyond the current repo baseline",
    done: areaEvidence.length
      ? `Related implementation area exists: ${areaEvidence.join(", ")}.`
      : "No meaningful implementation evidence found beyond the backlog row itself.",
    missing: looksLikeVerification
      ? "Run the targeted verification, document the exact result, and add automated coverage if the check should stay green."
      : "Implement the requested change, add focused coverage, and then verify it in the right runtime surface.",
  };
}

function getAssessment(task) {
  return overrides.get(task.key) || buildDefaultAssessment(task);
}

const headerCounts = tasks.reduce(
  (acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  },
  {}
);

const duplicate213Count = tasks.filter((task) => task.id === 213).length;

let output = "";

output += "# Task Authenticity Audit — 2026-05-03\n\n";
output += "This audit treats the task list as a set of claims, not a source of truth. Each row below says whether the claim is actually supported by repo evidence, only partially implemented, duplicated elsewhere, or impossible to verify from code alone.\n\n";
output += "## Baseline\n\n";
output += "- Source backlog: `src/MASTER_TASK_LIST.md`\n";
output += `- Parsed task rows: ${tasks.length}\n`;
output += `- Parsed status counts: ✅ ${headerCounts["✅"] || 0}, 🔄 ${headerCounts["🔄"] || 0}, ⏳ ${headerCounts["⏳"] || 0}, ❌ ${headerCounts["❌"] || 0}\n`;
output += `- Duplicate numbering issue: task #213 appears ${duplicate213Count} times\n`;
output += "- Verification baseline: `npm test`, `npm run lint`, and `npm run build` all pass on 2026-05-03\n\n";
output += "## Legend\n\n";
output += "- `Verified complete (repo)`: code and/or tests support the claim inside this repository\n";
output += "- `Stale pending`: the list says pending, but the repo already contains the feature or a close equivalent\n";
output += "- `Claim overstated`: the list says complete, but the current repo does not actually satisfy the task\n";
output += "- `Partial`: some real scaffolding exists, but the acceptance criteria are not met end to end\n";
output += "- `Duplicate / overlap`: this row should be merged into another task instead of tracked separately\n";
output += "- `Live / ops verification required`: cannot honestly be called green from repo code alone\n";
output += "- `Valid pending`: still a real task, but no trustworthy completion evidence was found\n\n";

let currentSection = null;

for (const task of tasks) {
  if (task.section !== currentSection) {
    currentSection = task.section;
    output += `## ${currentSection}\n\n`;
  }

  const assessment = getAssessment(task);
  const displayId =
    task.id === 213 && task.occurrence === 2 ? "213b" : task.id === 213 && task.occurrence === 1 ? "213a" : `${task.id}`;
  const claim = statusLabel[task.status] || task.status;
  const evidence = (assessment.evidence || []).map((item) => `\`${rel(item)}\``).join(", ");

  output += `- **#${displayId}** [claim: ${claim}] ${task.task}\n`;
  output += `  Audit: ${assessment.audit}.\n`;
  output += `  Evidence: ${evidence || "\`src/MASTER_TASK_LIST.md\`"}.\n`;
  output += `  Tested: ${assessment.tested}.\n`;
  output += `  🟩 Done: ${assessment.done}\n`;
  output += `  🟨 Missing: ${assessment.missing}\n\n`;
}

output += "## Highest-Signal Findings\n\n";
output += "- The backlog header is not trustworthy in its current form: it still says 250 tasks even though the file now runs through #300 and contains a duplicated #213.\n";
output += "- Several rows marked complete are not true in the current repo, including the cart body-scroll lock, the checkout SMS/legal consent flow, the checkout privacy-link claim, and the Stripe-redirect timeout fallback.\n";
output += "- Several rows still marked pending are already built or mostly built, especially the portal support tab, the billing tab, the website-leads admin workspace, the lead-intelligence score display, and global metadata helpers.\n";
output += "- The most important in-progress Stripe items split three ways: #146 and #147 are effectively done in repo, #148 is still missing the recovery-email leg, and #201-#203 / #206 remain live-environment checks, not repo-only tasks.\n";
output += "- The expansion pack adds useful work, but a few rows are aimed at legacy lead surfaces or duplicate existing portal/admin features instead of tightening the canonical paid-customer path.\n";

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, output, "utf8");

console.log(`Wrote ${path.relative(repoRoot, outputFile)}`);
