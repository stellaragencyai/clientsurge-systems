import { secureJson } from "../_shared/response.ts";
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

function buildEmailHtml({ project, leads, buildSteps, weekStart, weekEnd }) {
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => {
    const d = new Date(l.created_date);
    return d >= weekStart && d <= weekEnd;
  }).length;
  const booked = leads.filter(l => l.status === 'Booked').length;
  const qualified = leads.filter(l => l.status === 'Qualified').length;
  const contacted = leads.filter(l => ['Contacted','Replied','Qualified','Booking Prompt Sent','Booked'].includes(l.status)).length;

  const completedSteps = buildSteps.filter(s => s.complete).length;
  const totalSteps = buildSteps.length;
  const progressPct = Math.round((completedSteps / totalSteps) * 100);

  const stepRows = buildSteps.map(s => `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:#374151;">${s.label}</td>
      <td style="padding:8px 12px;text-align:center;">
        <span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;
          background:${s.complete ? '#d1fae5' : s.inProgress ? '#fef3c7' : '#f3f4f6'};
          color:${s.complete ? '#065f46' : s.inProgress ? '#92400e' : '#6b7280'};">
          ${s.complete ? '✓ Complete' : s.inProgress ? '⟳ In Progress' : 'Pending'}
        </span>
      </td>
    </tr>
  `).join('');

  const statusBreakdown = ['New','Contacted','Replied','Qualified','Booking Prompt Sent','Booked','Closed']
    .map(status => {
      const count = leads.filter(l => l.status === status).length;
      if (!count) return '';
      const pct = Math.round((count / Math.max(totalLeads, 1)) * 100);
      return `
        <tr>
          <td style="padding:6px 12px;font-size:13px;color:#374151;">${status}</td>
          <td style="padding:6px 12px;">
            <div style="background:#f3f4f6;border-radius:4px;height:8px;width:180px;display:inline-block;vertical-align:middle;">
              <div style="background:linear-gradient(90deg,#7a4825,#c8965c);height:8px;border-radius:4px;width:${pct}%;"></div>
            </div>
          </td>
          <td style="padding:6px 12px;font-size:13px;font-weight:700;color:#111827;">${count}</td>
        </tr>
      `;
    }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#f9fafb;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 60%,#c8965c 100%);padding:32px 40px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:rgba(253,230,138,0.8);letter-spacing:2px;text-transform:uppercase;">Weekly Performance Report</p>
                <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;">${project.business_name}</h1>
                <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.7);">
                  Week of ${weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${weekEnd.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                </p>
              </td>
            </tr>

            <!-- Stats Row -->
            <tr>
              <td style="background:#fff;padding:32px 40px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    ${[
                      { label: 'Total Leads', value: totalLeads, color: '#1d4ed8', bg: '#eff6ff' },
                      { label: 'New This Week', value: newLeads, color: '#7c3aed', bg: '#f5f3ff' },
                      { label: 'Qualified', value: qualified, color: '#b45309', bg: '#fef3c7' },
                      { label: 'Booked', value: booked, color: '#065f46', bg: '#d1fae5' },
                    ].map(s => `
                      <td align="center" style="padding:0 6px;">
                        <div style="background:${s.bg};border-radius:12px;padding:16px 8px;text-align:center;">
                          <p style="margin:0;font-size:28px;font-weight:800;color:${s.color};">${s.value}</p>
                          <p style="margin:4px 0 0;font-size:10px;font-weight:700;color:${s.color};opacity:0.7;text-transform:uppercase;letter-spacing:1px;">${s.label}</p>
                        </div>
                      </td>
                    `).join('')}
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Build Progress -->
            <tr>
              <td style="background:#fff;padding:0 40px 32px;">
                <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">System Build Progress</h2>
                <div style="background:#f3f4f6;border-radius:8px;height:12px;margin-bottom:8px;overflow:hidden;">
                  <div style="background:linear-gradient(90deg,#7a4825,#c8965c);height:12px;width:${progressPct}%;border-radius:8px;"></div>
                </div>
                <p style="margin:0 0 20px;font-size:12px;color:#6b7280;">${completedSteps} of ${totalSteps} steps complete (${progressPct}%)</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                  <thead>
                    <tr style="background:#f9fafb;">
                      <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Step</th>
                      <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Status</th>
                    </tr>
                  </thead>
                  <tbody>${stepRows}</tbody>
                </table>
              </td>
            </tr>

            <!-- Pipeline Breakdown -->
            <tr>
              <td style="background:#fff;padding:0 40px 32px;border-top:1px solid #f3f4f6;">
                <h2 style="margin:20px 0 16px;font-size:16px;font-weight:700;color:#111827;">Lead Pipeline Breakdown</h2>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tbody>${statusBreakdown || '<tr><td style="padding:12px;color:#6b7280;font-size:13px;">No leads in pipeline yet.</td></tr>'}</tbody>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                  This report was automatically generated by <strong style="color:#9a5c2e;">ClientSurge Systems</strong>.<br>
                  Log in to your <a href="#" style="color:#9a5c2e;">client portal</a> for full details.
                </p>
              </td>
            </tr>

          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;
}

