import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { base_url, source, medium, campaign, content } = body;

    if (!base_url || !source || !medium || !campaign) {
      return Response.json({ error: 'base_url, source, medium, and campaign are required' }, { status: 400 });
    }

    const url = new URL(base_url);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', medium);
    url.searchParams.set('utm_campaign', campaign);
    if (content) url.searchParams.set('utm_content', content);

    return Response.json({ success: true, utm_url: url.toString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});