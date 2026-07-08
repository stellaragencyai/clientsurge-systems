import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { validateSetupLinkToken } from '../_shared/setupLinkToken.ts';
import {
  normalizeInstallConfiguration,
  resolvePackageKey,
  validateInstallConfiguration,
} from '../_shared/setupPayloadContract.ts';

/**
 * saveClientCredentials
 * Called when a client submits /setup/credentials.
 *
 * Hardened guarantees:
 * - Validates against the same visible required fields as the wizard.
 * - Accepts legacy/canonical aliases instead of rejecting valid submissions.
 * - Saves first, then reports readiness blockers separately.
 * - Auto-creates ClientInstallationOS if it is missing.
 * - Creates an AuditLog event for credentials submission.
 * - Enforces setup authorization + signed setup-link/email ownership.
 */

function getAppUrl() {
  return Deno.env.get("APP_URL") || Deno.env.get("VITE_BASE44_APP_BASE_URL") || "https://clientsurgesystems.com";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Frame-Options": "DENY",
      "X-Request-ID": data?.request_id || "",
    },
  });
}

function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function cleanString(value) {
  return String(value || "").trim();
}

function safeStringify(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "null";
  }
}

async function ensureInstallationOS(base44, order, normalizedConfig, requestId) {
  const existing = await base44.asServiceRole.entities.ClientInstallationOS.filter(
    { order_id: order.id },
    "-created_date",
    1
  ).catch(() => []);

  const payload = {
    order_id: order.id,
    client_id: order.client_id || "",
    client_project_id: order.client_project_id || "",
    client_email: order.customer_email,
    business_name: normalizedConfig.brand?.business_name || order.business_name || order.customer_email,
    workflow_stage: "website_building",
    website_status: "not_started",
    activation_status: "not_ready",
    activation_eligible: false,
    missing_requirements: [],
    activation_blockers: [],
    next_required_action: {
      action_type: "configure_integration",
      description: "Review submitted credentials and begin installation setup.",
      estimated_time_minutes: 15,
    },
    integration_readiness: {
      sms_ready: Boolean(normalizedConfig.shared?.twilio_business_phone),
      email_ready: Boolean(normalizedConfig.messaging?.lead_notification_email || normalizedConfig.brand?.business_email),
      booking_link_ready: Boolean(normalizedConfig.messaging?.booking_link),
      lead_form_connected: false,
      webhooks_verified: false,
    },
    checklist_completion_percent: 10,
    admin_notes: `Credentials submitted. request_id=${requestId}`,
    last_readiness_check_at: new Date().toISOString(),
    environment: order.environment || "production",
    dashboard_truth_status: "warning",
    dashboard_truth_notes: "Credentials received; installation proof pending.",
  };

  if (existing?.length > 0) {
    await base44.asServiceRole.entities.ClientInstallationOS.update(existing[0].id, payload)
      .catch((e) => console.warn(`[saveClientCredentials] ClientInstallationOS update failed: ${e.message}`));
    return existing[0].id;
  }

  const created = await base44.asServiceRole.entities.ClientInstallationOS.create(payload)
    .catch((e) => {
      console.warn(`[saveClientCredentials] ClientInstallationOS create failed: ${e.message}`);
      return null;
    });
  return created?.id || null;
}

