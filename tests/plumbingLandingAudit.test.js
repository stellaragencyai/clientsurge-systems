import test from "node:test";
import { assertIndustryCampaignReady } from "./industryLandingAuditUtils.js";

test("plumbing campaign page is locally campaign-ready", () => {
  assertIndustryCampaignReady({
    slug: "plumbing",
    route: "/plumbing",
    title: "Plumbing Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    description: "AI automation for plumbing companies: emergency leak calls, drain repair requests, water heater inquiries, missed-call recovery, after-hours lead capture, and dispatch handoff.",
    cta: "Free Plumbing Automation Audit",
    crmTag: "plumbing_lead",
    serviceInterest: "plumbing_automation_audit",
    auditTag: "free_plumbing_automation_audit",
    painPoints: ["emergency leak", "drain repair", "water heater", "urgent", "dispatch"],
    emailPhrases: ["plumbing automation audit", "emergency leak", "dispatch"],
  });
});
