import test from "node:test";
import { assertIndustryCampaignReady } from "./industryLandingAuditUtils.js";

test("roofing campaign page is locally campaign-ready", () => {
  assertIndustryCampaignReady({
    slug: "roofing",
    route: "/roofing",
    title: "Roofing Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    description: "AI automation for roofing companies: storm-season lead surges, missed-call recovery, inspection booking, estimate follow-up, insurance and storm-damage inquiry routing, and old estimate reactivation.",
    cta: "Free Roofing Automation Audit",
    crmTag: "roofing_lead",
    serviceInterest: "roofing_automation_audit",
    auditTag: "free_roofing_automation_audit",
    painPoints: ["storm", "roof repair", "quote requests", "inspection", "homeowner"],
    emailPhrases: ["roofing automation audit", "storm", "quote requests"],
  });
});
