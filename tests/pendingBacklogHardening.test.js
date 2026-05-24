import { readFileSync, existsSync, readdirSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function* walkSourceFiles(path) {
  for (const entry of readdirSync(new URL(`../${path}`, import.meta.url), { withFileTypes: true })) {
    const childPath = `${path}/${entry.name}`;
    if (entry.isDirectory()) {
      yield* walkSourceFiles(childPath);
    } else if (/\.(jsx|tsx|md)$/.test(entry.name)) {
      yield childPath;
    }
  }
}

function extractImgTags(source) {
  const tags = [];
  let index = source.indexOf("<img");

  while (index !== -1) {
    let quote = null;
    let braceDepth = 0;

    for (let cursor = index + 4; cursor < source.length; cursor += 1) {
      const char = source[cursor];
      const previous = source[cursor - 1];

      if (quote) {
        if (char === quote && previous !== "\\") quote = null;
        continue;
      }

      if (char === "\"" || char === "'" || char === "`") {
        quote = char;
      } else if (char === "{") {
        braceDepth += 1;
      } else if (char === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
      } else if (char === ">" && braceDepth === 0) {
        tags.push({ index, tag: source.slice(index, cursor + 1) });
        break;
      }
    }

    index = source.indexOf("<img", index + 4);
  }

  return tags;
}

test("package classification handles edge counts and logs reasoning", () => {
  const entry = read("base44/functions/classifyPurchasedPackage/entry.ts");
  assert.match(entry, /selectedCount === 5/);
  assert.match(entry, /package_key: "elite"/);
  assert.match(entry, /needs_admin_review: true/);
  assert.match(entry, /selectedCount === 3/);
  assert.match(entry, /package_key: "growth"/);
  assert.match(entry, /entities\.AgentLog\.create/);
  assert.match(entry, /reasoning/);
});

test("admin purchase notifications fall back to email when Telegram is unavailable", () => {
  const entry = read("base44/functions/sendAdminPurchaseNotification/entry.ts");
  assert.match(entry, /sendBackupEmail/);
  assert.match(entry, /ADMIN_NOTIFICATION_EMAIL/);
  assert.match(entry, /nolan@clientsurgesystems\.com/);
  assert.match(entry, /TELEGRAM_BOT_TOKEN missing/);
});

test("credentials saving supports admin bypass and structured validation", () => {
  const entry = read("base44/functions/saveClientCredentials/entry.ts");
  assert.match(entry, /REQUIRED_FIELDS_BY_TIER/);
  assert.match(entry, /admin_bypass/);
  assert.match(entry, /base44\.auth\.me/);
  assert.match(entry, /admin_bypass requires admin role/);
  assert.match(entry, /errors: validationErrors/);

  const wizard = read("src/components/onboarding/CredentialsWizard.jsx");
  assert.match(wizard, /twilio_business_phone: data\.twilio_business_phone \|\| data\.business_phone/);
});

test("service templates reject overlong SMS before writing install configuration", () => {
  const entry = read("base44/functions/generateServiceTemplates/entry.ts");
  assert.match(entry, /MAX_SMS_CHARS = 160/);
  assert.match(entry, /validateSmsLengths/);
  assert.match(entry, /status: 422/);
  assert.match(entry, /install_configuration: updated_cfg/);
});

test("elite deliverables create file and report records", () => {
  assert.equal(existsSync(new URL("../base44/entities/Files.jsonc", import.meta.url)), true);
  assert.equal(existsSync(new URL("../base44/entities/Reports.jsonc", import.meta.url)), true);

  const leadMagnet = read("base44/functions/generateLeadMagnet/entry.ts");
  assert.match(leadMagnet, /entities\.Files\.create/);
  assert.match(leadMagnet, /event_type: "portal_notification"/);
  assert.match(leadMagnet, /file_base64/);

  const report = read("base44/functions/generateMonthlyPerformanceReport/entry.ts");
  assert.match(report, /entities\.Reports\.create/);
  assert.match(report, /metrics_json/);
  assert.match(report, /text: `Monthly Performance Report/);
});

test("setup status exposes an error support action", () => {
  const status = read("src/internal-pages/SetupStatus.jsx");
  assert.match(status, /Contact Support/);
  assert.match(status, /SupportChat/);
  assert.match(status, /mailto:nolan@clientsurgesystems\.com/);
});

test("backup and rollback runbook exists", () => {
  const runbook = read("docs/BASE44_BACKUP_AND_ROLLBACK.md");
  assert.match(runbook, /Monthly Data Backup/);
  assert.match(runbook, /Go-Live Rollback/);
  assert.match(runbook, /Signed: Neo/);
});

test("Tawk live chat is env-gated before loading the third-party script", () => {
  const env = read("src/lib/publicEnv.js");
  const widget = read("src/components/landing/TawkLiveChat.jsx");
  const home = read("src/pages/Home.jsx");

  assert.match(env, /VITE_TAWK_TO_PROPERTY_ID/);
  assert.match(env, /VITE_TAWK_TO_WIDGET_ID/);
  assert.match(widget, /https:\/\/embed\.tawk\.to\/\$\{propertyId\}\/\$\{widgetId\}/);
  assert.match(widget, /if \(!enabled\) return undefined/);
  assert.match(home, /<TawkLiveChat \/>/);
});

test("nurture campaigns have timezone-aware send windows", () => {
  const client = read("base44/entities/Client.jsonc");
  const campaign = read("base44/entities/NurtureCampaign.jsonc");
  const settings = read("base44/entities/AdminSettings.jsonc");
  const processor = read("base44/functions/processNurtureCampaigns/entry.ts");

  assert.match(client, /"timezone"/);
  assert.match(campaign, /"timezone"/);
  assert.match(settings, /"timezone"/);
  assert.match(processor, /isNurtureSendWindow/);
  assert.match(processor, /timezone_deferred/);
  assert.match(processor, /8am-8pm/);
});

test("lazy section skeletons reserve min-height to reduce layout shift", () => {
  const skeleton = read("src/components/landing/SkeletonLoader.jsx");
  assert.match(skeleton, /minHeight: height/);
});

test("admin IP allowlist is represented in settings schema", () => {
  const settings = read("base44/entities/AdminSettings.jsonc");
  assert.match(settings, /admin_ip_allowlist/);
});

test("installPipeline actions use the shared timeout wrapper", () => {
  const entry = read("base44/functions/installPipeline/entry.ts");
  const env = read("src/README_ENV.md");

  assert.match(entry, /import \{ withTimeout \} from "\.\.\/_shared\/timeout\.js"/);
  assert.match(entry, /INSTALL_PIPELINE_TIMEOUT_MS/);
  assert.match(entry, /30000/);
  assert.match(entry, /withTimeout\(\s*listInstallQueueOrders/);
  assert.match(entry, /withTimeout\(\s*initializePaidOrderInstallPipeline/);
  assert.match(entry, /withTimeout\(\s*updateTrackedServiceInstallStatus/);
  assert.match(env, /INSTALL_PIPELINE_TIMEOUT_MS/);
});

test("discoverLeads fails clearly when Google Maps key is missing", () => {
  const guard = read("base44/functions/shared/discoverLeadsGuard.ts");
  const entry = read("base44/functions/discoverLeads/entry.ts");
  const env = read("src/README_ENV.md");

  assert.match(guard, /GOOGLE_MAPS_API_KEY/);
  assert.match(guard, /status: 503/);
  assert.match(entry, /requireGoogleMapsKey\(\)/);
  assert.match(env, /GOOGLE_MAPS_API_KEY/);
});

test("before-after slider supports touch and visible mobile handle", () => {
  const slider = read("src/components/visual-effects/BeforeAfterSlider.jsx");

  assert.match(slider, /onTouchStart=\{handleTouchMove\}/);
  assert.match(slider, /onTouchMove=\{handleTouchMove\}/);
  assert.match(slider, /touchAction: "pan-y"/);
  assert.match(slider, /role="slider"/);
  assert.match(slider, /aria-valuenow/);
  assert.match(slider, /width: "44px"/);
  assert.match(slider, /height: "44px"/);
});

test("interactive journey map exposes labeled clickable step state", () => {
  const journeyMap = read("src/components/landing/InteractiveJourneyMap.jsx");

  assert.match(journeyMap, /aria-expanded=\{expandedNode === step\.id\}/);
  assert.match(journeyMap, /aria-controls=\{`journey-step-detail-\$\{step\.id\}`\}/);
  assert.match(journeyMap, /aria-label=\{`\$\{step\.day\}: \$\{step\.label\}\. \$\{step\.description\}`\}/);
  assert.match(journeyMap, /onClick=\{\(\) => setExpandedNode/);
});

test("admin settings save has visible success feedback", () => {
  const settingsPanel = read("src/components/admin/AdminSettingsPanel.jsx");

  assert.match(settingsPanel, /const \[saved, setSaved\] = useState\(false\)/);
  assert.match(settingsPanel, /setSaved\(true\)/);
  assert.match(settingsPanel, /Settings saved successfully/);
  assert.match(settingsPanel, /CheckCircle/);
});

test("admin communication templates include preview before save/send", () => {
  const communicationTemplates = read("src/components/admin/CommunicationTemplates.jsx");
  const previewModal = read("src/components/admin/EmailTemplatePreviewModal.jsx");

  assert.match(communicationTemplates, /onPreview/);
  assert.match(communicationTemplates, /Preview/);
  assert.match(communicationTemplates, /renderTemplate/);
  assert.match(communicationTemplates, /Test Variables/);
  assert.match(previewModal, /substituteVars/);
});

test("client portal is the canonical authenticated portal route", () => {
  const app = read("src/App.jsx");
  const mobileNav = read("src/components/dashboard/MobileBottomNav.jsx");

  assert.match(app, /function PortalRedirect/);
  assert.match(app, /routePath\("client-dashboard"\), element: <PortalRedirect \/>/);
  assert.match(app, /routePath\("client-portal"\)/);
  assert.match(mobileNav, /\/client-portal\?tab=plan/);
  assert.doesNotMatch(mobileNav, /\/client-dashboard/);
});

test("client lifecycle emails use APP_URL-backed canonical portal and setup links", () => {
  const emailFunctionPaths = [
    "base44/functions/onOnboardingStageChange/entry.ts",
    "base44/functions/sendClientWelcomeEmail/entry.ts",
    "base44/functions/sendPortalWelcomeEmail/entry.ts",
    "base44/functions/sendMilestoneEmail/entry.ts",
    "base44/functions/sendWentLiveEmail/entry.ts",
    "base44/functions/missingCredentialsAlert/entry.ts",
    "base44/functions/autoSendWebhookInstructions/entry.ts",
  ];

  for (const file of emailFunctionPaths) {
    const source = read(file);
    assert.match(source, /APP_URL/);
    assert.match(source, /https:\/\/clientsurgesystems\.com/);
    assert.doesNotMatch(source, /\/client-dashboard/);
    assert.doesNotMatch(source, /https:\/\/www\.clientsurgesystems\.com\/(?:client-portal|setup)/);
  }

  const onboarding = read("base44/functions/onOnboardingStageChange/entry.ts");
  const clientWelcome = read("base44/functions/sendClientWelcomeEmail/entry.ts");
  const milestone = read("base44/functions/sendMilestoneEmail/entry.ts");
  const missingCredentials = read("base44/functions/missingCredentialsAlert/entry.ts");
  const webhookInstructions = read("base44/functions/autoSendWebhookInstructions/entry.ts");

  assert.match(onboarding, /const PORTAL_URL = `\$\{APP_URL\}\/client-portal`/);
  assert.match(clientWelcome, /encodeURIComponent\(order_id\)/);
  assert.match(milestone, /encodeURIComponent\(project\.order_id\)/);
  assert.match(missingCredentials, /encodeURIComponent\(order\.id\)/);
  assert.match(webhookInstructions, /encodeURIComponent\(order\.id\)/);
});

test("portal nudges unfinished onboarding and explicit unverified email", () => {
  const portal = read("src/internal-pages/ClientPortal.jsx");

  assert.match(portal, /getInitialPortalTab/);
  assert.match(portal, /onboarding_wizard_completed === false/);
  assert.match(portal, /setActiveTab\("quickstart"\)/);
  assert.match(portal, /isEmailExplicitlyUnverified/);
  assert.match(portal, /Verify your email to keep portal access secure/);
});

test("admin lead access scopes non-super admins to assigned leads", () => {
  const summary = read("base44/functions/getLeadPipelineSummary/entry.ts");
  const bulk = read("base44/functions/bulkLeadAction/entry.ts");
  const settings = read("base44/entities/AdminSettings.jsonc");

  assert.match(settings, /super_admin_emails/);
  assert.match(summary, /filterLeadsForAdmin/);
  assert.match(summary, /normalizeEmail\(lead\.assigned_to\) === userEmail/);
  assert.match(summary, /ADMIN_EMAIL/);
  assert.match(bulk, /canAccessLead/);
  assert.match(bulk, /Lead is not assigned to this admin/);
});

test("destructive admin webhook delete uses modal confirmation", () => {
  const panel = read("src/components/admin/webhook/WebhookConfigPanel.jsx");

  assert.match(panel, /DeleteConfirmModal/);
  assert.match(panel, /deleteCandidate/);
  assert.match(panel, /Delete Webhook Source/);
  assert.doesNotMatch(panel, /confirm\("Delete this webhook registration\?"\)/);
});

test("admin operational actions use shared confirmation modals", () => {
  const installWorkspace = read("src/components/admin/InstallOrderWorkspace.jsx");
  const emailCampaigns = read("src/components/admin/EmailCampaignPanel.jsx");
  const automationRules = read("src/components/admin/AutomationRulesPanel.jsx");

  for (const source of [installWorkspace, emailCampaigns, automationRules]) {
    assert.match(source, /DeleteConfirmModal/);
    assert.doesNotMatch(source, /window\.confirm/);
    assert.doesNotMatch(source, /\bconfirm\(/);
  }

  assert.match(installWorkspace, /setupSequenceConfirmOpen/);
  assert.match(emailCampaigns, /sendCandidate/);
  assert.match(automationRules, /deleteCandidate/);
});

test("dashboard messaging panel sends through SMS function before refreshing messages", () => {
  const panel = read("src/components/dashboard/MessagingPanel.jsx");

  assert.match(panel, /base44\.functions\.invoke\("sendSMS"/);
  assert.match(panel, /phone: leadPhone/);
  assert.match(panel, /leadId/);
  assert.match(panel, /await loadMessages\(\)/);
  assert.match(panel, /Lead phone number is missing/);
  assert.doesNotMatch(panel, /STEP 5, integrate actual Twilio/);
  assert.doesNotMatch(panel, /base44\.entities\.Messages\.create/);
});

test("Twilio inbound SMS webhook supports proxy-safe signature validation", () => {
  const inboundSms = read("base44/functions/receiveTwilioInboundSms/entry.ts");

  assert.match(inboundSms, /function buildSignatureUrl/);
  assert.match(inboundSms, /x-forwarded-proto/);
  assert.match(inboundSms, /x-forwarded-host/);
  assert.match(inboundSms, /TWILIO_WEBHOOK_KEY/);
  assert.match(inboundSms, /twilio_webhook_key/);
  assert.match(inboundSms, /const url = buildSignatureUrl\(req\)/);
});

test("Twilio SMS status callback accepts canonical proxy signature URLs", () => {
  const statusCallback = read("base44/functions/receiveTwilioSmsStatusCallback/entry.ts");

  assert.match(statusCallback, /function buildSignatureUrls/);
  assert.match(statusCallback, /clientsurgesystems\.com/);
  assert.match(statusCallback, /www\.clientsurgesystems\.com/);
  assert.match(statusCallback, /client-surge-systems-copy-a9653cae\.base44\.app/);
  assert.match(statusCallback, /signatureUrls\.some/);
});

test("portal billing helper buttons use deployed Base44 Stripe functions", () => {
  const cancelButton = read("src/components/portal/CancelSubscriptionButton.jsx");
  const invoiceButton = read("src/components/portal/DownloadInvoiceButton.jsx");
  const invoicePdf = read("src/components/portal/DownloadInvoicePDF.jsx");

  assert.match(cancelButton, /base44\.functions\.invoke\("getStripeCustomerPortalUrl"/);
  assert.match(cancelButton, /confirmOpen/);
  assert.doesNotMatch(cancelButton, /getStripePortalUrl/);
  assert.doesNotMatch(cancelButton, /\bconfirm\(/);

  for (const source of [invoiceButton, invoicePdf]) {
    assert.match(source, /base44\.functions\.invoke\("getStripeBillingData"/);
    assert.doesNotMatch(source, /getStripeInvoice/);
    assert.doesNotMatch(source, /getStripeInvoices/);
  }
});

test("stripe and email preview portal links use APP_URL or canonical apex host", () => {
  const paymentUpdate = read("base44/functions/getStripePaymentUpdateUrl/entry.ts");
  const previewModal = read("src/components/admin/EmailTemplatePreviewModal.jsx");

  assert.match(paymentUpdate, /APP_URL/);
  assert.match(paymentUpdate, /https:\/\/clientsurgesystems\.com/);
  assert.match(paymentUpdate, /return_url: `\$\{APP_URL\}\/client-portal`/);
  assert.doesNotMatch(paymentUpdate, /https:\/\/www\.clientsurgesystems\.com\/client-portal/);
  assert.match(previewModal, /https:\/\/clientsurgesystems\.com\/client-portal\?order_id=sample/);
  assert.doesNotMatch(previewModal, /https:\/\/www\.clientsurgesystems\.com\/client-portal/);
});

test("admin QA invite flow shows invite sent feedback", () => {
  const qaPanel = read("src/components/admin/QaCustomerPanel.jsx");

  assert.match(qaPanel, /nextResult\?\.invite_sent/);
  assert.match(qaPanel, /Invite sent to \$\{form\.email\}\./);
  assert.match(qaPanel, /copyNotice/);
});

test("source img tags declare intrinsic dimensions", () => {
  const missing = [];

  for (const root of ["src/components", "src/internal-pages", "src/pages"]) {
    for (const file of walkSourceFiles(root)) {
      const source = read(file);
      for (const { index, tag } of extractImgTags(source)) {
        if (!/\bsrc\s*=/.test(tag)) continue;
        if (!/\bwidth\s*=/.test(tag) || !/\bheight\s*=/.test(tag)) {
          const line = source.slice(0, index).split(/\r?\n/).length;
          missing.push(`${file}:${line}`);
        }
      }
    }
  }

  assert.deepEqual(missing, []);
});

test("homepage accessibility audit fixes keep visible labels and muted SMS text compliant", () => {
  const chatBubble = read("src/components/landing/ChatBubble.jsx");
  const smsDemo = read("src/components/landing/HeroSMSDemo.jsx");

  assert.match(chatBubble, /aria-label="Chat with me"/);
  assert.match(chatBubble, /Chat with me/);
  assert.doesNotMatch(smsDemo, /#8e8e93/);
  assert.match(smsDemo, /#636366/);
});

test("domain tracker docs do not retain stale pending or in-progress rows", () => {
  const stale = [];

  for (const file of walkSourceFiles("src")) {
    if (!/DOMAIN_.*\.md$/.test(file)) continue;
    const source = read(file);
    source.split(/\r?\n/).forEach((line, index) => {
      if (/^\|[^|]+\|\s*(⏳|🔄)/u.test(line)) {
        stale.push(`${file}:${index + 1}`);
      }
    });
  }

  assert.deepEqual(stale, []);
});