const BUILD_STEPS = [
  { key: 'step_onboarding', label: 'Onboarding Form' },
  { key: 'step_payment', label: 'Payment Confirmed' },
  { key: 'step_system_setup', label: 'System Setup' },
  { key: 'step_sms', label: 'SMS Connected' },
  { key: 'step_email', label: 'Email Connected' },
  { key: 'step_booking', label: 'Booking Flow Setup' },
  { key: 'step_followup', label: 'Follow-Up Setup' },
  { key: 'step_live', label: 'System Live' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Allow admin or scheduled automation to trigger
    const { project_id, send_email = true } = body;

    let projects = [];
    if (project_id) {
      const p = await base44.asServiceRole.entities.ClientProject.filter({ id: project_id });
      projects = p || [];
    } else {
      projects = await base44.asServiceRole.entities.ClientProject.list('-created_date', 200);
    }

    if (!projects.length) return secureJson({ error: 'No projects found' }, { status: 404 });

    const weekEnd = new Date();
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const results = [];

    for (const project of projects) {
      const clientEmail = project.client_email;
      if (!clientEmail) continue;

      // Fetch leads for this client
      const leads = await base44.asServiceRole.entities.Leads.filter(
        { created_by: clientEmail }, '-created_date', 500
      );

      const buildSteps = BUILD_STEPS.map(s => ({
        label: s.label,
        complete: project[s.key] === 'complete',
        inProgress: project[s.key] === 'in_progress',
      }));

      const newLeadsCount = leads.filter(l => {
        const d = new Date(l.created_date);
        return d >= weekStart && d <= weekEnd;
      }).length;

      const reportData = {
        project_name: project.business_name,
        client_email: clientEmail,
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        total_leads: leads.length,
        new_leads_this_week: newLeadsCount,
        booked: leads.filter(l => l.status === 'Booked').length,
        qualified: leads.filter(l => l.status === 'Qualified').length,
        contacted: leads.filter(l => ['Contacted','Replied','Qualified','Booking Prompt Sent','Booked'].includes(l.status)).length,
        build_progress_pct: Math.round((buildSteps.filter(s => s.complete).length / buildSteps.length) * 100),
        generated_at: new Date().toISOString(),
      };

      if (send_email) {
        const html = buildEmailHtml({ project, leads, buildSteps, weekStart, weekEnd });
        const emailResult = await resend.emails.send({
          from: `ClientSurge Systems <${Deno.env.get('RESEND_FROM_EMAIL') || 'reports@clientsurgesystems.com'}>`,
          to: clientEmail,
          subject: `📊 Weekly Report — ${project.business_name} (${weekStart.toLocaleDateString('en-US',{month:'short',day:'numeric'})}–${weekEnd.toLocaleDateString('en-US',{month:'short',day:'numeric'})})`,
          html,
        });
        reportData.email_sent = !emailResult.error;
        reportData.email_error = emailResult.error?.message || null;
        console.log(`[generateWeeklyReport] Report sent to ${clientEmail}:`, emailResult.error || 'OK');
      }

      results.push(reportData);
    }

    return secureJson({ success: true, reports: results, count: results.length });
  } catch (error) {
    console.error('[generateWeeklyReport] generateWeeklyReport error:', error);
    return secureJson({ error: error.message }, { status: 500 });
  }
});