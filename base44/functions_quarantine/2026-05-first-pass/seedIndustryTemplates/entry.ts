/**
 * Seed Industry Templates
 * Run once to populate default templates for each industry
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    console.log("[Seed] Creating industry templates...");

    const templates = [
      {
        industry: "med_spa",
        template_name: "Med Spa Standard",
        response_sla_minutes: 15,
        booking_frequency_days: 45,
        default_templates: {
          instant_response:
            "Hi {{name}}, thanks for contacting {{business}}! We'll respond within 15 minutes with your booking details.",
          price_concern:
            "I understand cost matters! Our most popular package is ${{price}} and typically pays for itself in savings within a month.",
          uncertain:
            "No pressure! We offer a free 15-minute consultation so you can see if we're the right fit.",
          booking_reminder_24h:
            "Your appointment is tomorrow at {{time}}! See you at {{business}}. Reply with any questions.",
          booking_reminder_2h:
            "Reminder: Your appointment at {{business}} is in 2 hours at {{time}}!",
          review_request:
            "Thanks for choosing {{business}}! Would you mind leaving a quick review? {{review_link}}",
          reactivation_offer:
            "We miss you, {{name}}! Come back for 20% off your next booking this week only.",
        },
        scoring_multipliers: {
          source_phone: 1.3,
          source_form: 1.0,
          source_referral: 1.4,
          response_under_5min: 1.2,
          viewed_booking_page: 1.3,
          premium_service: 1.2,
        },
        routing_rules: [
          "phone_leads → immediate assignment",
          "high_score → best closer",
        ],
        churn_baseline_days: 45,
        automation_steps: [
          {
            step_name: "Instant Response",
            trigger: "lead_created",
            action: "send_sms",
            delay_minutes: 0,
          },
          {
            step_name: "Case Study",
            trigger: "lead_replied",
            action: "send_email",
            delay_minutes: 60,
          },
        ],
        status: "active",
      },
      {
        industry: "dental",
        template_name: "Dental Practice Standard",
        response_sla_minutes: 30,
        booking_frequency_days: 180,
        default_templates: {
          instant_response:
            "Thanks for contacting {{business}}! We'll get back to you within 30 minutes to confirm your appointment.",
          price_concern:
            "We offer flexible payment plans and most insurance covers 50-80% of costs. Let's discuss options.",
          uncertain:
            "New patients often worry about being comfortable. We specialize in making nervous patients feel at ease!",
          booking_reminder_24h:
            "Your appointment is tomorrow! Please arrive 10 minutes early.",
          booking_reminder_2h:
            "See you soon! We're looking forward to your visit.",
          review_request:
            "How was your visit? Help others find great care: {{review_link}}",
          reactivation_offer:
            "It's been 6 months! Schedule your checkup and receive a free cleaning with us.",
        },
        scoring_multipliers: {
          source_phone: 1.2,
          source_form: 1.0,
          source_referral: 1.5,
          response_under_5min: 1.1,
          viewed_booking_page: 1.2,
          premium_service: 1.1,
        },
        routing_rules: ["hygienist_available → assign", "complex_case → dentist"],
        churn_baseline_days: 180,
        automation_steps: [],
        status: "active",
      },
      {
        industry: "hvac",
        template_name: "HVAC Service Standard",
        response_sla_minutes: 60,
        booking_frequency_days: 365,
        default_templates: {
          instant_response:
            "Thanks for reaching out! We'll schedule your service ASAP. Typical wait is 24-48 hours.",
          price_concern:
            "We're competitive and offer financing. Many systems save money through efficiency gains.",
          uncertain:
            "Not sure what you need? A free diagnostic visit shows exactly what's required.",
          booking_reminder_24h:
            "Technician arriving tomorrow between {{time_window}}. We'll text 30 min before.",
          booking_reminder_2h:
            "We're on the way! Technician will arrive in approximately 2 hours.",
          review_request:
            "How was your service? Help your community: {{review_link}}",
          reactivation_offer:
            "Annual HVAC maintenance keeps your system running efficiently. Schedule today.",
        },
        scoring_multipliers: {
          source_phone: 1.3,
          source_form: 1.0,
          source_referral: 1.2,
          response_under_5min: 1.1,
          viewed_booking_page: 1.2,
          premium_service: 1.0,
        },
        routing_rules: ["emergency → top_tech", "maintenance → any_tech"],
        churn_baseline_days: 365,
        automation_steps: [],
        status: "active",
      },
    ];

    // Create templates
    let created = 0;
    for (const template of templates) {
      try {
        await base44.asServiceRole.entities.BusinessConfigTemplate.create(template);
        created++;
        console.log(`[Seed] ✅ Created: ${template.template_name}`);
      } catch (error) {
        console.warn(`[Seed] Skipped ${template.industry}: ${error.message}`);
      }
    }

    console.log(`[Seed] Created ${created}/${templates.length} templates`);

    return Response.json({
      success: true,
      templates_created: created,
    });
  } catch (error) {
    console.error("[Seed] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});