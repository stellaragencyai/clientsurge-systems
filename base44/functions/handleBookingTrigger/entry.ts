import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * handleBookingTrigger — Production AI Booking Agent execution path.
 *
 * Triggered when a lead expresses booking intent (classified reply).
 * Sends booking link via SMS and/or email.
 *
 * Full observability flow:
 *   1. Resolve ClientDeployment from lead.client_id
 *   2. checkModulePermission() for ai_booking_agent
 *   3. Execute booking action (send SMS/email)
 *   4. logAutomationExecution()
 *   5. calculateDeploymentHealth() on failure
 */
Deno.serve(async (req) => {
  const _obsStartTime = Date.now();
  let _obsCtx = null;

  try {
    const base44 = createClientFromRequest(req);
    const { lead, classifiedReply } = await req.json();

    if (!lead || !classifiedReply) {
      return Response.json(
        { error: 'lead and classifiedReply required' },
        { status: 400 }
      );
    }

    const { intent, confidence } = classifiedReply;

    // ── DEPLOYMENT OBSERVABILITY: Resolve deployment + check permission ──
    if (lead.client_id) {
      try {
        const deployments = await base44.asServiceRole.entities.ClientDeployment.filter(
          { client_id: lead.client_id, deployment_status: { $in: ['live', 'onboarding', 'configuring', 'ready'] } },
          '-created_date', 1
        );
        const deployment = deployments?.[0] || null;
        if (deployment) {
          const permRes = await base44.asServiceRole.functions.invoke('checkModulePermission', {
            deployment_id: deployment.id, module_key: 'ai_booking_agent'
          });
          if (permRes.data?.authorized !== true) {
            await base44.asServiceRole.functions.invoke('logAutomationExecution', {
              client_deployment_id: deployment.id, client_id: lead.client_id,
              module_key: 'ai_booking_agent', trigger_event: 'booking_intent_detected',
              execution_status: 'blocked',
              error_message: `Module not authorized (reason: ${permRes.data?.reason || 'unknown'})`,
              error_code: permRes.data?.reason || 'module_not_authorized',
              lead_id: lead.id,
            }).catch(() => {});
            return Response.json({
              blocked: true,
              reason: permRes.data?.reason,
              message: 'AI Booking Agent not authorized for this deployment',
            }, { status: 403 });
          }
          _obsCtx = {
            deployment_id: deployment.id,
            client_id: lead.client_id,
            module_key: 'ai_booking_agent',
            trigger_event: 'booking_intent_detected',
            lead_id: lead.id,
          };
        }
      } catch (err) {
        console.warn('[handleBookingTrigger] Observability init failed:', err.message);
      }
    }

    // Determine if we should send booking link
    const shouldSendBooking =
      (intent === 'booking_ready' || intent === 'availability_interest') &&
      confidence >= 0.8 &&
      !lead.booking_link_sent_at;

    if (!shouldSendBooking) {
      return Response.json({
        triggered: false,
        reason: 'intent does not match booking criteria or already sent',
      });
    }

    // Use booking link from environment or lead
    const bookingLink =
      lead.booking_link || Deno.env.get('DEFAULT_BOOKING_LINK') || '';

    if (!bookingLink) {
      return Response.json({
        triggered: false,
        reason: 'no booking link configured',
      });
    }

    const bookingMessage = `Perfect! Here's your booking link: ${bookingLink}`;
    let providerRef = null;

    // Send SMS if phone exists
    if (lead.phone) {
      try {
        const smsResult = await base44.functions.invoke('sendSMS', {
          phone: lead.phone,
          message: bookingMessage,
          leadId: lead.id,
        });
        providerRef = smsResult?.data?.messageId || smsResult?.data?.sid || null;
      } catch (e) {
        console.error('[handleBookingTrigger] Error sending booking SMS:', e.message);
      }
    }

    // Send booking email
    if (lead.email) {
      try {
        await base44.functions.invoke('sendBookingEmail', {
          lead,
          bookingLink,
        });
      } catch (e) {
        console.error('[handleBookingTrigger] Error sending booking email:', e.message);
      }
    }

    // Update lead status and timestamp
    await base44.entities.Leads.update(lead.id, {
      status: 'Booking Prompt Sent',
      booking_link_sent_at: new Date().toISOString(),
    });

    // ── DEPLOYMENT OBSERVABILITY: Log successful execution ──
    if (_obsCtx) {
      try {
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'completed',
          response_data: JSON.stringify({ booking_link: bookingLink, provider_ref: providerRef }),
          external_provider_reference: providerRef,
          execution_time_ms: Date.now() - _obsStartTime,
        });
      } catch (_) {}
    }

    return Response.json({
      triggered: true,
      message: 'Booking link sent via SMS and email',
    });
  } catch (error) {
    // ── DEPLOYMENT OBSERVABILITY: Log failed execution + trigger health check ──
    if (_obsCtx) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.functions.invoke('logAutomationExecution', {
          ..._obsCtx,
          execution_status: 'failed',
          error_message: error.message,
          error_code: 'booking_trigger_failed',
          execution_time_ms: Date.now() - _obsStartTime,
        });
        await base44.asServiceRole.functions.invoke('calculateDeploymentHealth', { deployment_id: _obsCtx.deployment_id });
      } catch (_) {}
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});