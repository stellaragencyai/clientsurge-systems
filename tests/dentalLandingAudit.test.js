import test from "node:test";
import { assertIndustryCampaignReady } from "./industryLandingAuditUtils.js";

test("dental campaign page is locally campaign-ready", () => {
  assertIndustryCampaignReady({
    slug: "dental",
    route: "/dental",
    title: "Dental Automation Systems in Phoenix & Scottsdale | ClientSurge Systems",
    description: "AI automation for dental practices: new patient booking, emergency dental inquiries, missed appointment recovery, treatment-plan follow-up, and review automation.",
    cta: "Free Dental Automation Audit",
    crmTag: "dental_lead",
    serviceInterest: "dental_automation_audit",
    auditTag: "free_dental_automation_audit",
    painPoints: ["new patient", "appointment", "front desk", "recall", "patient inquiries"],
    emailPhrases: ["dental automation audit", "new-patient", "front-desk"],
  });
});