async function createSubmissionAuditLog(base44, order, normalizedConfig, currentUser, requestId, readiness) {
  await base44.asServiceRole.entities.AuditLog.create({
    admin_email: currentUser?.email || order.customer_email || "system@clientsurgesystems.com",
    action: "credentials_submitted",
    entity_name: "Order",
    record_id: order.id,
    before: safeStringify({ install_configuration_present: Boolean(order.install_configuration), install_configuration_updated_at: order.install_configuration_updated_at || null }),
    after: safeStringify({
      request_id: requestId,
      business_name: normalizedConfig.brand?.business_name || order.business_name,
      client_email: order.customer_email,
      readiness_blockers: readiness?.blockers || [],
      ready_to_activate: Boolean(readiness?.ready_to_activate),
    }),
    timestamp: new Date().toISOString(),
    notes: "Setup credentials submitted through /setup/credentials. Readiness blockers are non-blocking and must be handled in install review.",
  }).catch((e) => console.warn(`[saveClientCredentials] AuditLog create failed: ${e.message}`));
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { order_id, install_configuration, admin_bypass } = body;
    const setupToken = cleanString(body.token || body.setup_token);

    if (!order_id) return json({ error: "order_id required", request_id: requestId }, 400);
    if (!install_configuration) return json({ error: "install_configuration required", request_id: requestId }, 400);

    const currentUser = await base44.auth.me().catch(() => null);
    const requestedAdminBypass = admin_bypass === true;

    if (requestedAdminBypass && !isAdmin(currentUser)) {
      return json({ error: "admin_bypass requires admin role", request_id: requestId }, 403);
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return json({ error: "Order not found", request_id: requestId }, 404);

    const userEmail = cleanEmail(currentUser?.email);
    const orderEmail = cleanEmail(order.customer_email);
    const tokenResult = setupToken ? await validateSetupLinkToken(setupToken, order_id, orderEmail) : { valid: false, reason: "missing_token" };

    if (setupToken && !tokenResult.valid) {
      return json({ error: "This setup link is expired or invalid.", code: tokenResult.reason, request_id: requestId }, 403);
    }

    if (!isAdmin(currentUser) && !tokenResult.valid && userEmail && orderEmail && userEmail !== orderEmail) {
      return json({ error: "This setup link does not belong to the signed-in account.", code: "setup_link_email_mismatch", request_id: requestId }, 403);
    }

    if (!isAdmin(currentUser) && !tokenResult.valid && !userEmail) {
      return json({ error: "Sign in with the order email or use the signed setup link from your confirmation email.", code: "setup_auth_required", request_id: requestId }, 403);
    }

    if (!requestedAdminBypass) {
      const authCheck = await base44.asServiceRole.entities.SetupAuthorization.filter(
        { order_id, authorization_status: "accepted" }, "-created_date", 1
      ).catch(() => []);
      if (!authCheck || authCheck.length === 0) {
        return json({ error: "Setup Authorization Agreement must be accepted before submitting setup data.", code: "authorization_required", request_id: requestId }, 403);
      }
    }

    const pkgKey = resolvePackageKey(order.package_key || order.package_type || order.selected_package_type || order.pricing_summary?.package_key);
    const validationErrors = validateInstallConfiguration(install_configuration, pkgKey, requestedAdminBypass);

    if (validationErrors.length > 0) {
      return json({
        error: `Missing required fields: ${validationErrors.map(e => e.field).join(", ")}`,
        validation_errors: validationErrors,
        request_id: requestId,
      }, 400);
    }

    const normalizedConfig = normalizeInstallConfiguration(install_configuration);
    const previousHandoff = order.purchase_onboarding_handoff || {};

    await base44.asServiceRole.entities.Order.update(order_id, {
      install_configuration: normalizedConfig,
      install_configuration_updated_at: new Date().toISOString(),
      purchase_onboarding_handoff: {
        ...previousHandoff,
        credentials_draft: null,
        credentials_submitted_at: new Date().toISOString(),
        credentials_request_id: requestId,
      },
      pipeline_status: order.pipeline_status === "Live" ? order.pipeline_status : "Ready for Install",
      order_status: order.order_status === "fully_live" ? order.order_status : "paid_setup_in_progress",
    });
    console.log(`[saveClientCredentials] Saved install_configuration for order ${order_id}; request_id=${requestId}`);

    const installationOsId = await ensureInstallationOS(base44, { ...order, id: order_id }, normalizedConfig, requestId);

    let intelligenceResult = null;
    try {
      intelligenceResult = await base44.asServiceRole.functions.invoke("aiOnboardingIntelligence", { order_id });
      console.log(`[saveClientCredentials] pre-flight: ready=${intelligenceResult?.ready_to_activate}, blockers=${intelligenceResult?.blockers?.length || 0}; request_id=${requestId}`);
    } catch (e) {
      intelligenceResult = { ready_to_activate: false, blockers: [`aiOnboardingIntelligence warning: ${e.message}`], auto_filled: [] };
      console.warn(`[saveClientCredentials] aiOnboardingIntelligence warning: ${e.message}; request_id=${requestId}`);
    }

    await createSubmissionAuditLog(base44, { ...order, id: order_id }, normalizedConfig, currentUser, requestId, intelligenceResult);

    try {
      const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "nolan@clientsurgesystems.com";
      const appUrl = getAppUrl();
      const blockers = intelligenceResult?.blockers || [];
      const isReady = intelligenceResult?.ready_to_activate;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: adminEmail,
        from_name: "ClientSurge Systems",
        subject: `✅ Credentials Submitted — ${order.business_name || order.customer_email}`,
        body: `<div style="font-family:sans-serif;max-width:600px;padding:32px 20px;">
          <h2 style="color:#0A1628;">Credentials Submitted</h2>
          <p><strong>${order.business_name}</strong> (${order.customer_email}) completed the setup intake.</p>
          <p><strong>Request ID:</strong> ${requestId}</p>
          <p style="color:${isReady ? "#16a34a" : "#92400e"};font-weight:bold;">
            ${isReady ? "✅ Ready for install review" : "⚠️ Blockers found — review required"}
          </p>
          ${blockers.length > 0 ? `<ul>${blockers.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}
          <a href="${appUrl}/admin/onboarding" style="display:inline-block;background:#0A1628;color:#fff;padding:12px 28px;border-radius:9999px;text-decoration:none;font-weight:600;font-size:14px;">View in Admin →</a>
        </div>`,
      });
    } catch (e) {
      console.warn(`[saveClientCredentials] Admin notification failed: ${e.message}; request_id=${requestId}`);
    }

    return json({
      success: true,
      request_id: requestId,
      installation_os_id: installationOsId,
      ready_to_activate: intelligenceResult?.ready_to_activate || false,
      blockers: intelligenceResult?.blockers || [],
      auto_filled: intelligenceResult?.auto_filled || [],
      redirect_to: `/setup/status/${order_id}`,
    });
  } catch (err) {
    console.error(`[saveClientCredentials] Error: ${err.message}; request_id=${requestId}`);
    return json({ error: err.message, request_id: requestId }, 500);
  }
});
