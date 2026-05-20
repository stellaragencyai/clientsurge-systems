import test from "node:test";
import assert from "node:assert/strict";

import {
  BASIC_PACKAGE_SERVICE_KEYS,
  GROWTH_PACKAGE_SERVICE_KEYS,
  PRO_PACKAGE_SERVICE_KEYS,
  buildBasicPackageActivationBrief,
  buildBasicPackageInstallConfiguration,
  buildGrowthPackageActivationBrief,
  buildIntakeGapResolution,
  buildPackageActivationBrief,
  buildProPackageActivationBrief,
  detectPackageActivationDefinition,
  scorePackageActivationReadiness,
  validateBasicPackageIntake,
  validateGrowthPackageIntake,
  validateProPackageIntake,
} from "../src/lib/basicPackageActivation.js";
import {
  PACKAGE_CAPABILITY_MATRIX,
  getPackageCapabilities,
  getPackageTierForServiceKeys,
} from "../src/lib/packageCapabilities.js";

test("package capability matrix centralizes tier services, intake, and runtime gates", () => {
  assert.deepEqual(getPackageCapabilities("basic").service_keys, BASIC_PACKAGE_SERVICE_KEYS);
  assert.deepEqual(getPackageCapabilities("growth").service_keys, GROWTH_PACKAGE_SERVICE_KEYS);
  assert.deepEqual(getPackageCapabilities("pro").service_keys, PRO_PACKAGE_SERVICE_KEYS);
  assert.equal(getPackageCapabilities("pro").required_intake_fields.includes("review_link"), true);
  assert.equal(getPackageCapabilities("growth").runtime_gates.includes("booking_confirmation_simulated"), true);
  assert.equal(Object.keys(PACKAGE_CAPABILITY_MATRIX).length, 3);
});

test("package capability matrix classifies selected services by highest matched tier", () => {
  assert.equal(getPackageTierForServiceKeys(BASIC_PACKAGE_SERVICE_KEYS), "basic");
  assert.equal(getPackageTierForServiceKeys(GROWTH_PACKAGE_SERVICE_KEYS), "growth");
  assert.equal(getPackageTierForServiceKeys(PRO_PACKAGE_SERVICE_KEYS), "pro");
  assert.equal(getPackageTierForServiceKeys(["instant_lead_response"]), null);
});

test("basic package service keys match the first two automations", () => {
  assert.deepEqual(BASIC_PACKAGE_SERVICE_KEYS, [
    "instant_lead_response",
    "missed_call_text_back",
  ]);
});

test("intake validates the minimum client fields needed for activation", () => {
  const validation = validateBasicPackageIntake({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox", "Fillers"],
  });

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.missing_fields, []);
});

test("install configuration maps intake into canonical Order.install_configuration shape", () => {
  const config = buildBasicPackageInstallConfiguration({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox", "Fillers"],
  });

  assert.deepEqual(Object.keys(config.services).sort(), [
    "instant_lead_response",
    "missed_call_text_back",
  ]);
  assert.equal(config.shared.twilio_business_phone, "+18778123630");
  assert.equal(config.shared.after_hours_behavior, "send_after_hours_sms");
  assert.equal(config.shared.consent_behavior, "include_opt_out_language");
  assert.match(
    config.services.instant_lead_response.sms_template,
    /Signal Med Spa.*Botox and Fillers.*https:\/\/signal\.example\.com\/book/
  );
  assert.match(
    config.services.missed_call_text_back.sms_template,
    /Sorry we missed your call.*https:\/\/signal\.example\.com\/book/
  );
});

test("activation brief includes validation, install configuration, and go-live gates", () => {
  const brief = buildBasicPackageActivationBrief({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox"],
  });

  assert.equal(brief.validation.valid, true);
  assert.equal(brief.install_configuration.shared.twilio_business_phone, "+18778123630");
  assert.ok(brief.activation_gates.includes("missed_call_text_back_sent"));
  assert.ok(brief.operator_note.includes("Order.install_configuration"));
});

test("missing intake fields are explicit so the AI can ask only for gaps", () => {
  const validation = validateBasicPackageIntake({
    business_name: "Signal Med Spa",
    services: ["Botox"],
  });

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.missing_fields, [
    "business_phone",
    "business_hours",
    "booking_link",
    "brand_voice",
  ]);
});

test("growth package service keys extend the first two automations with nurture and booking", () => {
  assert.deepEqual(GROWTH_PACKAGE_SERVICE_KEYS, [
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
  ]);
});

test("growth intake validates added nurture and booking fields", () => {
  const validation = validateGrowthPackageIntake({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox", "Fillers"],
    lead_sources: ["Website", "Google Business Profile"],
    booking_process: "Calendly link after qualification",
    common_customer_questions: ["How much is Botox?", "Do you have openings this week?"],
  });

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.missing_fields, []);
});

