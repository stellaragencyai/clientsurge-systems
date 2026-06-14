import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

/**
 * Email Onboarding Automation: Execute EmailSequence steps based on client lifecycle stage
 * Triggered when:
 * - OnboardingClient is created/updated
 * - Client status changes to 'In Setup' or 'Active'
 * - Order enters 'paid_setup_in_progress' state
 *
 * Maps lifecycle stages to email triggers:
 * - onboarding_started → welcome email
 * - setup_in_progress → setup guidance email
 * - testing → validation email
 * - live → activation confirmation email
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const {
      client_id,
      onboarding_client_id,
      order_id,
      stage, // onboarding_started | setup_in_progress | testing | live
      email,
      business_name,
      owner_name,
      industry,
    } = payload;

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    // Map lifecycle stage to EmailSequence type
    const stageToSequenceType = {
      onboarding_started: 'onboarding',
      setup_in_progress: 'onboarding',
      testing: 'onboarding',
      live: 'onboarding',
    };

    const sequenceType = stageToSequenceType[stage] || 'onboarding';

    // Find the appropriate EmailSequence for this stage
    const sequences = await base44.asServiceRole.entities.EmailSequence.filter(
      {
        type: sequenceType,
        active: true,
        status: 'active',
      },
      '-created_date',
      1
    ).catch(() => []);

    if (!sequences || sequences.length === 0) {
      console.log(`[sendOnboardingEmailSequence] No active ${sequenceType} sequence found`);
      return Response.json({
        success: true,
        skipped: true,
        reason: 'No active email sequence',
      });
    }

    const sequence = sequences[0];
    const resultsLog = {
      sequence_id: sequence.id,
      sequence_name: sequence.name,
      email,
      stage,
      emails_sent: 0,
      errors: [],
    };

    // Execute enabled steps
    const enabledSteps = (sequence.steps || [])
      .filter(s => s.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const step of enabledSteps) {
      try {
        // Calculate send time based on delay
        const now = new Date();
        const delayMs = ((step.delay_days || 0) * 24 * 60 * 60 * 1000) +
          ((step.delay_hours || 0) * 60 * 60 * 1000);
        const sendAt = new Date(now.getTime() + delayMs);

        // Personalize email content
        const personalizedSubject = personalizeContent(step.subject, {
          business_name,
          owner_name,
          industry,
        });

        const personalizedBody = personalizeContent(step.body, {
          business_name,
          owner_name,
          industry,
        });

        // Send email via Resend
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'onboarding@clientsurgesystems.com',
              to: email,
              subject: personalizedSubject,
              html: buildHtmlEmail(personalizedBody, business_name || 'there'),
            }),
          }).catch(err => {
            throw new Error(`Resend API failed: ${err.message}`);
          });

          // Log email in Emails entity
          await base44.asServiceRole.entities.Emails.create({
            lead_id: client_id || onboarding_client_id || order_id,
            email_address: email,
            subject: personalizedSubject,
            body: personalizedBody,
            status: 'sent',
          }).catch(err => {
            console.error(`Failed to log email: ${err.message}`);
          });

          resultsLog.emails_sent++;
          console.log(`[sendOnboardingEmailSequence] Sent step ${step.order}: ${personalizedSubject}`);
        }
      } catch (error) {
        resultsLog.errors.push({
          step_order: step.order,
          error: error.message,
        });
        console.error(`[sendOnboardingEmailSequence] Step ${step.order} error:`, error.message);
      }
    }

    return Response.json({
      success: true,
      ...resultsLog,
    });
  } catch (error) {
    console.error('[sendOnboardingEmailSequence] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Personalize email content with dynamic variables
 */
function personalizeContent(content, variables) {
  if (!content) return '';
  let result = content;
  Object.entries(variables).forEach(([key, value]) => {
    if (value) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      result = result.replace(placeholder, value);
    }
  });
  return result;
}

/**
 * Build HTML email wrapper
 */
function buildHtmlEmail(body, businessName) {
  return `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#fff">
  <p style="color:#374151">Hey ${businessName},</p>
  <div style="color:#1F2937;font-size:14px;line-height:1.6;margin:20px 0">
    ${body.split('\n').map(line => `<p style="margin:12px 0">${line}</p>`).join('')}
  </div>
  <p style="color:#6B7280;font-size:13px;margin-top:24px">
    Need help? Reply to this email or contact support@clientsurgesystems.com
  </p>
  <p style="color:#6B7280;font-size:13px">— The ClientSurge Systems Team</p>
</div>
  `.trim();
}