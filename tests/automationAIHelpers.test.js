import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOptimalSendTimePatch,
  predictOptimalSendHour,
} from "../base44/functions/_shared/optimalSendTime.js";
import {
  applySmsTemplateWinner,
  ensureSmsTemplateVariants,
  evaluateSmsTemplateVariants,
} from "../base44/functions/_shared/smsTemplateOptimizer.js";
import {
  buildSocialStarterPdfBase64,
  normalizeSocialStarterCaptions,
} from "../base44/functions/_shared/socialStarterPack.js";
import {
  inferAffectedWebsiteSections,
  mergeFinalizedWebsiteSections,
} from "../base44/functions/_shared/websiteCopyFinalizer.js";

test("predictOptimalSendHour chooses the strongest inbound reply hour", () => {
  const events = [
    { direction: "inbound", created_date: "2026-05-21T15:10:00.000Z" },
    { direction: "inbound", created_date: "2026-05-21T15:30:00.000Z" },
    { direction: "inbound", created_date: "2026-05-21T18:10:00.000Z" },
    { direction: "outbound", event_type: "sms_sent", created_date: "2026-05-21T09:10:00.000Z" },
  ];

  const prediction = predictOptimalSendHour(events, { minSamples: 3 });
  assert.equal(prediction.optimal_send_hour, 15);
  assert.equal(prediction.confidence, "medium");
  assert.equal(prediction.sample_count, 3);

  const patch = buildOptimalSendTimePatch(prediction, new Date("2026-05-21T20:00:00.000Z"));
  assert.equal(patch.optimal_send_hour, 15);
  assert.equal(patch.optimal_send_hour_updated_at, "2026-05-21T20:00:00.000Z");
});

test("SMS optimizer creates two variants and picks winner after threshold", () => {
  const variants = ensureSmsTemplateVariants({ sms_template: "Hi {name}, book here: {booking_link}" });
  assert.equal(variants.length, 2);

  const events = [];
  for (let index = 0; index < 50; index += 1) {
    events.push({
      direction: "outbound",
      event_type: "sms_sent",
      metadata_json: JSON.stringify({ sms_template_variant: "variant_1" }),
    });
    events.push({
      direction: "outbound",
      event_type: "sms_sent",
      metadata_json: JSON.stringify({ sms_template_variant: "variant_2" }),
    });
  }
  for (let index = 0; index < 5; index += 1) {
    events.push({ direction: "inbound", event_type: "sms_received", metadata_json: JSON.stringify({ sms_template_variant: "variant_1" }) });
  }
  for (let index = 0; index < 12; index += 1) {
    events.push({ direction: "inbound", event_type: "sms_received", metadata_json: JSON.stringify({ sms_template_variant: "variant_2" }) });
  }

  const evaluation = evaluateSmsTemplateVariants(events, variants, { threshold: 50 });
  assert.equal(evaluation.ready, true);
  assert.equal(evaluation.winner.variant_id, "variant_2");

  const updated = applySmsTemplateWinner({ services: { instant_lead_response: {} } }, "instant_lead_response", variants, evaluation.winner);
  assert.equal(updated.services.instant_lead_response.active_sms_template_variant, "variant_2");
  assert.match(updated.services.instant_lead_response.sms_template, /Reply here/);
});

test("social starter pack normalizes ten captions and renders a PDF payload", () => {
  const captions = normalizeSocialStarterCaptions([{ category: "lead_gen", hook: "Fast replies", body: "Respond before leads cool off." }]);
  assert.equal(captions.length, 10);
  assert.equal(captions.filter((caption) => caption.category === "lead_gen").length, 5);
  assert.equal(captions.filter((caption) => caption.category === "social_proof").length, 5);

  const pdfBase64 = buildSocialStarterPdfBase64({ title: "Starter Pack", captions });
  assert.equal(Buffer.from(pdfBase64, "base64").toString("utf8").startsWith("%PDF-1.4"), true);
});

test("website copy finalizer targets and merges only affected sections", () => {
  const pages = [{
    name: "Home",
    sections: [
      { type: "hero", copy_blocks: { headline: "Old" }, cta: "Book" },
      { type: "services_grid", copy_blocks: { headline: "Services" } },
    ],
  }];

  assert.deepEqual(inferAffectedWebsiteSections(pages, "Please change the hero headline"), ["hero"]);

  const merged = mergeFinalizedWebsiteSections(pages, [{
    type: "hero",
    copy_blocks: { headline: "New" },
    cta: "Start",
  }]);
  assert.equal(merged[0].sections[0].copy_blocks.headline, "New");
  assert.equal(merged[0].sections[0].cta, "Start");
  assert.equal(merged[0].sections[1].copy_blocks.headline, "Services");
});
