import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PACKAGE_SERVICE_MAP = {
  starter_system: ['instant_lead_response', 'missed_call_text_back'],
  growth_system: ['instant_lead_response', 'missed_call_text_back', 'nurture_sequence_14d', 'ai_booking_agent'],
  pro_system: ['instant_lead_response', 'missed_call_text_back', 'nurture_sequence_14d', 'ai_booking_agent', 'review_request', 'lead_reactivation'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Use service role since public users can't write directly to these entities
    const svc = base44.asServiceRole;

    const body = await req.json();
    const {
      contact_name,
      business_name,
      email,
      phone,
      website,
      business_type,
      selected_package_key,
      selected_service_key,
      crm_stack,
      booking_link,
      lead_sources,
      problem,
      timeline,
      notes,
      consent,
      source_page = '/start',
    } = body;

    if (!email || !business_name || !contact_name || !phone) {
      return Response.json({ error: 'Missing required fields: contact_name, business_name, email, phone' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const firstName = contact_name?.trim().split(' ')[0] || '';
    const requested_channels = consent ? ['sms', 'email'] : [];
    const packageServiceKeys = PACKAGE_SERVICE_MAP[selected_package_key] || [];
    const serviceInterest = selected_service_key || packageServiceKeys[0] || null;

    // ── 1. WebsiteLead ──────────────────────────────────────
    let websiteLeadId = null;
    try {
      const wlData = {
        full_name: contact_name,
        first_name: firstName,
        email: email,
        phone_number: phone,
        business_name: business_name,
        business_type: business_type || null,
        business_website_url: website || null,
        service_interest: serviceInterest,
        interested_service: serviceInterest,
        problem: problem || null,
        source: 'landing_page',
        source_page: source_page,
        consent_given: Boolean(consent),
        consent_given_at: consent ? now : null,
        requested_channels: requested_channels,
        sms_permission: consent ? true : false,
        timeline: timeline || null,
        automation_enabled: true,
        lead_status: 'new',
      };

      // Dedup: check for existing WebsiteLead with same email
      const existing = await svc.entities.WebsiteLead.filter({ email: email });
      if (existing && existing.length > 0) {
        await svc.entities.WebsiteLead.update(existing[0].id, wlData);
        websiteLeadId = existing[0].id;
        console.log('WebsiteLead updated:', websiteLeadId);
      } else {
        const wl = await svc.entities.WebsiteLead.create(wlData);
        websiteLeadId = wl.id;
        console.log('WebsiteLead created:', websiteLeadId);
      }
    } catch (e) {
      console.error('WebsiteLead error:', e.message);
    }

    // ── 2. Leads ────────────────────────────────────────────
    let leadId = null;
    try {
      const leadData = {
        full_name: contact_name,
        business_name: business_name,
        email: email,
        phone: phone,
        business_type: business_type || null,
        industry: business_type || null,
        website: website || null,
        problem: problem || null,
        source: 'landing_page',
        source_page: source_page,
        intake_type: 'remote_setup',
        package_interest: selected_package_key || selected_service_key || null,
        consent_given: Boolean(consent),
        requested_channels: requested_channels,
        status: 'New',
        crm_stage: 'Not Contacted',
        outreach_status: 'not_contacted',
      };

      // Dedup: check existing lead with same email
      const existingLeads = await svc.entities.Leads.filter({ email: email });
      if (existingLeads && existingLeads.length > 0) {
        await svc.entities.Leads.update(existingLeads[0].id, leadData);
        leadId = existingLeads[0].id;
        console.log('Lead updated:', leadId);
      } else {
        const lead = await svc.entities.Leads.create(leadData);
        leadId = lead.id;
        console.log('Lead created:', leadId);
      }
    } catch (e) {
      console.error('Leads error:', e.message);
    }

    // ── 3. OnboardingClient ─────────────────────────────────
    let onboardingClientId = null;
    try {
      const ocData = {
        business_name: business_name,
        owner_name: contact_name,
        email: email,
        phone: phone,
        website: website || null,
        industry: business_type || null,
        lead_sources: Array.isArray(lead_sources) ? lead_sources.join(', ') : (lead_sources || null),
        booking_link: booking_link || null,
        current_crm_stack: crm_stack || null,
        package_purchased: selected_package_key ? PACKAGE_SERVICE_MAP[selected_package_key] ? selected_package_key : null : null,
        automation_services_selected: selected_service_key ? [selected_service_key] : packageServiceKeys,
        activation_package_key: selected_package_key || null,
        package_service_keys: packageServiceKeys,
        status: 'Onboarding',
        crm_lead_id: leadId || null,
        website_lead_id: websiteLeadId || null,
        notes: notes || null,
      };

      const existingOC = await svc.entities.OnboardingClient.filter({ email: email });
      if (existingOC && existingOC.length > 0) {
        await svc.entities.OnboardingClient.update(existingOC[0].id, ocData);
        onboardingClientId = existingOC[0].id;
        console.log('OnboardingClient updated:', onboardingClientId);
      } else {
        const oc = await svc.entities.OnboardingClient.create(ocData);
        onboardingClientId = oc.id;
        console.log('OnboardingClient created:', onboardingClientId);
      }
    } catch (e) {
      console.error('OnboardingClient error:', e.message);
    }

    // ── 4. OnboardingSubmission ─────────────────────────────
    let submissionId = null;
    try {
      // OnboardingSubmission requires client_id — use onboardingClientId as a proxy identifier
      const submissionData = {
        client_id: onboardingClientId || leadId || 'pending_' + Date.now(),
        status: 'submitted',
        submission_data: {
          selected_package_key: selected_package_key || null,
          selected_service_key: selected_service_key || null,
          business_name: business_name,
          owner_name: contact_name,
          email: email,
          phone: phone,
          website: website || null,
          industry: business_type || null,
          crm_stack: crm_stack || null,
          booking_link: booking_link || null,
          lead_sources: lead_sources || [],
          problem: problem || null,
          timeline: timeline || null,
          notes: notes || null,
          consent: Boolean(consent),
          requested_channels: requested_channels,
          source_page: source_page,
          submitted_at: now,
        },
      };
      const sub = await svc.entities.OnboardingSubmission.create(submissionData);
      submissionId = sub.id;
      console.log('OnboardingSubmission created:', submissionId);
    } catch (e) {
      console.error('OnboardingSubmission error:', e.message);
    }

    // ── 5. CommunicationEvent ───────────────────────────────
    try {
      await svc.entities.CommunicationEvent.create({
        channel: 'internal',
        direction: 'system',
        provider: 'internal',
        event_type: 'lead_created',
        status: 'processed',
        subject: `Remote setup intake received: ${business_name} (${selected_package_key || selected_service_key || 'unspecified'})`,
        lead_id: leadId || null,
        onboarding_client_id: onboardingClientId || null,
        service_key: selected_service_key || (packageServiceKeys[0] || null),
        message_body: `Source: ${source_page} | Package: ${selected_package_key || 'none'} | Service: ${selected_service_key || 'none'} | Timeline: ${timeline || 'not specified'}`,
        environment: 'production',
      });
    } catch (e) {
      console.error('CommunicationEvent error:', e.message);
    }

    // ── 6. Confirmation email (best-effort) ─────────────────
    try {
      await svc.integrations.Core.SendEmail({
        to: email,
        from_name: 'ClientSurge Systems',
        subject: 'Remote Setup Intake Received — ClientSurge Systems',
        body: `Hi ${firstName},\n\nYour remote setup intake has been received for ${business_name}.\n\nSelected: ${PACKAGE_SERVICE_MAP[selected_package_key] ? selected_package_key : selected_service_key || 'Custom'}\n\nClientSurge will review your business details, lead sources, and setup access requirements. You'll hear from us shortly.\n\nNext step: Watch for an email from our team with your setup checklist and access requirements.\n\nQuestions? Reply to this email or call (602) 584-3227.\n\nClientSurge Systems\nsupport@clientsurgesystems.com`,
      });
    } catch (e) {
      console.error('Confirmation email error (non-fatal):', e.message);
    }

    return Response.json({
      success: true,
      lead_id: leadId,
      onboarding_client_id: onboardingClientId,
      submission_id: submissionId,
      website_lead_id: websiteLeadId,
    });

  } catch (error) {
    console.error('submitRemoteSetupIntake error:', error);
    return Response.json({ error: error.message || 'Submission failed' }, { status: 500 });
  }
});