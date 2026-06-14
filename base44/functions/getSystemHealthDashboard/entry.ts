/**
 * getSystemHealthDashboard — #472
 * Single call returns: Stripe webhook last received, Resend delivery rate,
 * Twilio error rate, active installs, stalled orders, AgentLog errors last 24h.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";

function secureJson(data: Record<string, unknown> = {}, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      ...(init.headers || {}),
    },
  });
}

const UNSAFE_MISSION_CONTROL_KEY_PATTERNS = [
  /email/i,
  /phone/i,
  /message/i,
  /body/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /authorization/i,
  /password/i,
  /private/i,
  /raw[_-]?payload/i,
];

const UNSAFE_MISSION_CONTROL_VALUE_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/i,
  /\bsk_(?:live|test)_[A-Za-z0-9]+/i,
  /\brk_(?:live|test)_[A-Za-z0-9]+/i,
  /\bSG\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /\bAC[a-f0-9]{32}\b/i,
];

function sanitizeMissionControlPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMissionControlPayload(item));
  }
  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (UNSAFE_MISSION_CONTROL_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        // Mission Control is aggregate-only. Drop sensitive keys recursively before anything leaves the bridge.
        continue;
      }
      sanitized[key] = sanitizeMissionControlPayload(child);
    }
    return sanitized;
  }
  if (typeof value === "string" && UNSAFE_MISSION_CONTROL_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    return "[redacted]";
  }
  return value;
}

function assertMissionControlPayloadIsSafe(value: unknown, path = "payload") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertMissionControlPayloadIsSafe(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (UNSAFE_MISSION_CONTROL_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
        throw new Error(`Mission Control payload failed sanitization at ${path}.${key}`);
      }
      assertMissionControlPayloadIsSafe(child, `${path}.${key}`);
    }
    return;
  }
  if (typeof value === "string" && UNSAFE_MISSION_CONTROL_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new Error(`Mission Control payload failed sanitization at ${path}`);
  }
}

function missionControlErrorPayload(message: string) {
  const now = new Date().toISOString();
  return {
    ok: false,
    generated_at: now,
    snapshot_version: "1",
    launch_verdict: { status: "unknown", blocker_count: 1, summary: message },
    readiness_scores: { overall: 0, website: 0, payments: 0, automations: 0, security: 0, proof: 0, provider_readiness: 0 },
    launch_gates: [],
    route_health: [],
    lead_totals: {},
    website_lead_totals: {},
    order_payment_aggregates: {},
    automation_status: {},
    provider_readiness: {},
    proof_links: [],
    public_domain_checks: {},
    timestamps: { last_checked_at: now, source_updated_at: now },
  };
}

function stableMissionControlPayload(payload: any) {
  const now = payload?.generated_at || new Date().toISOString();
  return {
    ok: payload?.ok === true,
    generated_at: now,
    snapshot_version: String(payload?.snapshot_version || "1"),
    launch_verdict: {
      status: payload?.launch_verdict?.status || "unknown",
      blocker_count: Number(payload?.launch_verdict?.blocker_count || 0),
      summary: payload?.launch_verdict?.summary || "No launch verdict summary is available.",
    },
    readiness_scores: {
      overall: Number(payload?.readiness_scores?.overall || 0),
      website: Number(payload?.readiness_scores?.website || 0),
      payments: Number(payload?.readiness_scores?.payments || 0),
      automations: Number(payload?.readiness_scores?.automations || 0),
      security: Number(payload?.readiness_scores?.security || 0),
      proof: Number(payload?.readiness_scores?.proof || 0),
      provider_readiness: Number(payload?.readiness_scores?.provider_readiness || 0),
    },
    launch_gates: Array.isArray(payload?.launch_gates) ? payload.launch_gates : [],
    route_health: Array.isArray(payload?.route_health) ? payload.route_health : [],
    lead_totals: payload?.lead_totals || {},
    website_lead_totals: payload?.website_lead_totals || {},
    order_payment_aggregates: payload?.order_payment_aggregates || {},
    automation_status: payload?.automation_status || {},
    provider_readiness: payload?.provider_readiness || {},
    proof_links: Array.isArray(payload?.proof_links) ? payload.proof_links : [],
    public_domain_checks: payload?.public_domain_checks || {},
    timestamps: {
      last_checked_at: payload?.timestamps?.last_checked_at || now,
      source_updated_at: payload?.timestamps?.source_updated_at || now,
    },
  };
}

const MISSION_CONTROL_DOMAIN = "https://clientsurgesystems.com";
const MISSION_CONTROL_ROUTES = [
  { path: "/", name: "Home" },
  { path: "/book", name: "Book" },
  { path: "/contact", name: "Contact" },
  { path: "/store", name: "Store" },
  { path: "/industries", name: "Industries" },
  { path: "/hvac", name: "HVAC" },
  { path: "/dental", name: "Dental" },
  { path: "/roofing", name: "Roofing" },
  { path: "/plumbing", name: "Plumbing" },
  { path: "/med-spa", name: "Med Spa" },
];

function getMissionControlSecret(req: Request) {
  const headerSecret = req.headers.get("x-mission-control-secret") || "";
  if (headerSecret) return headerSecret;
  try {
    return new URL(req.url).searchParams.get("mission_control_secret") || "";
  } catch {
    return "";
  }
}

function sameSecret(left: string, right: string) {
  if (!left || !right || left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function normalizeMissionControlStatus(status = "") {
  if (["approved", "proof_passed", "waived", "ready", "active", "healthy"].includes(status)) return "ready";
  if (["partial", "ready_for_proof", "proof_running", "in_progress"].includes(status)) return "partial";
  if (["locked", "blocked", "proof_failed", "failed"].includes(status)) return "blocked";
  return "unknown";
}

function countBy(rows: any[], field: string) {
  return rows.reduce((counts: Record<string, number>, row: any) => {
    const key = String(row?.[field] || "unknown");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function score(status: string) {
  if (status === "ready") return 100;
  if (status === "partial") return 50;
  return 0;
}

function aggregateStatus(statuses: string[]) {
  if (!statuses.length) return "unknown";
  if (statuses.every((status) => status === "ready")) return "ready";
  if (statuses.some((status) => status === "blocked")) return "blocked";
  if (statuses.some((status) => status === "partial")) return "partial";
  return "unknown";
}

async function checkMissionControlRoute(route: { path: string; name: string }) {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(`${MISSION_CONTROL_DOMAIN}${route.path}`, { method: "HEAD", redirect: "manual" });
    const ok = res.status >= 200 && res.status < 400;
    return {
      route_path: route.path,
      route_name: route.name,
      status: ok ? "ready" : "blocked",
      http_status: res.status,
      source: "public check",
      last_checked_at: checkedAt,
      notes: ok ? "Public route responded successfully." : `Public route returned HTTP ${res.status}.`,
    };
  } catch {
    return {
      route_path: route.path,
      route_name: route.name,
      status: "unknown",
      http_status: null,
      source: "public check",
      last_checked_at: checkedAt,
      notes: "Public route check failed without exposing request details.",
    };
  }
}

async function checkMissionControlDomain() {
  const checkedAt = new Date().toISOString();
  try {
    const res = await fetch(MISSION_CONTROL_DOMAIN, { method: "GET", redirect: "manual" });
    return {
      domain: "clientsurgesystems.com",
      https_available: true,
      http_status: res.status,
      reachable: res.status >= 200 && res.status < 400,
      security_headers: {
        strict_transport_security: Boolean(res.headers.get("strict-transport-security")),
        content_security_policy: Boolean(res.headers.get("content-security-policy")),
        x_frame_options: Boolean(res.headers.get("x-frame-options")),
        x_content_type_options: Boolean(res.headers.get("x-content-type-options")),
      },
      status: res.status >= 200 && res.status < 400 ? "ready" : "blocked",
      source: "public check",
      last_checked_at: checkedAt,
    };
  } catch {
    return {
      domain: "clientsurgesystems.com",
      https_available: false,
      http_status: null,
      reachable: false,
      security_headers: {},
      status: "unknown",
      source: "public check",
      last_checked_at: checkedAt,
    };
  }
}

async function listEntity(base44: any, entityName: string, sort = "-created_date", limit = 100) {
  return await base44.asServiceRole.entities[entityName]?.list(sort, limit).catch(() => []) || [];
}

async function buildMissionControlSnapshot(base44: any) {
  const generatedAt = new Date().toISOString();
  const [gates, approvals, metrics, websiteLeads, crmLeads, orders, automations, events, routes, domain] = await Promise.all([
    listEntity(base44, "LaunchGate", "gate_name", 100),
    listEntity(base44, "LaunchApproval", "-created_date", 100),
    listEntity(base44, "MetricsSnapshot", "-created_date", 20),
    listEntity(base44, "WebsiteLead", "-created_date", 5000),
    listEntity(base44, "Leads", "-created_date", 5000),
    listEntity(base44, "Order", "-created_date", 1000),
    listEntity(base44, "AutomationChecklist", "-created_date", 500),
    listEntity(base44, "CommunicationEvent", "-created_date", 500),
    Promise.all(MISSION_CONTROL_ROUTES.map(checkMissionControlRoute)),
    checkMissionControlDomain(),
  ]);

  const launchGates = (gates || []).map((gate: any) => ({
    gate_key: gate.gate_key || gate.id || "unknown",
    gate_name: gate.gate_name || "Unnamed gate",
    section_label: gate.section_label || "Launch",
    status: normalizeMissionControlStatus(gate.status),
    source_status: gate.status || "unknown",
    severity: gate.severity || "launch_blocker",
    completion_percent: Number(gate.completion_percent || 0),
    proof_percent: Number(gate.proof_percent || 0),
    current_blocker: gate.current_blocker || "",
    next_action: gate.next_action || "",
    approval_required: Boolean(gate.approval_required),
    last_checked_at: gate.last_checked_at || generatedAt,
    source: "live bridge",
  }));
  const routeStatuses = routes.map((route: any) => route.status);
  const paymentStatuses = (orders || []).map((order: any) =>
    order.payment_status === "paid" || order.order_status === "paid" ? "ready" : order.payment_status ? "partial" : "unknown"
  );
  const automationStatuses = (automations || []).map((item: any) =>
    item.status === "active" ? "ready" : item.status === "in_progress" ? "partial" : item.status === "failed" ? "blocked" : "unknown"
  );
  const providerStatuses = [
    domain.status,
    events.some((event: any) => event.provider === "stripe") ? "partial" : "unknown",
    events.some((event: any) => event.provider === "resend") ? "partial" : "unknown",
    events.some((event: any) => event.provider === "twilio") ? "partial" : "unknown",
  ];
  // Deterministic scoring: unknown and missing coverage score 0 so unavailable evidence never inflates readiness.
  const readiness = {
    website: routeStatuses.length ? score(aggregateStatus(routeStatuses)) : 0,
    payments: paymentStatuses.length ? score(aggregateStatus(paymentStatuses)) : 0,
    automations: automationStatuses.length ? score(aggregateStatus(automationStatuses)) : 0,
    security: domain.status ? score(domain.status) : 0,
    proof: launchGates.length ? average(launchGates.map((gate: any) => Number(gate.proof_percent || 0))) : 0,
    provider_readiness: providerStatuses.length ? score(aggregateStatus(providerStatuses)) : 0,
  };
  const overall = average(Object.values(readiness));
  const blockerCount = launchGates.filter((gate: any) => gate.status === "blocked").length +
    routes.filter((route: any) => route.status === "blocked").length +
    (domain.status === "blocked" ? 1 : 0);
  const launchStatus = blockerCount > 0 ? "blocked" : overall >= 90 ? "ready" : overall > 0 ? "partial" : "unknown";
  const payload = stableMissionControlPayload({
    ok: true,
    generated_at: generatedAt,
    snapshot_version: "1",
    launch_verdict: {
      status: launchStatus,
      blocker_count: blockerCount,
      summary: blockerCount
        ? `${blockerCount} blockers require proof or remediation before launch.`
        : "No blockers detected by the aggregate bridge snapshot. Owner approval is still required.",
    },
    readiness_scores: { overall, ...readiness },
    launch_gates: launchGates,
    route_health: routes,
    lead_totals: { total: crmLeads.length, by_status: countBy(crmLeads, "status"), by_source: countBy(crmLeads, "source"), source: "live bridge", last_checked_at: generatedAt },
    website_lead_totals: { total: websiteLeads.length, by_status: countBy(websiteLeads, "lead_status"), by_source: countBy(websiteLeads, "source"), source: "live bridge", last_checked_at: generatedAt },
    order_payment_aggregates: {
      total_orders: orders.length,
      paid_orders: orders.filter((order: any) => order.payment_status === "paid" || order.order_status === "paid").length,
      pending_orders: orders.filter((order: any) => order.payment_status === "pending" || order.order_status === "pending").length,
      by_payment_status: countBy(orders, "payment_status"),
      source: "live bridge",
      last_checked_at: generatedAt,
    },
    automation_status: { total: automations.length, by_status: countBy(automations, "status"), active: automations.filter((item: any) => item.status === "active").length, source: "live bridge", last_checked_at: generatedAt },
    provider_readiness: {
      base44: { status: "partial", summary: "Base44 bridge responded with aggregate snapshot.", source: "live bridge", last_checked_at: generatedAt },
      cloudflare: { status: domain.status, summary: "Public domain proof only; no Cloudflare configuration was changed.", source: "public check", last_checked_at: generatedAt },
      stripe: { status: providerStatuses[1], summary: "Aggregate payment/order evidence only; no live Stripe action was performed.", source: "live bridge", last_checked_at: generatedAt },
      resend: { status: providerStatuses[2], summary: "Aggregate communication activity only.", source: "live bridge", last_checked_at: generatedAt },
      twilio: { status: providerStatuses[3], summary: "Aggregate communication activity only.", source: "live bridge", last_checked_at: generatedAt },
    },
    proof_links: approvals.slice(0, 25).map((approval: any) => ({
      title: approval.approval_type || approval.action_type || "Launch approval record",
      type: "approval",
      status: approval.status || "unknown",
      verified_at: approval.approved_at || approval.created_date || null,
      source: "live bridge",
    })),
    public_domain_checks: domain,
    timestamps: {
      last_checked_at: generatedAt,
      source_updated_at: [...gates, ...metrics, ...automations, ...orders].map((item: any) => item.updated_date || item.created_date).filter(Boolean).sort().pop() || generatedAt,
    },
  });
  const sanitized = stableMissionControlPayload(sanitizeMissionControlPayload(payload));
  assertMissionControlPayloadIsSafe(sanitized);
  return sanitized;
}

async function countActiveAutomationManifests() {
  try {
    const automationsDir = new URL("../../automations/", import.meta.url);
    let count = 0;
    for await (const entry of Deno.readDir(automationsDir)) {
      if (!entry.isFile || !entry.name.endsWith(".json")) {
        continue;
      }
      const fileUrl = new URL(entry.name, automationsDir);
      const raw = await Deno.readTextFile(fileUrl);
      const manifest = JSON.parse(raw);
      if (manifest?.active === true) {
        count += 1;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    if (url.searchParams.get("mission_control") === "1") {
      const configuredSecret = Deno.env.get("MISSION_CONTROL_BRIDGE_SECRET") || "";
      if (!configuredSecret) {
        return secureJson(missionControlErrorPayload("Mission Control bridge is not configured."), { status: 503 });
      }
      if (!sameSecret(getMissionControlSecret(req), configuredSecret)) {
        return secureJson(missionControlErrorPayload("Mission Control bridge authorization failed."), { status: 403 });
      }
      try {
        return secureJson(await buildMissionControlSnapshot(base44));
      } catch {
        return secureJson(missionControlErrorPayload("Mission Control bridge failed safely. No private details were exposed."), { status: 500 });
      }
    }

    const since24h = new Date(Date.now() - 86400000).toISOString();

    const [orders, logs, communicationEvents, automationRules, activeAutomationManifestCount] = await Promise.all([
      base44.asServiceRole.entities.Order.list().catch(() => []),
      base44.asServiceRole.entities.AgentLog.list().catch(() => []),
      base44.asServiceRole.entities.CommunicationEvent.list().catch(() => []),
      base44.asServiceRole.entities.AutomationRule.list().catch(() => []),
      countActiveAutomationManifests(),
    ]);

    const paidOrders = (orders || []).filter((o: any) => o.payment_status === "paid");
    const stalledOrders = paidOrders.filter((o: any) => {
      if (!o.updated_date) return false;
      const hoursStale = (Date.now() - new Date(o.updated_date).getTime()) / 3600000;
      return hoursStale > 48 && o.workflow_stage !== "Live";
    });

    const recentLogs = (logs || []).filter((l: any) => l.created_date >= since24h);
    const errorLogs = recentLogs.filter((l: any) => l.log_type === "error");
    const unresolvedErrors = errorLogs.filter((l: any) => !l.resolved);
    const sortedEvents = [...(communicationEvents || [])].sort(
      (a: any, b: any) =>
        new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
    );

    const activeInstalls = paidOrders.filter((o: any) => o.workflow_stage !== "Live" && o.workflow_stage !== "Cancelled").length;
    const liveClients = paidOrders.filter((o: any) => o.workflow_stage === "Live").length;
    const pastDue = paidOrders.filter((o: any) => o.billing_status === "past_due").length;
    const ordersInProgress = paidOrders.filter(
      (o: any) => o.workflow_stage && o.workflow_stage !== "Live" && o.workflow_stage !== "Cancelled"
    ).length;
    const lastTwilioSms = sortedEvents.find(
      (event: any) =>
        event.provider === "twilio" &&
        event.channel === "sms" &&
        ["sms_sent", "sms_delivered", "sms_received"].includes(event.event_type)
    );
    const lastResendEmail = sortedEvents.find(
      (event: any) =>
        event.provider === "resend" &&
        event.channel === "email" &&
        ["email_sent", "email_failed"].includes(event.event_type)
    );
    const enabledAutomationRules = (automationRules || []).filter((rule: any) => rule.enabled !== false).length;
    const activeAutomationCount = activeAutomationManifestCount + enabledAutomationRules;

    // Check Stripe webhook last received (look for recent AgentLog entry)
    const stripeLog = (logs || [])
      .filter((l: any) => l.service === "stripe")
      .sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0];

    const health = {
      timestamp: new Date().toISOString(),
      clients: {
        total: paidOrders.length,
        live: liveClients,
        active_installs: activeInstalls,
        orders_in_progress: ordersInProgress,
        stalled: stalledOrders.length,
        past_due: pastDue,
      },
      automations: {
        active_count: activeAutomationCount,
        active_manifest_count: activeAutomationManifestCount,
        enabled_rule_count: enabledAutomationRules,
      },
      errors_24h: { total: errorLogs.length, unresolved: unresolvedErrors.length, services: [...new Set(unresolvedErrors.map((e: any) => e.service))] },
      stripe: { last_webhook: stripeLog?.created_date || null, status: stripeLog ? "receiving" : "unknown" },
      twilio: {
        last_sms_sent: lastTwilioSms?.created_date || null,
        last_event_type: lastTwilioSms?.event_type || null,
      },
      resend: {
        last_email_sent: lastResendEmail?.created_date || null,
        last_event_type: lastResendEmail?.event_type || null,
      },
      overall_status: unresolvedErrors.length > 3 ? "degraded" : stalledOrders.length > 2 ? "warning" : "healthy",
    };

    return secureJson({ success: true, health });
  } catch {
    return secureJson({ success: false, error: "System health dashboard failed safely." }, { status: 500 });
  }
});
