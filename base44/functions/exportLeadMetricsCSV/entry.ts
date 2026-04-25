import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { resolveClientPortalAccess } from "../_shared/portalOwnership.js";

const MAX_EXPORT_ROWS = 10000;

function escapeCsvCell(value) {
  let str = String(value ?? '');
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      const access = await resolveClientPortalAccess({
        base44,
        userEmail: user.email,
      });
      if (access.status !== 'resolved') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch all leads
    const leads = await base44.asServiceRole.entities.Leads.list('-created_date', MAX_EXPORT_ROWS);

    if (!leads || leads.length === 0) {
      return Response.json({ error: 'No leads to export' }, { status: 400 });
    }

    // Build CSV header
    const headers = [
      'Full Name',
      'Business Name',
      'Email',
      'Phone',
      'Status',
      'Lead Score',
      'Lead Category',
      'Source',
      'Business Type',
      'Created Date',
      'Last Contacted',
      'Reply Sentiment',
    ];

    // Build CSV rows
    const rows = leads.map((lead) => [
      lead.full_name || '',
      lead.business_name || '',
      lead.email || '',
      lead.phone || '',
      lead.status || '',
      lead.lead_score || '0',
      lead.lead_category || '',
      lead.source || '',
      lead.business_type || '',
      lead.created_date ? new Date(lead.created_date).toISOString() : '',
      lead.last_contacted_at ? new Date(lead.last_contacted_at).toISOString() : '',
      lead.reply_sentiment || 'Unknown',
    ]);

    // Add summary section
    const statusCounts = {};
    leads.forEach((lead) => {
      statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
    });

    const summaryRows = [
      [],
      ['CONVERSION METRICS'],
      ['Metric', 'Count'],
      ['Total Leads', leads.length],
      ['Contacted', statusCounts['Contacted'] || 0],
      ['Replied', statusCounts['Replied'] || 0],
      ['Qualified', (statusCounts['Qualified'] || 0) + (statusCounts['Booking Prompt Sent'] || 0)],
      ['Booked', statusCounts['Booked'] || 0],
    ];

    // Combine all rows
    const allRows = [headers, ...rows, ...summaryRows];

    // Convert to CSV string
    const csv = allRows.map((row) =>
      row.map((cell) => escapeCsvCell(cell)).join(',')
    ).join('\n');

    const fileName = `lead-metrics-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
