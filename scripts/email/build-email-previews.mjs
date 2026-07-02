#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'docs/email/previews/generated');
const LOGO_URL = process.env.CLIENTSURGE_EMAIL_LOGO_URL || 'https://clientsurgesystems.com/clientsurge-logo.png';

const T = {
  electric: '#00AEEF',
  deep: '#0088CC',
  navy: '#005691',
  page: '#F7FBFE',
  soft: '#EEF9FF',
  border: '#C9E7FB',
  body: '#262626',
  muted: '#4B5563',
  footerSoft: '#DFF6FF',
};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function logoLockup() {
  const mark = LOGO_URL
    ? `<img src="${esc(LOGO_URL)}" width="46" height="46" alt="ClientSurge Systems" style="display:block;width:46px;height:46px;border:0;border-radius:12px;object-fit:contain;background:#ffffff;" />`
    : `<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,${T.deep},${T.navy});box-shadow:0 8px 22px rgba(0,174,239,0.28);color:#ffffff;font-family:Montserrat,Arial,sans-serif;font-size:15px;line-height:46px;font-weight:900;text-align:center;">CS</div>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="padding:0 12px 0 0;vertical-align:middle;">${mark}</td><td style="vertical-align:middle;"><div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;line-height:29px;font-weight:900;letter-spacing:-0.03em;color:#000000;">ClientSurge <span style="color:${T.electric};">Systems</span></div><div style="margin-top:5px;color:${T.muted};font-size:12px;line-height:17px;font-weight:700;">AI lead-response and booking automation</div></td></tr></table>`;
}

function button(label, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td bgcolor="${T.deep}" style="border-radius:999px;background:linear-gradient(90deg,${T.deep},${T.navy});box-shadow:0 8px 24px rgba(0,121,193,0.36);"><a href="${esc(url)}" style="display:inline-block;padding:15px 23px;color:#ffffff;text-decoration:none;font-size:15px;line-height:20px;font-weight:900;border-radius:999px;">${esc(label)}</a></td></tr></table>`;
}

function card(label, value, accent = false) {
  return `<div style="background:${accent ? T.soft : '#ffffff'};border:1px solid ${T.border};${accent ? `border-left:6px solid ${T.electric};` : ''}border-radius:16px;padding:20px 22px;margin-top:18px;"><div style="color:${T.deep};font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.09em;">${esc(label)}</div><p style="margin:10px 0 0;color:#000000;font-size:15px;line-height:24px;font-weight:800;">${esc(value)}</p></div>`;
}

function metric(label, value, detail) {
  return `<td style="width:33.33%;padding:6px;vertical-align:top;"><div style="background:${T.soft};border:1px solid ${T.border};border-radius:16px;padding:18px 16px;text-align:center;"><div style="font-size:28px;line-height:34px;font-weight:900;color:#000000;">${esc(value)}</div><div style="margin-top:4px;color:${T.deep};font-size:11px;line-height:15px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${esc(label)}</div><div style="margin-top:5px;color:${T.muted};font-size:12px;line-height:17px;font-weight:700;">${esc(detail)}</div></div></td>`;
}

function shell({ badge, title, subtitle, body, footerTitle = 'ClientSurge Systems', footerText = 'Reply to this email or contact support@clientsurgesystems.com. Phoenix, Arizona' }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" /><title>${esc(title)}</title></head><body style="margin:0;padding:0;background:${T.page};color:#000000;font-family:Inter,Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(subtitle)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${T.page};border-collapse:collapse;"><tr><td align="center" style="padding:30px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background:#ffffff;border:1px solid ${T.border};border-radius:18px;overflow:hidden;box-shadow:0 20px 58px rgba(0,136,204,0.16);"><tr><td style="height:7px;background:linear-gradient(90deg,${T.deep},${T.electric},${T.navy});font-size:1px;line-height:1px;">&nbsp;</td></tr><tr><td style="padding:26px 32px 22px;border-bottom:1px solid ${T.border};background:#ffffff;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="vertical-align:middle;">${logoLockup()}</td><td align="right" style="vertical-align:middle;"><span style="display:inline-block;background:${T.soft};color:${T.navy};border:1px solid ${T.border};border-radius:999px;padding:8px 12px;font-size:11px;line-height:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;">${esc(badge)}</span></td></tr></table></td></tr><tr><td style="padding:34px 32px 10px;"><h1 style="margin:0;color:#000000;font-family:Montserrat,Arial,sans-serif;font-size:34px;line-height:40px;font-weight:900;letter-spacing:-0.045em;">${esc(title)}</h1><p style="margin:14px 0 0;color:${T.body};font-size:17px;line-height:27px;font-weight:500;">${esc(subtitle)}</p>${body}</td></tr><tr><td style="padding:30px 32px 32px;"><div style="background:#000000;border-radius:16px;padding:20px 22px;color:#ffffff;box-shadow:0 12px 32px rgba(0,0,0,0.16);"><p style="margin:0;color:#ffffff;font-size:15px;line-height:22px;font-weight:900;">${esc(footerTitle)}</p><p style="margin:8px 0 0;color:${T.footerSoft};font-size:13px;line-height:20px;">${esc(footerText)}</p></div></td></tr></table></td></tr></table></body></html>`;
}

