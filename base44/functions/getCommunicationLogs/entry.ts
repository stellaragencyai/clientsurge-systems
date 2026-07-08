import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 1000;

function buildCommunicationLogQuery(filter: string) {
  if (filter === 'failed') return { status: 'failed' };
  if (filter === 'unmatched') return { context_type: 'inbound_sms_unmatched' };
  if (filter === 'received') return { event_type: 'sms_received' };
  if (filter === 'email_sent') return { event_type: 'email_sent' };
  if (filter === 'email_failed') return { event_type: 'email_failed' };
  return {};
}

function clampPageSize(value: unknown) {
  const requested = Number(value) || DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(requested, 1), MAX_PAGE_SIZE);
}

function getPage(value: unknown) {
  return Math.max(Number(value) || 0, 0);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const filter = body.filter || 'all';
    const page = getPage(body.page);
    const pageSize = clampPageSize(body.page_size || body.limit);
    const query = buildCommunicationLogQuery(filter);

    // Base44 entity filter in this app is limit-based, so fetch through the requested
    // page plus one extra row to determine hasNextPage without exposing service-role
    // reads directly to the browser.
    const fetchLimit = (page + 1) * pageSize + 1;
    const rows = await base44.asServiceRole.entities.CommunicationEvent.filter(
      query,
      '-created_date',
      fetchLimit
    );

    const start = page * pageSize;
    const logs = (rows || []).slice(start, start + pageSize);
    const hasNextPage = (rows || []).length > start + pageSize;

    return Response.json({
      success: true,
      logs,
      filter,
      page,
      page_size: pageSize,
      returned: logs.length,
      hasNextPage,
    });
  } catch (error: any) {
    console.error('[getCommunicationLogs]', error?.message || error);
    return Response.json(
      {
        success: false,
        error: 'Failed to load communication logs',
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
});
