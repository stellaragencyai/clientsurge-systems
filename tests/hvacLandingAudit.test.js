import test from "node:test";
import { assertIndustryCampaignReady } from "./industryLandingAuditUtils.js";

test("hvac campaign page is locally campaign-ready", () => {
  assertIndustryCampaignReady({
    slug: "hvac",
    route: "/hvac",
    title: "HVAC Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    description: "AI automation for HVAC companies: emergency call handling, seasonal demand spikes, missed-call recovery, estimate follow-up, service-call reminders, and maintenance plan automation.",
    cta: "Free HVAC Automation Audit",
    crmTag: "hvac_lead",
    serviceInterest: "hvac_automation_audit",
    auditTag: "free_hvac_automation_audit",
    painPoints: ["after-hours", "emergency", "seasonal", "appointment", "maintenance"],
    emailPhrases: ["HVAC automation audit", "emergency", "seasonal"],
  });
});
