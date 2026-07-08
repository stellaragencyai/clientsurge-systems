import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appendOptOutFooter, checkSMSCompliance, getSmsBlockReason, handleInboundReply } from "../src/utils/smsCompliance.js";

const sendSmsSource = readFileSync(new URL("../base44/functions/sendSMS/entry.ts", import.meta.url), "utf8");
const inboundSmsSource = readFileSync(new URL("../base44/functions/receiveTwilioInboundSms/entry.ts", import.meta.url), "utf8");

test("Area 8 SMS compliance utility blocks all explicit opt-out markers", () => {
  assert.equal(getSmsBlockReason({ do_not_contact: true }), "do_not_contact");
  assert.equal(getSmsBlockReason({ sms_opted_out: true }), "sms_opted_out");
  assert.equal(getSmsBlockReason({ sms_permission: false }), "sms_permission_false");
  assert.equal(getSmsBlockReason({ sms_opt_out_status: "opted_out" }), "sms_opt_out_status:opted_out");
  assert.equal(getSmsBlockReason({ outreach_status: "do_not_contact" }), "outreach_status:do_not_contact");
  assert.equal(getSmsBlockReason({ consent_given: false }), "consent_not_given");
});

test("Area 8 SMS compliance utility allows opt-out footer and appends it once", () => {
  const lead = { phone: "+16025550123", consent_given: true };
  assert.equal(checkSMSCompliance(lead, "Hello", { skip_hours_check: true }).allowed, true);
  assert.equal(appendOptOutFooter("Hello"), "Hello\n\nReply STOP to opt out.");
  assert.equal(appendOptOutFooter("Hello. Reply STOP to opt out."), "Hello. Reply STOP to opt out.");
});

test("Area 8 inbound STOP reply creates a broad opt-out update payload", () => {
  const action = handleInboundReply("STOP", "lead_123");
  assert.equal(action.action, "opt_out");
  assert.equal(action.update.sms_opted_out, true);
  assert.equal(action.update.sms_opt_out_status, "opted_out");
  assert.equal(action.update.sms_permission, false);
  assert.equal(action.update.do_not_contact, true);
  assert.equal(action.update.outreach_status, "do_not_contact");
});

test("Area 8 generic sendSMS enforces expanded opt-out and logs compliance blocks", () => {
  assert.match(sendSmsSource, /function getLeadSmsBlockReason/);
  assert.match(sendSmsSource, /sms_opt_out_status/);
  assert.match(sendSmsSource, /sms_permission/);
  assert.match(sendSmsSource, /do_not_contact/);
  assert.match(sendSmsSource, /logSmsComplianceBlock/);
  assert.match(sendSmsSource, /event_type: 'sms_blocked'/);
  assert.match(sendSmsSource, /provider: 'internal_compliance_guard'/);
  assert.match(sendSmsSource, /safe_to_continue: true/);
});

test("Area 8 generic sendSMS checks persisted inbound opt-out records across phone fields", () => {
  assert.match(sendSmsSource, /getOptOutPhoneFromMessageRecord/);
  assert.match(sendSmsSource, /from_address/);
  assert.match(sendSmsSource, /from_number/);
  assert.match(sendSmsSource, /from_phone/);
  assert.match(sendSmsSource, /lead_phone/);
  assert.match(sendSmsSource, /to_address/);
  assert.match(sendSmsSource, /sms_opt_out_persisted_inbound/);
});

test("Area 8 generic sendSMS stores the actual outbound body with opt-out footer", () => {
  assert.match(sendSmsSource, /const outboundBody = appendSmsOptOut\(message\)/);
  assert.match(sendSmsSource, /Body: outboundBody/);
  assert.match(sendSmsSource, /message_body: outboundBody/);
  assert.match(sendSmsSource, /message_text: outboundBody/);
});

test("Area 8 inbound SMS webhook still validates signature and stops nurture on STOP", () => {
  assert.match(inboundSmsSource, /validateTwilioSignature/);
  assert.match(inboundSmsSource, /X-Twilio-Signature/);
  assert.match(inboundSmsSource, /stop_opt_out/);
  assert.match(inboundSmsSource, /stopNurtureCampaigns/);
  assert.match(inboundSmsSource, /sms_permission: false/);
  assert.match(inboundSmsSource, /automation_enabled: false/);
});
