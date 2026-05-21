import { secureJson } from "../_shared/response.ts";
/**
 * resendWebhookHandlers.ts — #134 #135
 * #134: on email.bounced → update CommunicationEvent status = "failed"
 * #135: on email.opened → update lead.last_engagement_at
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const event = await req.json();
    const type = event?.type;
    const emailId = event?.data?.email_id;
    const to = event?.data?.to?.[0];

    if (type === "email.bounced" && emailId) {
      // #134: find CommunicationEvent by message_id and mark failed
      const events = await base44.asServiceRole.entities.CommunicationEvent
        ?.filter?.({ message_id: emailId }).catch(() => []);
      for (const ce of (events || [])) {
        await base44.asServiceRole.entities.CommunicationEvent.update(ce.id, {
          status: "failed",
          failure_reason: "bounced",
          failed_at: new Date().toISOString(),
        }).catch(() => {});
      }
      // Log
      await base44.asServiceRole.entities.AgentLog.create({
        agent_name: "receiveResendWebhook", log_type: "warn",
        summary: `Email bounced: ${to || emailId}`,
        service: "resend", requires_nolan: false, resolved: true,
      }).catch(() => {});
    }

    if (type === "email.opened" && to) {
      // #135: update lead.last_engagement_at
      const leads = await base44.asServiceRole.entities.SpaLead
        ?.filter?.({ email: to }).catch(() => []);
      for (const lead of (leads || [])) {
        await base44.asServiceRole.entities.SpaLead.update(lead.id, {
          last_engagement_at: new Date().toISOString(),
        }).catch(() => {});
      }
    }

    return secureJson({ received: true, type });
  } catch (err: any) {
    return secureJson({ error: err.message }, { status: 500 });
  }
});
