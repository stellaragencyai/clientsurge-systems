import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Frame-Options': 'DENY',
    },
  });
}

function hasValue(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

async function safeFilter(entity, query, sort = '-created_date', limit = 50) {
  if (!entity?.filter) return [];
  return entity.filter(query, sort, limit).catch(() => []);
}

async function safeGet(entity, id) {
  if (!entity?.get || !hasValue(id)) return null;
  return entity.get(id).catch(() => null);
}

async function auditOrder(base44, order) {
  const entities = base44.asServiceRole.entities;
  const checks = [];

  const clientProject = await safeGet(entities.ClientProject, order.client_project_id);
  const installOSByOrder = await safeFilter(entities.ClientInstallationOS, { order_id: order.id }, '-created_date', 5);
  const installOSByClient = order.client_id
    ? await safeFilter(entities.ClientInstallationOS, { client_id: order.client_id }, '-created_date', 5)
    : [];
  const automationChecklists = await safeFilter(entities.AutomationChecklist, { order_id: order.id }, '-created_date', 20);
  const checklistSteps = await safeFilter(entities.AutomationChecklistStep, { order_id: order.id }, '-created_date', 100);
  const processedPaymentEvents = await safeFilter(entities.CommunicationEvent, {
    order_id: order.id,
    event_type: 'order_paid',
    status: 'processed',
  }, '-created_date', 10);
  const failedEvents = await safeFilter(entities.CommunicationEvent, {
    order_id: order.id,
    status: 'failed',
  }, '-created_date', 20);

  checks.push({
    key: 'client_project_id_present',
    passed: hasValue(order.client_project_id),
    severity: 'critical',
    message: hasValue(order.client_project_id)
      ? 'Order has a linked client_project_id.'
      : 'Paid Order is missing client_project_id.',
  });

  checks.push({
    key: 'client_project_exists',
    passed: Boolean(clientProject?.id),
    severity: 'critical',
    message: clientProject?.id
      ? 'Linked ClientProject exists.'
      : 'Linked ClientProject record could not be found.',
  });

  const installOSCount = installOSByOrder.length || installOSByClient.length;
  checks.push({
    key: 'install_os_exists',
    passed: installOSCount > 0,
    severity: 'critical',
    message: installOSCount > 0
      ? `Found ${installOSCount} ClientInstallationOS record(s).`
      : 'No ClientInstallationOS record found for the paid order/client.',
  });

  checks.push({
    key: 'automation_checklist_exists',
    passed: automationChecklists.length > 0 || checklistSteps.length > 0,
    severity: 'high',
    message: automationChecklists.length > 0 || checklistSteps.length > 0
      ? `Found ${automationChecklists.length} checklist(s) and ${checklistSteps.length} checklist step(s).`
      : 'No AutomationChecklist or AutomationChecklistStep records found.',
  });

  checks.push({
    key: 'processed_payment_event_exists',
    passed: processedPaymentEvents.length > 0,
    severity: 'high',
    message: processedPaymentEvents.length > 0
      ? 'Found processed order_paid CommunicationEvent.'
      : 'No processed order_paid CommunicationEvent found.',
  });

  checks.push({
    key: 'no_failed_events',
    passed: failedEvents.length === 0,
    severity: 'medium',
    message: failedEvents.length === 0
      ? 'No failed CommunicationEvent records found for this order.'
      : `Found ${failedEvents.length} failed CommunicationEvent record(s).`,
  });

  const failedChecks = checks.filter((check) => !check.passed);
  const criticalFailures = failedChecks.filter((check) => check.severity === 'critical');

  return {
    order_id: order.id,
    customer_email: order.customer_email || null,
    business_name: order.business_name || null,
    payment_status: order.payment_status,
    order_status: order.order_status || null,
    client_id: order.client_id || null,
    client_project_id: order.client_project_id || null,
    provisioned: failedChecks.length === 0,
    launch_blocked: criticalFailures.length > 0,
    failed_count: failedChecks.length,
    checks,
  };
}

Deno.serve(async (req) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) {
      return json({ error: 'Method not allowed' }, 405);
    }

    const base44 = createClientFromRequest(req);
    let body = {};
    if (req.method === 'POST') {
      body = await req.json().catch(() => ({}));
    }

    const url = new URL(req.url);
    const orderId = body.order_id || url.searchParams.get('order_id');
    const limit = Math.min(Number(body.limit || url.searchParams.get('limit') || 50), 200);

    let orders = [];
    if (orderId) {
      const order = await safeGet(base44.asServiceRole.entities.Order, orderId);
      if (!order) return json({ error: 'Order not found', order_id: orderId }, 404);
      orders = [order];
    } else {
      orders = await safeFilter(
        base44.asServiceRole.entities.Order,
        { payment_status: 'paid' },
        '-created_date',
        limit,
      );
    }

    const audits = [];
    for (const order of orders || []) {
      audits.push(await auditOrder(base44, order));
    }

    const failing = audits.filter((audit) => !audit.provisioned);
    const critical = audits.filter((audit) => audit.launch_blocked);

    return json({
      success: true,
      audited_count: audits.length,
      passing_count: audits.length - failing.length,
      failing_count: failing.length,
      critical_count: critical.length,
      launch_ready: critical.length === 0 && failing.length === 0,
      audits,
    });
  } catch (error) {
    console.error('[auditPaidOrderProvisioning]', error.message);
    return json({ error: error.message || 'Provisioning audit failed' }, 500);
  }
});