test("growth activation brief generates canonical config for automations 3 and 4", () => {
  const brief = buildGrowthPackageActivationBrief({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox", "Fillers"],
    lead_sources: ["Website"],
    booking_process: "External booking link",
    common_customer_questions: ["Pricing", "Availability"],
  });

  assert.equal(brief.validation.valid, true);
  assert.deepEqual(Object.keys(brief.install_configuration.services).sort(), [
    "ai_booking_agent",
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
  ]);
  assert.equal(brief.install_configuration.services.nurture_sequence_14d.sms_enabled, true);
  assert.equal(brief.install_configuration.services.nurture_sequence_14d.email_enabled, true);
  assert.equal(brief.install_configuration.services.nurture_sequence_14d.steps.length, 3);
  assert.equal(brief.install_configuration.services.ai_booking_agent.booking_link, "https://signal.example.com/book");
  assert.equal(brief.install_configuration.services.ai_booking_agent.booking_mode, "external_link");
  assert.deepEqual(brief.install_configuration.services.ai_booking_agent.intake_fields, [
    "lead_name",
    "lead_email",
    "lead_phone",
    "preferred_time",
    "notes",
  ]);
  assert.ok(brief.activation_gates.includes("booking_confirmation_simulated"));
});

test("growth missing fields are explicit so Sam can continue intake", () => {
  const validation = validateGrowthPackageIntake({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox"],
  });

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.missing_fields, [
    "lead_sources",
    "booking_process",
    "common_customer_questions",
  ]);
});

test("pro package service keys extend the first four automations with reactivation and review", () => {
  assert.deepEqual(PRO_PACKAGE_SERVICE_KEYS, [
    "instant_lead_response",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "ai_booking_agent",
    "lead_reactivation",
    "review_request",
  ]);
});

test("pro intake validates reactivation and review request fields", () => {
  const validation = validateProPackageIntake({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox", "Fillers"],
    lead_sources: ["Website"],
    booking_process: "External booking link",
    common_customer_questions: ["Pricing", "Availability"],
    reactivation_target_segment: "contacted_no_reply",
    review_link: "https://reviews.example.com/signal",
    review_trigger_event: "manual_trigger",
  });

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.missing_fields, []);
});

test("pro activation brief generates canonical config for automations 5 and 6", () => {
  const brief = buildProPackageActivationBrief({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox", "Fillers"],
    lead_sources: ["Website"],
    booking_process: "External booking link",
    common_customer_questions: ["Pricing", "Availability"],
    reactivation_target_segment: "contacted_no_reply",
    review_link: "https://reviews.example.com/signal",
    review_trigger_event: "manual_trigger",
  });

  assert.equal(brief.validation.valid, true);
  assert.deepEqual(Object.keys(brief.install_configuration.services).sort(), [
    "ai_booking_agent",
    "instant_lead_response",
    "lead_reactivation",
    "missed_call_text_back",
    "nurture_sequence_14d",
    "review_request",
  ]);
  assert.equal(brief.install_configuration.services.lead_reactivation.target_segment, "contacted_no_reply");
  assert.equal(brief.install_configuration.services.lead_reactivation.max_batch_size, 25);
  assert.equal(brief.install_configuration.services.review_request.review_link, "https://reviews.example.com/signal");
  assert.equal(brief.install_configuration.services.review_request.channel, "email");
  assert.ok(brief.activation_gates.includes("reactivation_batch_simulated"));
  assert.ok(brief.activation_gates.includes("review_request_simulated"));
});

test("unified package activation engine detects package from purchased service keys", () => {
  assert.equal(
    detectPackageActivationDefinition({ serviceKeys: BASIC_PACKAGE_SERVICE_KEYS }).package_tier,
    "basic"
  );
  assert.equal(
    detectPackageActivationDefinition({ serviceKeys: GROWTH_PACKAGE_SERVICE_KEYS }).package_tier,
    "growth"
  );
  assert.equal(
    detectPackageActivationDefinition({ serviceKeys: PRO_PACKAGE_SERVICE_KEYS }).package_tier,
    "pro"
  );
});

test("unified activation brief returns intake gap question and readiness score", () => {
  const brief = buildPackageActivationBrief({
    serviceKeys: PRO_PACKAGE_SERVICE_KEYS,
    intake: {
      business_name: "Signal Med Spa",
      business_phone: "+18778123630",
      services: ["Botox"],
    },
  });

  assert.equal(brief.package_tier, "pro");
  assert.equal(brief.validation.valid, false);
  assert.equal(brief.intake_gap_resolution.next_missing_field, "business_hours");
  assert.match(brief.intake_gap_resolution.next_question, /business hours/i);
  assert.equal(brief.readiness.label, "Needs intake");
  assert.ok(brief.readiness.score < 50);
});

test("readiness scoring promotes tested live package orders", () => {
  const brief = buildProPackageActivationBrief({
    business_name: "Signal Med Spa",
    business_phone: "+18778123630",
    business_hours: "Mon-Fri 9am-5pm",
    booking_link: "https://signal.example.com/book",
    brand_voice: "warm and polished",
    services: ["Botox", "Fillers"],
    lead_sources: ["Website"],
    booking_process: "External booking link",
    common_customer_questions: ["Pricing", "Availability"],
    reactivation_target_segment: "contacted_no_reply",
    review_link: "https://reviews.example.com/signal",
    review_trigger_event: "manual_trigger",
  });
  const order = {
    install_configuration_updated_at: "2026-05-20T00:00:00.000Z",
    services: PRO_PACKAGE_SERVICE_KEYS.map((service_key) => ({
      service_key,
      install_status: "Live",
      test_summary: { latest_success_at: "2026-05-20T00:00:00.000Z" },
    })),
  };

  const readiness = scorePackageActivationReadiness({ brief, order });
  assert.equal(readiness.score, 100);
  assert.equal(readiness.next_best_action, "Package activation is complete.");
});
