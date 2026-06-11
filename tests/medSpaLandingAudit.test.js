import test from "node:test";
import { assertIndustryCampaignReady } from "./industryLandingAuditUtils.js";

test("med spa campaign page is locally campaign-ready", () => {
  assertIndustryCampaignReady({
    slug: "med-spa",
    route: "/med-spa",
    title: "Med Spa Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    description: "AI automation for med spas: consultation requests, aesthetic treatment inquiries, missed DMs and calls, booking handoff, lead nurture, and old inquiry reactivation.",
    cta: "Free Med Spa Automation Audit",
    crmTag: "med_spa_lead",
    serviceInterest: "med_spa_automation_audit",
    auditTag: "free_med_spa_automation_audit",
    painPoints: ["consultation", "aesthetic treatment", "missed DMs", "booking handoff", "nurture"],
    emailPhrases: ["med spa automation audit", "aesthetic", "booking handoff"],
  });
});
