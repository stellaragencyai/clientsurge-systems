const DEFAULT_BASE_URL = 'https://clientsurgesystems.com';

const ROUTES = [
  '/',
  '/contact',
  '/book',
  '/start',
  '/product-signup',
  '/opt-out',
  '/pricing',
];

const args = process.argv.slice(2);
const baseArgIndex = args.findIndex((arg) => arg === '--base-url');
const baseUrl = baseArgIndex >= 0 && args[baseArgIndex + 1] ? args[baseArgIndex + 1] : DEFAULT_BASE_URL;
const root = baseUrl.replace(/\/$/, '');

async function checkRoute(route) {
  const url = `${root}${route}`;
  const startedAt = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const elapsedMs = Date.now() - startedAt;
    const contentType = response.headers.get('content-type') || '';
    const text = contentType.includes('text/html') ? await response.text() : '';
    const hasHtml = text.includes('<html') || text.includes('<!doctype html');
    const looksBroken = /base44 app not found|application error|cannot get\s+/i.test(text);

    return {
      route,
      url,
      status: response.status,
      ok: response.ok && (!contentType.includes('text/html') || hasHtml) && !looksBroken,
      elapsedMs,
      contentType,
      finalUrl: response.url,
      reason: response.ok ? (looksBroken ? 'response contains broken-app marker' : '') : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      route,
      url,
      status: 0,
      ok: false,
      elapsedMs: Date.now() - startedAt,
      contentType: '',
      finalUrl: '',
      reason: error.message,
    };
  }
}

async function checkWwwRedirect() {
  const url = 'https://www.clientsurgesystems.com/';
  try {
    const response = await fetch(url, { redirect: 'manual' });
    const location = response.headers.get('location') || '';
    return {
      route: 'www redirect',
      url,
      status: response.status,
      ok: [301, 302, 307, 308].includes(response.status) && location.includes('clientsurgesystems.com'),
      location,
      reason: [301, 302, 307, 308].includes(response.status) ? '' : `Expected redirect, got HTTP ${response.status}`,
    };
  } catch (error) {
    return { route: 'www redirect', url, status: 0, ok: false, location: '', reason: error.message };
  }
}

const routeResults = await Promise.all(ROUTES.map(checkRoute));
const redirectResult = await checkWwwRedirect();
const allResults = [...routeResults, redirectResult];

console.log(`ClientSurge production smoke test: ${root}`);
for (const result of allResults) {
  const label = result.ok ? 'PASS' : 'FAIL';
  const status = result.status || 'ERR';
  const extra = result.reason ? ` — ${result.reason}` : '';
  console.log(`${label.padEnd(4)} ${String(status).padEnd(3)} ${result.route} -> ${result.finalUrl || result.location || result.url}${extra}`);
}

const failed = allResults.filter((result) => !result.ok);
console.log(`Summary: ${allResults.length - failed.length} passed, ${failed.length} failed.`);

if (failed.length > 0) {
  process.exit(1);
}