const previews = {
  'weekly-digest.html': shell({
    badge: 'Weekly Digest',
    title: 'Weekly Digest — Monday, July 6, 2026',
    subtitle: 'Your ClientSurge weekly lead, revenue, and pipeline snapshot is ready.',
    body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;"><tr>${metric('New Leads', 18, 'Created this week')}${metric('MRR', '$4,850', 'Paid monthly revenue')}${metric('New Clients', 3, 'Paid orders this week')}</tr></table>${card('Pipeline Summary', 'New: 42 · Contacted: 31 · Replied: 12 · Qualified: 8 · Booked: 5', true)}${button('View Admin Dashboard →', 'https://clientsurgesystems.com/admin')}`,
    footerTitle: 'ClientSurge Systems',
    footerText: 'Automated platform notification. Replies are monitored by ClientSurge Support. Phoenix, Arizona',
  }),
  'monthly-client-report.html': shell({
    badge: 'Monthly Report',
    title: 'July 2026 Performance Summary',
    subtitle: 'Desert Dental Studio — monthly ClientSurge automation report.',
    body: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;"><tr>${metric('Days Live', 31, 'Automation runtime')}${metric('Systems Running', 5, 'Active automations')}${metric('Status', 'Live', 'Production system')}</tr></table>${card('Active Automation Systems', 'Instant Lead Response · Missed Call Text-Back · AI Lead Follow-Up · Appointment Booking · End-to-End QA Verified', true)}${card('Recommended next step', 'Reply to this report if you want to tune next month’s automation strategy.')}${button('Open Client Portal →', 'https://clientsurgesystems.com/client-portal')}`,
    footerTitle: 'Nolan Strommer · Founder, ClientSurge Systems',
    footerText: 'Helping businesses automate lead response, booking, and customer communication. nolan@clientsurgesystems.com',
  }),
  'missing-credentials-alert.html': shell({
    badge: 'Action Needed',
    title: 'Your system is ready — we need final setup details.',
    subtitle: 'Complete the secure credentials step so we can activate your ClientSurge system.',
    body: `${card('Status', 'Your ClientSurge AI system is built and ready to activate. We are only waiting on the final setup details.', true)}${card('What we need', 'Complete the secure credentials form inside your ClientSurge setup page. Do not send passwords or private access details by email.')}${card('Time Required', 'This should take about 2 minutes.')}${button('Complete My Setup →', 'https://clientsurgesystems.com/setup/credentials?order_id=preview')}`,
    footerTitle: 'ClientSurge Support',
    footerText: 'Helping your AI systems run flawlessly. support@clientsurgesystems.com · Phoenix, Arizona',
  }),
  'direct-follow-up.html': shell({
    badge: 'Follow Up',
    title: 'Quick follow-up on your ClientSurge inquiry.',
    subtitle: 'A faster response system can help stop good leads from slipping through the cracks.',
    body: `${card('Why this matters', 'Most lost opportunities are not lost because the business is bad. They are lost because response time, follow-up, or booking handoff is too slow.', true)}${card('No pressure', 'If now is not the right time, no problem. If it is, reply here and we will help you identify the highest-leverage automation first.')}${button('View ClientSurge Systems →', 'https://clientsurgesystems.com')}`,
    footerTitle: 'ClientSurge Sales',
    footerText: 'Questions about packages or setup? Reply here and the ClientSurge team will help.',
  }),
  'nurture-step-1.html': shell({
    badge: 'Lead Automation',
    title: 'Welcome to the ClientSurge automation series.',
    subtitle: 'Over the next 30 days, we will show what better lead response and follow-up could mean for your business.',
    body: `${card('Why this matters', 'Most service businesses lose leads because response time, follow-up, or booking handoff is too slow.', true)}${card('What you will get', 'Real examples, practical tips, and clear ways to spot where your business may be losing revenue.')}${button('See What This Could Look Like →', 'https://clientsurgesystems.com')}`,
    footerTitle: 'ClientSurge Sales',
    footerText: 'Reply unsubscribe to stop receiving nurture emails.',
  }),
};

await mkdir(OUT_DIR, { recursive: true });
for (const [filename, html] of Object.entries(previews)) {
  await writeFile(path.join(OUT_DIR, filename), html, 'utf8');
}

const index = `# Generated Email Previews\n\nGenerated by \`npm run email:build-previews\`.\n\n${Object.keys(previews).map((file) => `- [${file}](./generated/${file})`).join('\n')}\n`;
await writeFile(path.join(process.cwd(), 'docs/email/previews/README.md'), index, 'utf8');
console.log(`Generated ${Object.keys(previews).length} email previews in ${path.relative(process.cwd(), OUT_DIR)}`);
