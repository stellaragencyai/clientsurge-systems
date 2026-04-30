/**
 * Smart Booking Link Deployment
 * Only inject booking link when lead readiness > 70%
 * Customizes URL per lead & tracks which link clicked
 */

import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { lead_id, project_id, booking_link } = await req.json();

    if (!lead_id || !booking_link) {
      return Response.json(
        { error: "lead_id and booking_link required" },
        { status: 400 }
      );
    }

    console.log(`[BookingLink] Evaluating deployment for ${lead_id}`);

    // 1. Get lead
    const lead = await base44.asServiceRole.entities.Leads.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    // 2. Get engagement events
    const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
      { lead_id },
      "-created_date",
      20
    );

    // 3. Calculate readiness score (0-100)
    let readinessScore = lead.lead_score || 0;

    const emailOpens = events ? events.filter((e) => e.status === "opened").length : 0;
    const emailClicks = events ? events.filter((e) => e.status === "clicked").length : 0;
    const smsReplies = events ? events.filter((e) => e.channel === "sms" && e.direction === "inbound").length : 0;

    readinessScore += emailOpens * 5;
    readinessScore += emailClicks * 15;
    readinessScore += smsReplies * 20;

    readinessScore = Math.min(100, readinessScore);

    // 4. Determine deployment decision
    const shouldDeploy = readinessScore >= 70;

    // 5. Create personalized booking link
    const baseUrl = new URL(booking_link);
    const customLink = `${baseUrl.origin}${baseUrl.pathname}?lead_id=${lead_id}&source=${lead.source}&utm_campaign=smart_deploy`;

    // 6. Create tracking event
    if (shouldDeploy) {
      await base44.asServiceRole.entities.CommunicationEvent.create({
        lead_id,
        event_type: "booking_link_deployed",
        channel: "email",
        direction: "outbound",
        provider: "internal",
        status: "pending",
        message_body: `Booking link deployed (readiness: ${readinessScore}%)`,
        metadata_json: JSON.stringify({
          readiness_score: readinessScore,
          custom_link: customLink,
          deployment_reason: "readiness threshold met",
        }),
      });
    }

    console.log(
      `[BookingLink] Readiness: ${readinessScore}%, Deploy: ${shouldDeploy}`
    );

    return Response.json({
      success: true,
      lead_id,
      readiness_score: readinessScore,
      should_deploy: shouldDeploy,
      custom_booking_link: shouldDeploy ? customLink : null,
      recommendation: shouldDeploy
        ? "Deploy booking link now"
        : `Wait until readiness reaches 70% (currently ${readinessScore}%)`,
    });
  } catch (error) {
    console.error("[BookingLink] Error:", error.message);
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
});