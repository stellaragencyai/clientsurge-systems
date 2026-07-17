import { base44 } from "@/api/base44Client";

// Legacy compatibility layer for modules that still expect generated entity exports.
// This maps old import names onto the current Base44 entity client so build/runtime
// do not depend on a missing "@/api/entities" module. `SpaLead` remains a temporary
// alias to `Leads` and should not be treated as a canonical entity name.
export const AutomationJob = base44.entities.AutomationJob;
export const ClientOnboarding = base44.entities.OnboardingClient;
export const DemoRequest = base44.entities.DemoRequest;
export const LaunchApproval = base44.entities.LaunchApproval;
export const LaunchGate = base44.entities.LaunchGate;
export const SpaLead = base44.entities.Leads;
export const SupportMessage = base44.entities.SupportMessage;

// WebsiteLead writes must pass through the hardened server-side intake function.
// Reads and updates remain available through the generated entity client, while
// direct create calls are intercepted so fake/test rejection and deduplication
// cannot be bypassed by legacy form components.
const websiteLeadEntity = base44.entities.WebsiteLead;
export const WebsiteLead = {
  ...websiteLeadEntity,
  async create(payload) {
    const response = await base44.functions.invoke('captureValidatedWebsiteLead', payload);
    const data = response?.data ?? response;
    if (data?.rejected) {
      const error = new Error('Lead submission was rejected by validation.');
      error.code = 'lead_rejected';
      error.reason_codes = data.reason_codes || [];
      throw error;
    }
    if (!data?.success) {
      throw new Error(data?.error || 'Unable to capture website lead.');
    }
    return {
      id: data.lead_id,
      duplicate: Boolean(data.duplicate),
      submission_count: data.submission_count || 1,
      request_id: data.request_id,
    };
  },
};

export default {
  AutomationJob,
  ClientOnboarding,
  DemoRequest,
  LaunchApproval,
  LaunchGate,
  SpaLead,
  SupportMessage,
  WebsiteLead,
};
