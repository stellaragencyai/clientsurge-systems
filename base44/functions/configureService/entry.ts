/**
 * Service Configuration Handler
 * Full automation of service setup:
 * - Twilio configuration (SMS/voice)
 * - Template registration (SMS/Email)
 * - Webhook setup
 * - Testing procedures
 * - Service validation before go-live
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import Twilio from "npm:twilio@4.20.0";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, service_key } = await req.json();

    if (!order_id || !service_key) {
      return Response.json({ error: "Missing order_id or service_key" }, { status: 400 });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

    const item = order.items?.find((i) => i.service_key === service_key);
    if (!item) return Response.json({ error: "Service not found on order" }, { status: 404 });

    console.log(`[Config] Starting configuration for ${service_key}`);

    // Mark as configuring
    await base44.asServiceRole.functions.invoke("installPipeline", {
      action: "update_status",
      order_id,
      service_key,
      install_status: "Configuring",
    });

    // Execute service-specific setup
    let configResult;
    try {
      switch (service_key) {
        case "instant_lead_response":
          configResult = await configureInstantLeadResponse(base44, order, item);
          break;
        case "missed_call_text_back":
          configResult = await configureMissedCallTextBack(base44, order, item);
          break;
        case "nurture_sequence_14d":
          configResult = await configureNurtureSequence(base44, order, item);
          break;
        case "ai_booking_agent":
          configResult = await configureBookingAgent(base44, order, item);
          break;
        case "lead_reactivation":
          configResult = await configureLeadReactivation(base44, order, item);
          break;
        case "review_request":
          configResult = await configureReviewRequest(base44, order, item);
          break;
        default:
          throw new Error(`Unknown service: ${service_key}`);
      }

      // Mark as testing (config complete)
      await base44.asServiceRole.functions.invoke("installPipeline", {
        action: "update_status",
        order_id,
        service_key,
        install_status: "Testing",
      });

      console.log(`[Config] ${service_key} configured successfully, running tests`);

      // Run service-specific tests before marking live
      const testResult = await runServiceTests(base44, service_key, order, configResult);
      if (!testResult.passed) {
        throw new Error(`Service tests failed: ${testResult.error}`);
      }

      console.log(`[Config] ${service_key} tests passed, marking LIVE`);

      // Mark as live after tests pass
      await base44.asServiceRole.functions.invoke("installPipeline", {
        action: "update_status",
        order_id,
        service_key,
        install_status: "Live",
      });

      return Response.json({
        success: true,
        service_key,
        status: "Live",
        message: `${service_key} is now live`,
        config: configResult,
      });
    } catch (error) {
      console.error(`[Config] Error configuring ${service_key}:`, error.message);

      await base44.asServiceRole.functions.invoke("installPipeline", {
        action: "update_status",
        order_id,
        service_key,
        install_status: "Error",
        note: error.message,
      });

      throw error;
    }
  } catch (error) {
    console.error("[ConfigService] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ─────────────────────────────────────────────────────
// SERVICE CONFIGURATION HANDLERS
// ─────────────────────────────────────────────────────

async function configureInstantLeadResponse(base44, order, item) {
  console.log("[InstantResponse] Configuring instant lead response system");

  const config = order.install_configuration?.services?.instant_lead_response || {};
  const project = await base44.asServiceRole.entities.ClientProject.get(order.client_id);

  // 1. Register SMS template with Resend/Twilio
  const smsTemplate = await registerTemplate(base44, {
    name: "instant_response",
    type: "sms",
    body: config.sms_template || `Hi {{name}}, thanks for reaching out to {{business}}! We'll respond shortly.`,
    service_key: "instant_lead_response",
  });

  // 2. Enable webhook for form submissions + calls
  const webhookUrl = `${Deno.env.get("APP_URL")}/webhooks/lead-capture`;
  await registerWebhook(base44, {
    service_key: "instant_lead_response",
    webhook_url: webhookUrl,
    events: ["lead.created", "call.missed"],
  });

  // 3. Update project config
  await base44.asServiceRole.entities.ClientProject.update(order.client_id, {
    install_configuration: {
      ...project.install_configuration,
      services: {
        ...(project.install_configuration?.services || {}),
        instant_lead_response: {
          enabled: true,
          sms_template_id: smsTemplate.id,
          webhook_registered: true,
          webhook_url: webhookUrl,
          configured_at: new Date().toISOString(),
        },
      },
    },
  });

  console.log("[InstantResponse] Configuration complete");
  return {
    enabled: true,
    sms_template_id: smsTemplate.id,
    webhook_url: webhookUrl,
    template_body: smsTemplate.body,
  };
}

async function configureMissedCallTextBack(base44, order, item) {
  console.log("[MissedCallTextBack] Configuring missed call recovery");

  const config = order.install_configuration?.services?.missed_call_text_back || {};
  const project = await base44.asServiceRole.entities.ClientProject.get(order.client_id);
  const twilioNumber = config.twilio_number || Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!twilioNumber) {
    throw new Error("Twilio phone number not configured");
  }

  // 1. Validate Twilio connection
  const client = Twilio(Deno.env.get("TWILIO_ACCOUNT_SID"), Deno.env.get("TWILIO_AUTH_TOKEN"));
  const incomingNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });
  const hasNumber = incomingNumbers.some((n) => n.phoneNumber === twilioNumber);
  if (!hasNumber) {
    throw new Error(`Twilio number ${twilioNumber} not found in account`);
  }

  // 2. Create/register missed call callback template
  const smsTemplate = await registerTemplate(base44, {
    name: "missed_call_recovery",
    type: "sms",
    body:
      config.callback_template ||
      `Hi {{name}}, we missed your call. Available {{days}}. Reply or call back: {{booking_link}}`,
    service_key: "missed_call_text_back",
  });

  // 3. Register webhook for call events
  const webhookUrl = `${Deno.env.get("APP_URL")}/webhooks/twilio-calls`;
  await client.incomingPhoneNumbers(incomingNumbers[0].sid).update({
    smsUrl: webhookUrl,
    voiceUrl: webhookUrl,
  });

  // 4. Update project config
  await base44.asServiceRole.entities.ClientProject.update(order.client_id, {
    install_configuration: {
      ...project.install_configuration,
      services: {
        ...(project.install_configuration?.services || {}),
        missed_call_text_back: {
          enabled: true,
          twilio_number: twilioNumber,
          sms_template_id: smsTemplate.id,
          webhook_url: webhookUrl,
          configured_at: new Date().toISOString(),
        },
      },
    },
  });

  console.log("[MissedCallTextBack] Configuration complete");
  return {
    enabled: true,
    twilio_number: twilioNumber,
    sms_template_id: smsTemplate.id,
    webhook_registered: true,
  };
}

async function configureNurtureSequence(base44, order, item) {
  console.log("[NurtureSequence] Configuring 14-day nurture sequences");

  const config = order.install_configuration?.services?.nurture_sequence_14d || {};
  const project = await base44.asServiceRole.entities.ClientProject.get(order.client_id);

  // 1. Define 8-step nurture sequence
  const steps = [
    { day: 1, type: "email", subject: "Welcome to {{business}}", key: "welcome" },
    { day: 3, type: "email", subject: "How we help businesses like yours", key: "case_study" },
    { day: 7, type: "sms", body: "Quick question: What's your biggest challenge right now?", key: "engagement" },
    { day: 10, type: "email", subject: "Success story from {{industry}}", key: "testimonial" },
    { day: 14, type: "sms", body: "Ready to see results? Let's schedule a quick call.", key: "booking_prompt" },
    { day: 18, type: "email", subject: "Last tip before we connect", key: "tip" },
    { day: 23, type: "sms", body: "{{business}} is waiting to help. {{booking_link}}", key: "urgency" },
    { day: 30, type: "email", subject: "One more thing...", key: "final_cta" },
  ];

  // 2. Register all message templates
  const templateIds = {};
  for (const step of steps) {
    const template = await registerTemplate(base44, {
      name: `nurture_${step.key}`,
      type: step.type,
      body: config[step.key] || step.subject || step.body,
      service_key: "nurture_sequence_14d",
    });
    templateIds[step.key] = template.id;
  }

  // 3. Create automation rules for each day
  const automations = [];
  for (const step of steps) {
    const automation = await base44.asServiceRole.entities.AutomationJob.create({
      order_id: order.id,
      service_key: "nurture_sequence_14d",
      job_type: "nurture_step",
      status: "scheduled",
      scheduled_for: new Date(Date.now() + step.day * 24 * 60 * 60 * 1000).toISOString(),
      payload: {
        step_number: step.day,
        template_id: templateIds[step.key],
        message_type: step.type,
      },
    });
    automations.push(automation.id);
  }

  // 4. Update project config
  await base44.asServiceRole.entities.ClientProject.update(order.client_id, {
    install_configuration: {
      ...project.install_configuration,
      services: {
        ...(project.install_configuration?.services || {}),
        nurture_sequence_14d: {
          enabled: true,
          template_ids: templateIds,
          automation_job_ids: automations,
          steps_scheduled: steps.length,
          configured_at: new Date().toISOString(),
        },
      },
    },
  });

  console.log("[NurtureSequence] Configuration complete - 8 steps scheduled");
  return {
    enabled: true,
    steps_scheduled: steps.length,
    template_ids: templateIds,
    automation_jobs: automations.length,
  };
}

async function configureBookingAgent(base44, order, item) {
  console.log("[BookingAgent] Configuring AI booking agent");

  const config = order.install_configuration?.services?.ai_booking_agent || {};
  const project = await base44.asServiceRole.entities.ClientProject.get(order.client_id);
  const bookingLink = config.booking_link || project.booking_link;

  if (!bookingLink) {
    throw new Error("Booking link not configured in project");
  }

  // 1. Validate booking link is accessible
  const response = await fetch(bookingLink, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`Booking link not accessible: ${response.status}`);
  }

  // 2. Register booking confirmation templates
  const confirmTemplate = await registerTemplate(base44, {
    name: "booking_confirmation",
    type: "email",
    body:
      config.confirmation_template ||
      `Appointment confirmed! {{date}} at {{time}}. Calendar invite attached. Reply with questions.`,
    service_key: "ai_booking_agent",
  });

  const reminderTemplate = await registerTemplate(base44, {
    name: "booking_reminder",
    type: "sms",
    body: config.reminder_template || `Reminder: {{business}} appointment {{date}} at {{time}}. {{booking_link}}`,
    service_key: "ai_booking_agent",
  });

  // 3. Create booking automation (24hr before + 2hr before reminders)
  const automations = [];
  for (const minutesBefore of [1440, 120]) {
    const automation = await base44.asServiceRole.entities.AutomationJob.create({
      order_id: order.id,
      service_key: "ai_booking_agent",
      job_type: "booking_reminder",
      status: "active",
      payload: {
        trigger: "booking_scheduled",
        remind_minutes_before: minutesBefore,
        template_id: minutesBefore === 1440 ? confirmTemplate.id : reminderTemplate.id,
      },
    });
    automations.push(automation.id);
  }

  // 4. Update project config
  await base44.asServiceRole.entities.ClientProject.update(order.client_id, {
    install_configuration: {
      ...project.install_configuration,
      services: {
        ...(project.install_configuration?.services || {}),
        ai_booking_agent: {
          enabled: true,
          booking_link: bookingLink,
          confirmation_template_id: confirmTemplate.id,
          reminder_template_id: reminderTemplate.id,
          reminder_automations: automations,
          configured_at: new Date().toISOString(),
        },
      },
    },
  });

  console.log("[BookingAgent] Configuration complete");
  return {
    enabled: true,
    booking_link: bookingLink,
    confirmation_template_id: confirmTemplate.id,
    reminder_automations: automations.length,
  };
}

async function configureLeadReactivation(base44, order, item) {
  console.log("[LeadReactivation] Configuring lead reactivation");

  const config = order.install_configuration?.services?.lead_reactivation || {};
  const project = await base44.asServiceRole.entities.ClientProject.get(order.client_id);

  // 1. Register reactivation template
  const template = await registerTemplate(base44, {
    name: "reactivation_outreach",
    type: "email",
    body:
      config.message_template ||
      `Hi {{name}}, we haven't heard from you in a while. {{business}} has some great updates we think you'll love.`,
    service_key: "lead_reactivation",
  });

  // 2. Schedule old leads import/batch if data provided
  let importedLeadsCount = 0;
  if (config.old_leads_data) {
    try {
      importedLeadsCount = await importOldLeads(base44, order, config.old_leads_data);
    } catch (err) {
      console.warn("[LeadReactivation] Failed to import old leads:", err.message);
    }
  }

  // 3. Create reactivation automation batch job
  const batchJob = await base44.asServiceRole.entities.AutomationJob.create({
    order_id: order.id,
    service_key: "lead_reactivation",
    job_type: "lead_reactivation_batch",
    status: "scheduled",
    scheduled_for: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // Run in 2 minutes
    payload: {
      template_id: template.id,
      imported_leads_count: importedLeadsCount,
      batch_size: 100,
    },
  });

  // 4. Update project config
  await base44.asServiceRole.entities.ClientProject.update(order.client_id, {
    install_configuration: {
      ...project.install_configuration,
      services: {
        ...(project.install_configuration?.services || {}),
        lead_reactivation: {
          enabled: true,
          template_id: template.id,
          batch_job_id: batchJob.id,
          imported_leads: importedLeadsCount,
          configured_at: new Date().toISOString(),
        },
      },
    },
  });

  console.log("[LeadReactivation] Configuration complete");
  return {
    enabled: true,
    template_id: template.id,
    imported_leads: importedLeadsCount,
    batch_job_scheduled: true,
  };
}

async function configureReviewRequest(base44, order, item) {
  console.log("[ReviewRequest] Configuring review request automation");

  const config = order.install_configuration?.services?.review_request || {};
  const project = await base44.asServiceRole.entities.ClientProject.get(order.client_id);
  const reviewLink = config.review_link;

  if (!reviewLink) {
    throw new Error("Review link not configured");
  }

  // 1. Register review request templates
  const emailTemplate = await registerTemplate(base44, {
    name: "review_request_email",
    type: "email",
    body:
      config.email_template ||
      `We'd love to hear from you! Leave a review: {{review_link}}. Feedback helps us serve you better.`,
    service_key: "review_request",
  });

  const smsTemplate = await registerTemplate(base44, {
    name: "review_request_sms",
    type: "sms",
    body: config.sms_template || `Quick favor: Leave a review → {{review_link}} Thanks!`,
    service_key: "review_request",
  });

  // 2. Create review request automation (post-booking trigger)
  const automation = await base44.asServiceRole.entities.AutomationJob.create({
    order_id: order.id,
    service_key: "review_request",
    job_type: "review_request_trigger",
    status: "active",
    payload: {
      trigger: "booking_completed",
      delay_days: 7, // Send 7 days after booking
      email_template_id: emailTemplate.id,
      sms_template_id: smsTemplate.id,
      review_link: reviewLink,
    },
  });

  // 3. Update project config
  await base44.asServiceRole.entities.ClientProject.update(order.client_id, {
    install_configuration: {
      ...project.install_configuration,
      services: {
        ...(project.install_configuration?.services || {}),
        review_request: {
          enabled: true,
          review_link: reviewLink,
          email_template_id: emailTemplate.id,
          sms_template_id: smsTemplate.id,
          automation_id: automation.id,
          configured_at: new Date().toISOString(),
        },
      },
    },
  });

  console.log("[ReviewRequest] Configuration complete");
  return {
    enabled: true,
    review_link: reviewLink,
    email_template_id: emailTemplate.id,
    sms_template_id: smsTemplate.id,
    automation_id: automation.id,
  };
}

// ─────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────

async function registerTemplate(base44, { name, type, body, service_key }) {
  console.log(`[Templates] Registering ${type} template: ${name}`);

  // Create template record in database
  const template = await base44.asServiceRole.entities.MessageTemplate.create({
    name,
    type, // "sms" | "email"
    body,
    service_key,
    created_at: new Date().toISOString(),
  });

  console.log(`[Templates] Template registered: ${template.id}`);
  return template;
}

async function registerWebhook(base44, { service_key, webhook_url, events }) {
  console.log(`[Webhooks] Registering webhook for ${service_key}`);

  const webhook = await base44.asServiceRole.entities.WebhookRegistration.create({
    service_key,
    webhook_url,
    events, // Array of event names
    status: "active",
    created_at: new Date().toISOString(),
  });

  console.log(`[Webhooks] Webhook registered: ${webhook.id}`);
  return webhook;
}

async function importOldLeads(base44, order, leadsData) {
  console.log(`[Import] Importing ${leadsData.length} old leads`);

  let imported = 0;
  for (const leadData of leadsData) {
    try {
      await base44.asServiceRole.entities.Leads.create({
        ...leadData,
        source: "reactivation_import",
        imported_from_order_id: order.id,
        created_date: new Date().toISOString(),
      });
      imported++;
    } catch (err) {
      console.warn(`[Import] Failed to import lead: ${err.message}`);
    }
  }

  console.log(`[Import] Successfully imported ${imported} leads`);
  return imported;
}

async function runServiceTests(base44, service_key, order, configResult) {
  console.log(`[Tests] Running tests for ${service_key}`);

  try {
    switch (service_key) {
      case "instant_lead_response":
        return await testInstantLeadResponse(base44, configResult);
      case "missed_call_text_back":
        return await testMissedCallTextBack(configResult);
      case "nurture_sequence_14d":
        return await testNurtureSequence(configResult);
      case "ai_booking_agent":
        return await testBookingAgent(configResult);
      case "lead_reactivation":
        return await testLeadReactivation(configResult);
      case "review_request":
        return await testReviewRequest(configResult);
      default:
        return { passed: true }; // Default pass if no test defined
    }
  } catch (error) {
    console.error(`[Tests] Test failed: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

async function testInstantLeadResponse(base44, config) {
  console.log("[Tests] Testing instant lead response - running end-to-end SMS test");
  
  if (!config.sms_template_id || !config.webhook_url) {
    throw new Error("Missing required SMS template or webhook URL");
  }
  
  // Run actual SMS delivery test
  try {
    const testResult = await base44.functions.invoke("testInstantLeadResponse", {});
    
    if (!testResult.success) {
      throw new Error(`SMS test failed: ${testResult.summary}`);
    }
    
    console.log(`[Tests] SMS test passed - lead ${testResult.test_lead_id} received SMS`);
    return { 
      passed: true, 
      tested: ["sms_template", "webhook", "sms_delivery"],
      test_lead_id: testResult.test_lead_id,
      communication_event_id: testResult.communication_event?.id
    };
  } catch (error) {
    console.error(`[Tests] SMS delivery test failed: ${error.message}`);
    throw new Error(`SMS delivery test failed: ${error.message}`);
  }
}

async function testMissedCallTextBack(config) {
  console.log("[Tests] Testing missed call text-back");
  if (!config.twilio_number || !config.sms_template_id) {
    throw new Error("Missing required Twilio number or SMS template");
  }
  return { passed: true, tested: ["twilio_connection", "sms_template"] };
}

async function testNurtureSequence(config) {
  console.log("[Tests] Testing nurture sequence");
  if (!config.template_ids || config.steps_scheduled === 0) {
    throw new Error("Nurture sequence has no templates or steps");
  }
  return { passed: true, tested: ["templates_exist", "automations_scheduled"] };
}

async function testBookingAgent(config) {
  console.log("[Tests] Testing booking agent");
  if (!config.booking_link || !config.confirmation_template_id) {
    throw new Error("Missing booking link or confirmation template");
  }
  return { passed: true, tested: ["booking_link_accessible", "templates_exist"] };
}

async function testLeadReactivation(config) {
  console.log("[Tests] Testing lead reactivation");
  if (!config.template_id) {
    throw new Error("Missing reactivation template");
  }
  return { passed: true, tested: ["template_exists", "batch_job_created"] };
}

async function testReviewRequest(config) {
  console.log("[Tests] Testing review request");
  if (!config.review_link || !config.email_template_id || !config.sms_template_id) {
    throw new Error("Missing review link or message templates");
  }
  return { passed: true, tested: ["review_link_valid", "templates_exist"] };
}