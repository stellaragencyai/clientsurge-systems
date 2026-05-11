import { base44 } from "@/api/base44Client";

// Legacy compatibility layer for modules that still expect generated entity exports.
// This maps old import names onto the current Base44 entity client so build/runtime
// do not depend on a missing "@/api/entities" module. `SpaLead` remains a temporary
// alias to `Leads` and should not be treated as a canonical entity name.
export const AutomationJob = base44.entities.AutomationJob;
export const ClientOnboarding = base44.entities.OnboardingClient;
export const DemoRequest = base44.entities.DemoRequest;
export const SpaLead = base44.entities.Leads;
export const SupportMessage = base44.entities.SupportMessage;
export const WebsiteLead = base44.entities.WebsiteLead;

export default {
  AutomationJob,
  ClientOnboarding,
  DemoRequest,
  SpaLead,
  SupportMessage,
  WebsiteLead,
};
