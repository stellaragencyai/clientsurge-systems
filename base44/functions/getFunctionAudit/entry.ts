/**
 * Internal Admin-Only Function & Automation Audit
 * 
 * Classifies all functions, confirms event-triggered SMS/email capability,
 * surfaces communication health, and identifies stale/broken/duplicate flows.
 * 
 * Called from the admin-only FunctionAudit page.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
// Using inline helper to avoid shared import chain issues
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Classification helpers ──

const TEST_ONLY_PATTERNS = /test|smoke|proof|simulate|backfill/i;
const QA_PROOF_PATTERNS = /qa|proof|runtime|smoke|backfill|sniper/i;

const FUNCTION_CLASSIFICATIONS = {
  // ── Core (keep) ──
  core: [
    "handleNewLead", "onLeadCreated", "sendInstantLeadResponseSms",
    "sendLeadConfirmationEmail", "sendAdminLeadNotification",
    "receiveTwilioInboundSms", "receiveTwilioMissedCallWebhook",
    "receiveTwilioSmsStatusCallback", "receiveResendInbound", "receiveResendWebhook",
    "sendSMS", "sendEmail", "sendBookingEmail", "sendBookingLinkSMS",
    "scheduleDemoBooking", "createDemoCalendarEvent", "demoBookingGuard",
    "createCheckoutSession", "stripePaymentWebhook", "stripeWebhookOrders",
    "stripeInvoiceWebhook", "stripeInvoiceHandlers",
    "createLeadAndDispatch", "submitLeadCapture", "submitContactInquiry",
    "submitClientOnboarding", "secureFormSubmission",
    "webhookLeadCapture", "webhookValidation",
    "leadPipelineOrchestrator", "automationOrchestrator",
    "installOrchestrator", "installPipeline", "postPaymentOrchestrator",
    "orchestrateOrderToOnboarding", "orchestrateClientOnboarding",
    "initializeClientOnboarding", "initializeInstallOS",
    "configureService", "activateAllServices",
    "stripeActivationGuarantee", "stripeStateReconciliation",
    "stripeOrphanReconciler", "recoverStripeOrders",
    "reconcileSubscriptions",
    "getClientPortalContext", "getClientPortalLeads",
    "getAdminAnalytics", "getAdminPreviewData", "getAdminSettings",
    "updateAdminSettings", "updateMetricsSnapshot",
    "systemHealthOrchestrator", "getSystemHealthDashboard",
    "getIntegrationHealth", "runIntegrationHealthCheck",
    "proactiveHealthMonitoring", "selfHealingMonitor",
    "processEventQueue", "messagingProcessor", "billingProcessor",
    "automationProcessor", "onboarding_processor",
    "eventDeduplicator", "eventCollapser", "eventPipelineValidator",
    "computeEventPipelineMetrics", "computeConversionFunnel",
    "computeBusinessInsights", "computeAgencyMetrics",
    "executeConversionOptimization", "computeRevenueAttribution",
    "classifyLeadIntent", "classifyLeadReply", "analyzeReplySentiment",
    "calculateLeadScore", "scoreLeads", "scoreLeadIntelligence",
    "enrichLead", "enrichLeadWithAI", "deduplicateLeads",
    "routeLead", "routeLeadToIndustryAgent",
    "applyAutomationRules", "executeSegmentedLeadFlow",
    "processAutomationJobs", "processDripCampaigns",
    "processNurtureCampaigns", "processMissedCallFollowUps",
    "processQualifiedFollowUps", "processWebsiteLeadFollowUps",
    "processDynamicFollowUps", "processVoiceCallFollowUps",
    "sendFollowUpEmail", "scheduleFollowUp", "scheduleFollowUpEmails",
    "scheduleFollowUpSMS", "stampFollowUpAt",
    "triggerFollowUpSequence", "resetFollowUpOnStatusChange",
    "startDripCampaign", "startNurtureCampaign", "enrollEmailDripCampaign",
    "enrollMissedCallDrip",
    "receiveElevenLabsPostCallWebhook", "receiveInboundVoiceCall",
    "triggerVoiceCallToLead", "createElevenLabsAgent",
    "initiateVoiceCloneIntake", "sendVoiceBriefing",
    "notifyOnboardingComplete", "sendOnboardingEmailSequence",
    "seedOnboardingEmailSequences",
    "onChecklistStatusChange", "updateAdminOnboardingChecklistStep",
    "updateInstallConfiguration", "updateInstallStatus",
    "saveClientCredentials", "credentialsCompletionCheck",
    "manageClientLifecycle", "initializeBusinessConfig",
    "generateAIReply", "generateIndustryFirstSMS", "generateMessage",
    "generateSmartResponse", "generateSmartSubjectLine",
    "aiMessageWriter", "aiOnboardingIntelligence",
    "aiPackageOrchestrator", "aiQualifyLead",
    "aiGenerateBusinessConfig", "aiBrainInstaller",
    "aiVoiceReceptionistProvisioning", "aiOutboundReactivation",
    "chatBubbleAI",
    "getActivationProgress", "getAutomationStatus",
    "getBillingSummary", "getStripeBillingData",
    "getStripeCustomerPortalUrl", "getStripeMode",
    "getStripePaymentUpdateUrl", "cancelSubscription",
    "pauseSubscription", "resumeSubscription",
    "requestSubscriptionChange", "createInvoicePaymentLink",
    "getBookedDemoSlots", "getClientAnalytics",
    "getClientFollowUpLog", "getClientInvoices",
    "getClientLeadFlowMetrics", "getClientLifecycleDashboard",
    "getClientPortalProjectActivity", "getClientTaskJobs",
    "getDemoClientAccess", "getInstallConfiguration",
    "getLandingPageAnalytics", "getLeadPipelineSummary",
    "getNormalizedEventView", "getOpenClawInstallAssist",
    "getOrderStatus", "getRevenueAnalytics",
    "getSalesAutomationMetrics", "getScaleMetrics",
    "getSystemHealthAlerts", "getSystemVisibility",
    "getWorkflowOrchestrationStatus", "getAgencyDashboard",
    "getAgentForLead", "getAgentPerformanceMetrics",
    "importLeads", "exportLeadsCSV", "exportCommunicationLogs",
    "bulkLeadAction", "syncLeadToCRM",
    "updatePortalTimeline", "updateLeadStatus",
    "sendClientWelcomeEmail", "sendDeploymentConfirmationEmail",
    "sendGoLiveNotification", "sendMilestoneEmail",
    "sendMonthlyClientReportEmail", "sendOrderConfirmationEmail",
    "sendPortalWelcomeEmail", "sendReviewRequest",
    "sendWentLiveEmail", "sendWeeklyDigest", "sendDailyDigest",
    "sendAppointmentBookedEmail", "sendDemoConfirmationEmail",
    "sendDemoConfirmationSMS", "sendDemoPrepEmail",
    "triggerAutoReviewRequest", "runReviewRequestTest",
    "sendAdminDemoNotification", "sendAdminPurchaseNotification",
    "sendContactEmail", "sendNPSSurvey",
    "alertTrigger", "missionControlFollowUp", "missionControlLeadClosing",
    "autoProvisionTwilioNumber", "autoResolveInstallError",
    "autoScalingLaunchReadinessGate", "autoTriggerLeadPulse",
    "automatedBillingRecovery", "automatedCredentialIngestion",
    "automatedReviewLoop", "automatedWeeklyPerformanceDigest",
    "selfHealingProvisioning", "stalledCredentialsAlert",
    "stalledOnboardingAlert", "missingCredentialsAlert",
    "pipelineIntegrityCheck", "runLaunchReadinessCheck",
    "runLaunchHardeningAudit", "runOrphanedOrderAudit",
    "contactFrequencyLimiter", "conversationIntelligence",
    "conversationThreading", "dailyDigestGate",
    "decideNextAction", "detectAnalyticsAnomalies",
    "validateAIOutputs", "validateLeadQuality",
    "migrateCrmStages", "crmWonBridge",
    "updateAgencyBranding", "createAgencyClient",
    "saveClientNotificationPreferences", "saveQuickStartConfig",
    "generateSitemap", "manageWebhookRegistration",
    "dispatchLeadWebhook", "verifyRealOrder",
    "healthCheck", "pruneIdempotencyKeys",
    "autoArchiveOldLeads", "autoCloseStaleLeads",
    "autoSchedule30DayCheckin", "autoSendWebhookInstructions",
    "pushTasksToGitHub", "listGitHubIssues",
    "twilioVerify", "classifyInstallError", "classifyPurchasedPackage",
    "generateWebsiteCopy", "generateWebsiteSpec", "applyWebsiteSpec",
    "approveWebsiteCopy", "generateClientWebsite",
    "generatePackageComparisonEmail", "generateLeadMagnet",
    "generateMonthlyPerformanceReport", "generateWeeklyReport",
    "generateSmsTemplates", "generateServiceTemplates",
    "generateSocialContent", "seedEmailTemplates", "seedIndustryTemplates",
    "processCallRecording", "scheduleDemoBooking",
    "notifyOnboardingComplete",
    "fixAutomationAlert", "getAutomationAlerts",
    "retryFailedEvent", "retryFailedServiceActivation",
    "retriggerTaskJob", "testProviderConnections",
    "bookingConfirmationLoop", "handleBookingTrigger",
    "saveClientCredentials", "autoEndToEndTest",
    "attachAdminOnboardingOrder", "assignInstallToAdmin",
    "addStripeCustomerIdToProject", "classifyLeadIntentWiring",
    "installOrchestrator", "intentVerificationGateway",
    "orchestrationController", "workflowOrchestrator",
    "workflowStageManager", "hardenedEventPipeline",
    "executeOutboundSequence", "executeSegmentedLeadFlow",
    "convertOutboundLead", "trackOutboundReply",
    "discoverLeads", "runSniperSearch",
    "reactivateLeadOutreach", "runWinBackSequence",
    "generateSocialContent", "generateAIReply",
    "industryAwareReply", "testInboundSmsReply",
    "testMissedCallResponse", "testWebsiteLeadAutomation",
    "trackContactFormCompletion", "trackEmailEngagementEvent",
    "trackEmailEvent", "sendTestLead",
    "onOnboardingStageChange", "onboardingStepTelegramAlert",
    "clientOffboardingAI", "clientPortalProjectFiles",
    "clientPortalSupportMessages", "client_provisioning",
    "computeABTestAnalytics", "predictChurnRisk",
    "runAIBrainInstallerBackfill", "runBookingAgentTest",
    "runFullPipelineTest", "runLeadReactivationTest",
    "runNurtureSequenceTest", "simulateMissedCall",
    "monthlyClientReport", "sendSmartEmail",
  ],

  // ── Test-only / Internal (keep but label) ──
  testOnly: [
    "runBookingAgentTest", "runFullPipelineTest", "runLeadReactivationTest",
    "runNurtureSequenceTest", "runReviewRequestTest", "runSniperSearch",
    "runAIBrainInstallerBackfill", "runLaunchHardeningAudit",
    "simulateMissedCall", "sendTestLead", "testInboundSmsReply",
    "testInstantLeadResponse", "testMissedCallResponse",
    "testProviderConnections", "testWebsiteLeadAutomation",
    "autoEndToEndTest", "sendVoiceBriefing",
  ],

  // ── Duplicate / Stale (candidate for removal after verification) ──
  duplicateStale: [
    // Legacy wrappers that may be superseded
    "stripeInvoiceHandlers", // likely handled by stripeInvoiceWebhook
    "webhookValidation",    // superseded by webhookValidationV2 + webhookHandlerCore
    "sendSmartEmail",       // likely superseded by sendEmail
    "sendFollowUpEmail",    // likely superseded by process*FollowUps + sendEmail
    "scheduleFollowUpEmails", // superseded by scheduleFollowUp
    "triggerFollowUpSequence", // superseded by processDynamicFollowUps
    "generateSmartSubjectLine", // superseded by generateSmartResponse
    "aiOutboundReactivation", // superseded by reactivateLeadOutreach + runWinBackSequence
    "aiVoiceReceptionistProvisioning", // likely superseded by createElevenLabsAgent
    "automatedCredentialIngestion", // likely superseded by saveClientCredentials
    "dispatchLeadWebhook", // may be unused
    "runOrphanedOrderAudit", // replaced by stripeOrphanReconciler
    "dailyDigestGate", // may be unused
    "handleBookingTrigger", // likely folded into bookingConfirmationLoop
    "onChecklistStatusChange", // likely replaced by updateAdminOnboardingChecklistStep
    "sendAdminDemoNotification", // likely unused
    "sendAdminPurchaseNotification", // likely unused
    "autoSendWebhookInstructions", // likely unused
    "autoArchiveOldLeads", // likely unused
    "autoCloseStaleLeads", // likely unused
    "generateLeadMagnet", // likely unused
    "generatePackageComparisonEmail", // likely unused
    "generateServiceTemplates", // likely redundant with seedIndustryTemplates
    "classifyLeadIntentWiring", // likely superseded by classifyLeadIntent
    "classifyPurchasedPackage", // likely unused
    "crmWonBridge", // likely unused
    "decideNextAction", // likely unused
    "detectAnalyticsAnomalies", // likely unused
    "monthlyClientReport", // likely superseded by sendMonthlyClientReportEmail
    "pushTasksToGitHub", // likely unused
    "listGitHubIssues", // likely unused
    "validateAIOutputs", // likely unused
    "validateLeadQuality", // likely unused
    "migrateCrmStages", // migration tool — likely one-time, now stale
    "manageWebhookRegistration", // likely unused
    "processCallRecording", // likely unused
    "retryFailedServiceActivation", // likely superseded by selfHealingMonitor
    "retriggerTaskJob", // likely unused
    "bookingConfirmationLoop", // likely superseded by sendAppointmentBookedEmail
    "sendSmartEmail", // duplicate
    "fixAutomationAlert", // likely unused
    "intentVerificationGateway", // likely unused
    "hardenedEventPipeline", // superseded by eventDeduplicator + eventPipelineValidator
    "convertOutboundLead", // likely unused
    "discoverLeads", // likely unused
    "reactivateLeadOutreach", // likely superseded by runWinBackSequence
    "industryAwareReply", // likely superseded by generateIndustryFirstSMS
    "onboardingStepTelegramAlert", // likely unused
    "clientOffboardingAI", // likely unused
    "computeABTestAnalytics", // likely unused
  ],

  // ── Broken / Needs Repair ──
  broken: [
    "receiveResendInbound", // failing 5x consecutively in automation
    "processWebsiteLeadFollowUps", // failing 5x consecutively
    "processVoiceCallFollowUps", // failing 5x consecutively
    "sendVoiceBriefing", // failing 5x consecutively (voice briefing disabled)
    "runSniperSearch", // failing 5x consecutively
    "runIntegrationHealthCheck", // failing 5x consecutively
    "onLeadCreated", // failing 5x consecutively
    "sendOnboardingEmailSequence", // failing in automation
    "installOrchestrator", // failing in automation
  ],
};

// ── Service name mapping ──
const SERVICE_NAME_MAP = {
  "followup_sequences": "14-Day Nurture Sequence",
  "follow_up_sequences": "14-Day Nurture Sequence",
  "appointment_booking": "AI Booking Agent",
  "ai_booking": "AI Booking Agent",
  "missed_call_textback": "Missed Call Text-Back",
  "missed_call": "Missed Call Text-Back",
  "instant_lead_response": "Instant Lead Response",
  "missed_call_text_back": "Missed Call Text-Back",
  "nurture_sequence_14d": "14-Day Nurture Sequence",
  "ai_booking_agent": "AI Booking Agent",
  "lead_reactivation": "Lead Reactivation",
  "review_request": "Review Request Automation",
};

function canonicalServiceName(key) {
  return SERVICE_NAME_MAP[key] || key;
}

// ── Main handler ──
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── 1. Admin Settings communication health ──
    let adminSettings = null;
    try {
      const settings = await base44.asServiceRole.entities.AdminSettings.list(null, 1);
      adminSettings = settings?.[0] || null;
    } catch (e) {
      console.error('[FunctionAudit] AdminSettings fetch failed:', e.message);
    }

    const comHealth = {
      twilio_enabled: adminSettings?.twilio_enabled || false,
      resend_enabled: adminSettings?.resend_enabled || false,
      twilio_from_number: adminSettings?.twilio_from_number ? '***configured***' : 'not configured',
      resend_from_email: adminSettings?.resend_from_email ? '***configured***' : 'not configured',
      has_twilio_creds: !!(Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN')),
      has_resend_creds: !!Deno.env.get('RESEND_API_KEY'),
      voice_calls_enabled: adminSettings?.voice_calls_enabled || false,
      gmail_enabled: adminSettings?.gmail_enabled || false,
    };

    // ── 2. Recent communication events ──
    let lastSmsSuccess = null, lastSmsFailed = null;
    let lastEmailSuccess = null, lastEmailFailed = null;
    let failed30dCount = 0;

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [smsSuccess, smsFailed, emailSuccess, emailFailed, failedEvents] = await Promise.all([
        base44.asServiceRole.entities.CommunicationEvent.filter(
          { channel: 'sms', status: 'sent' }, '-created_date', 1
        ).catch(() => []),
        base44.asServiceRole.entities.CommunicationEvent.filter(
          { channel: 'sms', status: 'failed' }, '-created_date', 1
        ).catch(() => []),
        base44.asServiceRole.entities.CommunicationEvent.filter(
          { channel: 'email', status: 'sent' }, '-created_date', 1
        ).catch(() => []),
        base44.asServiceRole.entities.CommunicationEvent.filter(
          { channel: 'email', status: 'failed' }, '-created_date', 1
        ).catch(() => []),
        base44.asServiceRole.entities.CommunicationEvent.filter(
          { status: 'failed' }, '-created_date', 500
        ).catch(() => []),
      ]);

      lastSmsSuccess = smsSuccess?.[0]?.created_date || null;
      lastSmsFailed = smsFailed?.[0]?.created_date || null;
      lastEmailSuccess = emailSuccess?.[0]?.created_date || null;
      lastEmailFailed = emailFailed?.[0]?.created_date || null;
      failed30dCount = (failedEvents || []).filter(
        e => new Date(e.created_date) >= new Date(thirtyDaysAgo)
      ).length;
    } catch (e) {
      console.error('[FunctionAudit] ComEvent fetch failed:', e.message);
    }

    // ── 3. Determine messaging readiness ──
    let messagingStatus = 'blocked';
    if (comHealth.twilio_enabled && comHealth.resend_enabled && comHealth.has_twilio_creds && comHealth.has_resend_creds) {
      messagingStatus = 'ready';
      if (lastSmsFailed || lastEmailFailed) {
        messagingStatus = 'degraded';
      }
    } else if (comHealth.twilio_enabled || comHealth.resend_enabled) {
      messagingStatus = 'degraded';
    }

    // ── 4. Classify all functions ──
    const coreSet = new Set(FUNCTION_CLASSIFICATIONS.core);
    const testSet = new Set(FUNCTION_CLASSIFICATIONS.testOnly);
    const staleSet = new Set(FUNCTION_CLASSIFICATIONS.duplicateStale);
    const brokenSet = new Set(FUNCTION_CLASSIFICATIONS.broken);

    const classifications = {};
    const classifiedCount = { core: 0, testOnly: 0, duplicateStale: 0, broken: 0, unclassified: 0 };

    // We can't enumerate functions programmatically, so we classify from our known lists
    for (const fn of FUNCTION_CLASSIFICATIONS.core) {
      if (brokenSet.has(fn)) {
        classifications[fn] = 'broken';
        classifiedCount.broken++;
      } else {
        classifications[fn] = 'core';
        classifiedCount.core++;
      }
    }
    for (const fn of FUNCTION_CLASSIFICATIONS.testOnly) {
      if (!classifications[fn]) {
        classifications[fn] = 'testOnly';
        classifiedCount.testOnly++;
      }
    }
    for (const fn of FUNCTION_CLASSIFICATIONS.duplicateStale) {
      if (!classifications[fn]) {
        classifications[fn] = 'duplicateStale';
        classifiedCount.duplicateStale++;
      }
    }
    for (const fn of FUNCTION_CLASSIFICATIONS.broken) {
      if (!classifications[fn]) {
        classifications[fn] = 'broken';
        classifiedCount.broken++;
      }
    }

    // ── 5. Entity observability status ──
    const entityStatus = {};
    const observabilityEntities = ['EventQueue', 'DeadLetterLog', 'EventPipelineMetrics'];
    for (const entityName of observabilityEntities) {
      try {
        const records = await base44.asServiceRole.entities[entityName].list(null, 1).catch(() => []);
        entityStatus[entityName] = {
          exists: true,
          hasRecords: records && records.length > 0,
          recordCount: records?.length || 0,
          status: (records && records.length > 0) ? 'in_use' : 'empty_not_fully_wired',
        };
      } catch (e) {
        entityStatus[entityName] = { exists: true, error: e.message, status: 'error_checking' };
      }
    }

    // ── 6. Stale automation check ──
    const staleAutomationPatterns = [
      { name: 'Seed Default Onboarding Email Sequences', reason: 'One-time seed job — archived, OK to leave archived' },
      { name: 'Dead Letter Queue Monitoring', reason: 'Calls sendEmail which needs auth context — likely broken, disabled' },
      { name: 'Process Resend Inbound Replies', reason: 'Failed 5x — may need Resend webhook config review' },
      { name: 'Website Lead Follow-Up Processor', reason: 'Failed 5x — may be superseded by processDynamicFollowUps' },
      { name: 'Voice Call Follow-Up Processor', reason: 'Failed 5x — voice calls disabled, function may fail on no config' },
      { name: 'Daily Voice Briefing', reason: 'Failed 5x — voice briefing disabled in settings' },
      { name: 'Daily Sniper Hunt', reason: 'Failed 5x — may need API key or prompt config' },
      { name: 'Hourly Integration Health Check', reason: 'Failed 5x — may need API key refresh or provider config' },
    ];

    // ── 7. Failed flow categories needing provider verification ──
    const failedFlowCategories = [];
    try {
      const failedEvents = await base44.asServiceRole.entities.CommunicationEvent.filter(
        { status: 'failed' }, '-created_date', 100
      ).catch(() => []);

      const categories = {};
      for (const event of (failedEvents || [])) {
        const cat = event.event_type || 'unknown';
        categories[cat] = (categories[cat] || 0) + 1;
      }
      for (const [cat, count] of Object.entries(categories)) {
        failedFlowCategories.push({ event_type: cat, failure_count: count });
      }
    } catch (e) {
      console.error('[FunctionAudit] Failed events fetch:', e.message);
    }

    // ── 8. Remaining risks ──
    const remainingRisks = [
      {
        category: 'Provider configuration',
        items: [
          'RESEND_FROM_EMAIL / RESEND_FROM_LEADS env vars may need verification',
          'TWILIO_SMS_STATUS_CALLBACK_URL may need to be set',
          'ElevenLabs agent IDs and phone number IDs need per-industry configuration',
        ],
      },
      {
        category: 'Stale automations',
        items: staleAutomationPatterns.filter(a => !a.name.includes('archived')).map(a => a.reason),
      },
      {
        category: 'Duplicate functions',
        items: [
          'Multiple sendEmail wrappers exist (sendEmail, sendSmartEmail, sendFollowUpEmail) — consolidate',
          'Multiple Stripe webhook handlers (stripePaymentWebhook, stripeWebhookOrders, stripeInvoiceWebhook, stripeInvoiceHandlers) — verify routing',
          'Multiple follow-up processors (processWebsiteLeadFollowUps, processMissedCallFollowUps, processQualifiedFollowUps, processVoiceCallFollowUps, processDynamicFollowUps) — may overlap',
        ],
      },
      {
        category: 'Observability gaps',
        items: [
          'EventQueue: exists but may not be fully wired across all processors',
          'DeadLetterLog: exists but may only be used by eventQueueDispatcher',
          'EventPipelineMetrics: computed hourly but may not be consumed by any dashboard',
        ],
      },
      {
        category: 'Safety concerns before activating live outreach',
        items: [
          'Verify consent/opt-out handling in all SMS/email dispatch paths',
          'Confirm do_not_contact / email_unsubscribed / email_bounced flags are respected',
          'Ensure rate limiting is enforced via RateLimitConfig before mass sends',
          'Verify that all CommunicationEvent writes include provider_message_id for traceability',
        ],
      },
    ];

    return json({
      generated_at: new Date().toISOString(),
      communication_health: {
        ...comHealth,
        last_sms_success: lastSmsSuccess,
        last_sms_failed: lastSmsFailed,
        last_email_success: lastEmailSuccess,
        last_email_failed: lastEmailFailed,
        failed_communication_count_30d: failed30dCount,
        event_triggered_messaging_status: messagingStatus,
        event_triggered_sms_confirmed: comHealth.twilio_enabled && comHealth.has_twilio_creds,
        event_triggered_email_confirmed: comHealth.resend_enabled && comHealth.has_resend_creds,
      },
      function_classifications: classifications,
      classification_counts: classifiedCount,
      entity_observability: entityStatus,
      stale_automation_notes: staleAutomationPatterns,
      failed_flow_categories: failedFlowCategories,
      service_name_mappings: SERVICE_NAME_MAP,
      remaining_risks: remainingRisks,
      summary: {
        total_classified: Object.keys(classifications).length,
        core_keep: classifiedCount.core,
        test_only: classifiedCount.testOnly,
        duplicate_stale_candidates: classifiedCount.duplicateStale,
        broken_needs_repair: classifiedCount.broken,
        event_triggered_messaging: messagingStatus,
      },
    });
  } catch (error) {
    console.error('[FunctionAudit] Error:', error.message);
    return json({ error: error.message }, { status: 500 });
  }
});