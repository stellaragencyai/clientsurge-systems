const baseUrl = process.env.VERIFY_URL || process.argv.find((arg) => arg.startsWith('--base-url='))?.split('=')[1] || 'https://clientsurgesystems.com';

const GENERATED_DIRECTORY_PATTERNS = [
  /ClientSurge Systems manages \d+ data types/i,
  /data types and \d+ pages/i,
  />\s*Pages\s*</i,
  /organize, track, and share your work in 1 place/i,
];

const INTERNAL_LINK_PATTERN = /href=["']\/(admin|dashboard|client|client-portal|setup|functions|function|internal|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|["'?])/i;

const REQUIRED_PUBLIC_LINKS = ['/pricing', '/automations', '/contact', '/privacy', '/terms'];

async function getText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  return { status: res.status, url: res.url, text };
}

function fail(message) {
  console.error(`PUBLIC_ROUTE_LIVE_AUDIT_FAILED: ${message}`);
  process.exitCode = 1;
}

const target = new URL('/', baseUrl).toString();
const { status, url, text } = await getText(target);
console.log(`Checked ${url} status=${status} bytes=${text.length}`);

if (status < 200 || status >= 400) {
  fail(`home returned HTTP ${status}`);
}

for (const pattern of GENERATED_DIRECTORY_PATTERNS) {
  if (pattern.test(text)) {
    fail(`home contains generated route-directory pattern ${pattern}`);
  }
}

if (INTERNAL_LINK_PATTERN.test(text)) {
  fail('home contains public link to an internal/admin/client/setup route family');
}

for (const link of REQUIRED_PUBLIC_LINKS) {
  if (!text.includes(`href="${link}"`) && !text.includes(`href='${link}'`)) {
    fail(`home is missing expected public link ${link}`);
  }
}

if (!process.exitCode) {
  console.log('PUBLIC_ROUTE_LIVE_AUDIT_PASSED');
}
