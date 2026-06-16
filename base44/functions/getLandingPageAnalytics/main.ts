import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Service landing page paths to monitor
const SERVICE_PATHS = [
  '/med-spa',
  '/dental',
  '/chiropractic',
  '/hvac',
  '/plumbing',
  '/roofing',
  '/contractors',
  '/real-estate',
  '/personal-injury',
  '/lead-capture-automation',
  '/missed-call-text-back',
  '/ai-lead-follow-up',
  '/appointment-booking-automation',
  '/review-automation',
  '/customer-reactivation',
  '/pricing',
  '/store',
  '/automations',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    // First, get the GA4 property list
    const propertiesRes = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const propertiesData = await propertiesRes.json();

    if (!propertiesRes.ok) {
      console.error('GA properties error:', JSON.stringify(propertiesData));
      return Response.json({ error: 'Failed to fetch GA properties', details: propertiesData }, { status: 500 });
    }

    // accountSummaries returns accounts with propertySummaries nested
    const allProperties = [];
    for (const account of (propertiesData.accountSummaries || [])) {
      for (const prop of (account.propertySummaries || [])) {
        allProperties.push({ name: prop.property, displayName: prop.displayName });
      }
    }

    if (allProperties.length === 0) {
      return Response.json({ error: 'No GA4 properties found. Make sure your Google account has a GA4 property.' }, { status: 404 });
    }

    // Use first property (or parse from request body)
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const propertyId = body.propertyId || allProperties[0].name.replace('properties/', '');
    const days = body.days || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Run GA4 Data API report for service landing pages
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: startDateStr, endDate: 'today' }],
          dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
          metrics: [
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
          ],
          dimensionFilter: {
            orGroup: {
              expressions: SERVICE_PATHS.map((path) => ({
                filter: {
                  fieldName: 'pagePath',
                  stringFilter: { matchType: 'BEGINS_WITH', value: path },
                },
              })),
            },
          },
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 50,
        }),
      }
    );

    const reportData = await reportRes.json();

    if (!reportRes.ok) {
      console.error('GA report error:', JSON.stringify(reportData));
      return Response.json({ error: 'Failed to fetch analytics report', details: reportData }, { status: 500 });
    }

    // Parse rows
    const rows = (reportData.rows || []).map((row) => ({
      pagePath: row.dimensionValues[0].value,
      pageTitle: row.dimensionValues[1].value,
      sessions: parseInt(row.metricValues[0].value || '0'),
      pageViews: parseInt(row.metricValues[1].value || '0'),
      bounceRate: parseFloat(row.metricValues[2].value || '0'),
      avgSessionDuration: parseFloat(row.metricValues[3].value || '0'),
      conversions: parseInt(row.metricValues[4].value || '0'),
    }));

    // Also get totals
    const totalSessions = rows.reduce((sum, r) => sum + r.sessions, 0);
    const totalPageViews = rows.reduce((sum, r) => sum + r.pageViews, 0);
    const totalConversions = rows.reduce((sum, r) => sum + r.conversions, 0);

    return Response.json({
      properties: allProperties.map((p) => ({ id: p.name.replace('properties/', ''), name: p.displayName })),
      propertyId,
      days,
      rows,
      totals: { sessions: totalSessions, pageViews: totalPageViews, conversions: totalConversions },
    });
  } catch (error) {
    console.error('getLandingPageAnalytics error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});