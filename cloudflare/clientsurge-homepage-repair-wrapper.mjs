import edgeWorker from "./clientsurge-security-edge-worker.mjs";

const REPAIR_HEADER = "x-clientsurge-homepage-repair";
const REPAIR_VERSION = "2026-07-01T03-00Z-force-clean-homepage";

const CLEAN_HOMEPAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="index,follow" />
  <meta name="description" content="ClientSurge Systems installs AI automation for local service businesses: lead capture, missed-call recovery, AI follow-up, booking automation, reviews, and lead reactivation." />
  <link rel="canonical" href="https://clientsurgesystems.com/" />
  <title>ClientSurge Systems | AI Automation for Local Businesses</title>
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#07111f;background:#f7fbff}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 20% 10%,rgba(0,174,239,.14),transparent 35%),linear-gradient(135deg,#f7fbff 0%,#fff 48%,#eef8ff 100%)}.shell{width:min(1120px,calc(100% - 32px));margin:0 auto}header,footer{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:24px 0}.brand{color:#07111f;font-weight:950;letter-spacing:-.04em;text-decoration:none;font-size:21px}nav{display:flex;flex-wrap:wrap;gap:14px}a{color:#075985;font-weight:800;text-decoration:none}.hero{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(280px,.92fr);gap:42px;align-items:center;padding:clamp(56px,8vw,96px) 0 clamp(44px,7vw,72px)}.eyebrow{margin:0 0 14px;color:#0079cc;font-size:13px;font-weight:950;letter-spacing:.15em;text-transform:uppercase}h1{margin:0;max-width:820px;font-size:clamp(42px,7vw,82px);line-height:.94;letter-spacing:-.07em}.lede{max-width:760px;margin:22px 0 0;color:#475569;font-size:clamp(18px,2vw,22px);line-height:1.65}.actions,.bullets{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;border-radius:999px;padding:0 22px;background:linear-gradient(135deg,#003b8f,#00aeef);color:#fff!important;font-weight:900;text-decoration:none!important}.button.secondary{background:#fff;color:#0f172a!important;border:1px solid #cbd5e1}.bullets span,.panel{border:1px solid #dbe7e4;background:rgba(255,255,255,.92)}.bullets span{border-radius:999px;padding:8px 12px;color:#334155;font-size:14px;font-weight:700}.panel{border-radius:28px;padding:30px;box-shadow:0 24px 70px rgba(15,23,42,.12)}.panel h2{margin:0 0 14px;color:#0f172a;font-size:30px;letter-spacing:-.045em}.panel p,footer p{color:#475569;line-height:1.65}ul{margin:18px 0 0;padding:0;list-style:none;display:grid;gap:12px;color:#334155}li strong{color:#0f172a}@media(max-width:820px){header,footer,.hero{display:block}nav{margin-top:16px}.hero{padding-top:42px}.panel{margin-top:28px}}
  </style>
</head>
<body>
  <main class="shell" aria-label="ClientSurge Systems homepage">
    <header>
      <a class="brand" href="/">ClientSurge Systems</a>
      <nav aria-label="Public navigation"><a href="/pricing">Pricing</a><a href="/automations">Automations</a><a href="/contact">Contact</a></nav>
    </header>
    <section class="hero" aria-labelledby="home-heading">
      <div>
        <p class="eyebrow">Automate Your Lead Flow</p>
        <h1 id="home-heading">Capture. Follow Up. Book.</h1>
        <p class="lede">ClientSurge installs AI automation systems for local service businesses that need faster lead response, missed-call recovery, follow-up, booking, reviews, and reactivation.</p>
        <div class="actions"><a class="button" href="/pricing">Compare Packages</a><a class="button secondary" href="/contact">Start With Contact</a></div>
        <div class="bullets" aria-label="Key automations"><span>Lead capture</span><span>Missed-call recovery</span><span>AI follow-up</span><span>Booking automation</span><span>Review requests</span><span>Lead reactivation</span></div>
      </div>
      <aside class="panel" aria-label="ClientSurge packages">
        <h2>Starter, Growth, and Pro</h2>
        <p>Clear AI automation packages for local service businesses that cannot afford to lose leads to slow response.</p>
        <ul><li><strong>Starter System:</strong> $797 setup + $497/month.</li><li><strong>Growth System:</strong> $1,297 setup + $997/month.</li><li><strong>Pro System:</strong> $2,497 setup + $1,997/month.</li></ul>
      </aside>
    </section>
    <footer><p>ClientSurge Systems builds AI automation systems for local service businesses.</p><nav aria-label="Legal navigation"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/sms-terms">SMS Terms</a><a href="/refund-policy">Refund Policy</a></nav></footer>
  </main>
</body>
</html>`;

function isHomepageRequest(request) {
  const url = new URL(request.url);
  return request.method === "GET" && (url.pathname === "/" || url.pathname === "");
}

function cleanHomepageResponse() {
  const headers = new Headers();
  headers.set(REPAIR_HEADER, REPAIR_VERSION);
  headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("X-Robots-Tag", "index, follow");
  return new Response(CLEAN_HOMEPAGE, { status: 200, statusText: "OK", headers });
}

export default {
  async fetch(request, env, ctx) {
    if (isHomepageRequest(request)) return cleanHomepageResponse();
    return edgeWorker.fetch(request, env, ctx);
  },
};
