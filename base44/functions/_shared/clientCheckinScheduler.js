export const CLIENT_CHECKIN_JOB_TYPE = "client_30_day_checkin";

const DAY_MS = 24 * 60 * 60 * 1000;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function buildCheckinSchedule(now = new Date()) {
  const baseDate = now instanceof Date ? now : new Date(now);
  return {
    scheduled_for: new Date(baseDate.getTime() + 30 * DAY_MS).toISOString(),
    operator_reminder_at: new Date(baseDate.getTime() + 28 * DAY_MS).toISOString(),
  };
}

export function getActiveSystems(client = {}) {
  const systems = [];
  if (client.step_twilio) systems.push("Dedicated business phone number");
  if (client.step_lead_sources) systems.push("Lead sources connected and flowing");
  if (client.step_instant_response) systems.push("Instant SMS response system");
  if (client.step_followup_sequence) systems.push("Multi-day follow-up sequence");
  if (client.step_missed_call) systems.push("Missed call text-back");
  if (client.step_messages_customized) systems.push("Custom branded messages");
  return systems.length ? systems : ["ClientSurge automation system"];
}

export function shouldScheduleClientCheckin(client = {}, oldClient = {}) {
  const status = String(client.status || "").toLowerCase();
  const oldStatus = String(oldClient?.status || "").toLowerCase();
  return ["live", "active"].includes(status) && !["live", "active"].includes(oldStatus);
}

export function buildClientCheckinEmail({ client = {}, activeSystems = getActiveSystems(client) }) {
  const ownerName = escapeHtml(client.owner_name || client.full_name || "there");
  const businessName = escapeHtml(client.business_name || "your business");
  const systemsList = activeSystems
    .map((system) => `<li style="margin-bottom:6px;">${escapeHtml(system)}</li>`)
    .join("");

  return `
<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;color:#2d2d2d;">
  <div style="border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:28px;">
    <p style="font-size:13px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;margin:0;">ClientSurge Systems</p>
  </div>
  <p style="font-size:16px;margin-bottom:6px;">Hey ${ownerName},</p>
  <p style="font-size:15px;line-height:1.7;color:#444;">
    Your ClientSurge system has now been live for 30 days. I would like to review what is working, answer questions, and map out the next few improvements for ${businessName}.
  </p>
  <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px;padding:16px 20px;margin:20px 0;">
    <p style="font-size:13px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;">Systems to review</p>
    <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8;color:#2d2d2d;">${systemsList}</ul>
  </div>
  <p style="font-size:15px;line-height:1.7;color:#444;">
    Book a quick 20-minute check-in here:
  </p>
  <p style="margin:28px 0;">
    <a href="https://calendly.com/nolan-clientsurgesystems" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:8px;">Book Your 30-Day Check-In</a>
  </p>
  <p style="font-size:15px;line-height:1.7;color:#444;">
    Talk soon,<br/>
    <strong>Nolan</strong><br/>
    <span style="color:#2563eb;font-size:13px;">ClientSurge Systems</span>
  </p>
</div>`;
}

export function buildOperatorReminderEmail({ client = {}, schedule, activeSystems = getActiveSystems(client) }) {
  const businessName = escapeHtml(client.business_name || "Unknown business");
  const ownerName = escapeHtml(client.owner_name || client.full_name || "Unknown owner");
  const activeSummary = activeSystems.map((system) => `- ${system}`).join("\n");

  return `
<p>Hi Nolan,</p>
<p><strong>${businessName}</strong> just moved to live/active status. Their 30-day check-in is scheduled for <strong>${formatDateLabel(schedule.scheduled_for)}</strong>.</p>
<p>Prep reminder date: <strong>${formatDateLabel(schedule.operator_reminder_at)}</strong>.</p>
<table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;margin:20px 0;">
  <tr><td style="padding:5px 16px 5px 0;color:#555;font-weight:600;">Client</td><td>${businessName} (${ownerName})</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#555;font-weight:600;">Email</td><td>${escapeHtml(client.email || "-")}</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#555;font-weight:600;">Phone</td><td>${escapeHtml(client.phone || "-")}</td></tr>
  <tr><td style="padding:5px 16px 5px 0;color:#555;font-weight:600;">Industry</td><td>${escapeHtml(client.industry || "-")}</td></tr>
</table>
<p><strong>Systems to review:</strong></p>
<pre style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:13px;">${escapeHtml(activeSummary)}</pre>
<p>The client email has not been sent yet. It is queued for the real 30-day date.</p>`;
}

export function buildClientCheckinJob({ entityId, client = {}, oldClient = {}, now = new Date() }) {
  if (!shouldScheduleClientCheckin(client, oldClient)) {
    return { skipped: true, reason: "Status did not just change to Live or Active" };
  }

  if (!client.email) {
    return { skipped: true, status: 400, reason: "Client has no email address" };
  }

  const schedule = buildCheckinSchedule(now);
  const activeSystems = getActiveSystems(client);

  return {
    skipped: false,
    schedule,
    activeSystems,
    job: {
      lead_id: entityId,
      client_id: entityId,
      context_type: "Client",
      context_id: entityId,
      job_type: CLIENT_CHECKIN_JOB_TYPE,
      trigger_event: "client_live_30_day_checkin",
      status: "queued",
      scheduled_for: schedule.scheduled_for,
      result_metadata: JSON.stringify({
        client,
        active_systems: activeSystems,
        scheduled_for: schedule.scheduled_for,
        operator_reminder_at: schedule.operator_reminder_at,
      }),
    },
    clientPatch: {
      checkin_30_day_scheduled_for: schedule.scheduled_for,
      checkin_30_day_operator_reminder_at: schedule.operator_reminder_at,
      checkin_30_day_status: "queued",
    },
  };
}
