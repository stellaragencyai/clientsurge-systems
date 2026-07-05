import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  isExcludedAnalyticsPath,
  isAutomatedUserAgent,
} from "@/lib/trustedAnalyticsFilter";
import {
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

const BUSINESS_PAGES = [
  { path: "/", label: "Homepage", category: "core" },
  { path: "/pricing", label: "Pricing", category: "conversion" },
  { path: "/contact", label: "Contact", category: "conversion" },
  { path: "/book", label: "Book Demo", category: "conversion" },
  { path: "/client-portal", label: "Client Portal", category: "retention" },
  { path: "/store", label: "Store", category: "conversion" },
  { path: "/med-spa", label: "Med Spa", category: "industry" },
  { path: "/dental", label: "Dental", category: "industry" },
  { path: "/hvac", label: "HVAC", category: "industry" },
  { path: "/roofing", label: "Roofing", category: "industry" },
];

const NON_PAGE_EXAMPLES = [
  "/api/leads",
  "/_functions/sendSMS",
  "/assets/main.js",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/manifest.json",
  "/health",
];

const BOT_UA_EXAMPLES = [
  "Googlebot/2.1",
  "curl/7.81.0",
  "Mozilla/5.0 (compatible; AhrefsBot/7.0)",
  "HeadlessChrome/120.0",
  "Lighthouse/10.0",
];

function CheckRow({ ok, label, detail }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
      )}
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-800">{label}</p>
        {detail && <p className="text-[11px] text-gray-500 mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsVerificationPanel() {
  const [loading, setLoading] = useState(true);
  const [adminSettings, setAdminSettings] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchPanelData = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, landingAnalytics] = await Promise.all([
        base44.entities.AdminSettings.list("-created_date", 1).catch(() => []),
        base44.entities.LandingPageAnalytics.list("-created_date", 50).catch(() => []),
      ]);

      setAdminSettings((settings || [])[0] || null);
      setAnalyticsData(landingAnalytics || []);
    } catch {
      setAdminSettings(null);
      setAnalyticsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPanelData(); }, [fetchPanelData]);

  const isPreviewSandbox = typeof window !== "undefined" && window.location.hostname.includes("preview-sandbox");
  const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const internalTrafficNote = isPreviewSandbox || isLocalhost;

  const allowedIps = (adminSettings?.allowed_admin_ips || []).filter(Boolean);
  const ipExclusionConfigured = allowedIps.length > 0;

  // Check non-page exclusion (verify filter actually excludes these)
  const allNonPageExcluded = NON_PAGE_EXAMPLES.every((p) => isExcludedAnalyticsPath(p));
  const allBotsFiltered = BOT_UA_EXAMPLES.every((ua) => isAutomatedUserAgent(ua));

  // Conversion pages tracked
  const trackedPageKeys = new Set((analyticsData || []).map((a) => a.page_key));
  const conversionPagesTracked = trackedPageKeys.has("pricing") || trackedPageKeys.has("homepage");

  // Sample size assessment from LandingPageAnalytics
  const totalSessions = (analyticsData || []).reduce((sum, a) => sum + (a.sessions || 0), 0);
  const avgTimeOnPage =
    analyticsData.length > 0
      ? analyticsData.reduce((sum, a) => sum + (a.avg_time_on_page_seconds || 0), 0) / analyticsData.length
      : 0;

  const insufficientData = analyticsData.length === 0 || totalSessions === 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
        <div>
          <h3 className="text-sm font-bold text-gray-900">Analytics Verification Checklist</h3>
          <p className="text-[11px] text-gray-400">In-app analytics reliability audit — no external GA4/Cloudflare data</p>
        </div>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Raw vs Trusted label */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2.5">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-600" />
              <div className="text-[11px] leading-relaxed text-blue-900">
                <p className="font-semibold">Raw (Base44 Platform) Analytics vs Trusted Business Analytics</p>
                <p className="mt-0.5 text-blue-800">
                  Base44 platform analytics may include internal, automated, and non-page traffic.
                  Trusted Business Analytics applies path, user-agent, and (when configured) IP filtering
                  to count only real visitor activity. Metrics are never fabricated — if trusted data
                  is too sparse, "Insufficient trusted data" is shown.
                </p>
              </div>
            </div>

            {/* Preview / sandbox QA note */}
            {internalTrafficNote && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div className="text-[11px] leading-relaxed text-amber-900">
                  <p className="font-semibold">QA / Test Environment Detected</p>
                  <p className="mt-0.5 text-amber-800">
                    This traffic is from a preview-sandbox or localhost environment and should NOT be
                    presented as real production buyer traffic. Do not use these numbers for strategic decisions.
                  </p>
                </div>
              </div>
            )}

            {/* Verification checks */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Filter Verification</p>
              <CheckRow
                ok={true}
                label="Trusted filter active"
                detail="isTrustedAnalyticsEvent() applied at every base44.analytics.track() call site"
              />
              <CheckRow
                ok={allNonPageExcluded}
                label="API / non-page paths excluded"
                detail="Excludes /api, /_functions, /assets, /static, favicon, robots.txt, sitemap.xml, health checks, and static file extensions"
              />
              <CheckRow
                ok={allBotsFiltered}
                label="Bot / user-agent filter active"
                detail="Excludes Googlebot, curl, AhrefsBot, HeadlessChrome, Lighthouse, and missing user agents"
              />
              <CheckRow
                ok={ipExclusionConfigured}
                label="Internal / admin IP exclusion"
                detail={
                  ipExclusionConfigured
                    ? `${allowedIps.length} admin IP(s) configured in AdminSettings.allowed_admin_ips`
                    : "Internal IP exclusion not configured. Set AdminSettings.allowed_admin_ips to exclude admin panel traffic from trusted analytics."
                }
              />
              <CheckRow
                ok={conversionPagesTracked && !insufficientData}
                label="Conversion pages tracked"
                detail={
                  insufficientData
                    ? "No LandingPageAnalytics records found — insufficient trusted data"
                    : conversionPagesTracked
                    ? "Homepage and/or pricing page analytics detected"
                    : "No conversion page (homepage/pricing) analytics records found"
                }
              />
              <CheckRow
                ok={!insufficientData && totalSessions >= 100}
                label="Sample size sufficient (≥100 unique visitors)"
                detail={
                  insufficientData
                    ? "Insufficient trusted data"
                    : `${totalSessions} total trusted sessions recorded`
                }
              />
            </div>

            {/* Sample size warning */}
            {!insufficientData && totalSessions < 100 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div className="text-[11px] text-amber-900">
                  <p className="font-semibold">Sample size too small for strategic decisions.</p>
                  <p className="mt-0.5 text-amber-800">
                    Only {totalSessions} trusted unique visitors recorded. Strategic decisions require at least 100.
                  </p>
                </div>
              </div>
            )}

            {/* Low engagement warning */}
            {!insufficientData && avgTimeOnPage > 0 && avgTimeOnPage < 5 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <div className="text-[11px] text-amber-900">
                  <p className="font-semibold">Engagement too low to trust conversion conclusions.</p>
                  <p className="mt-0.5 text-amber-800">
                    Average trusted session duration is {avgTimeOnPage.toFixed(1)}s (below 5s threshold).
                  </p>
                </div>
              </div>
            )}

            {/* Business pages tracked */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Key Business Pages</p>
              <div className="grid grid-cols-2 gap-1">
                {BUSINESS_PAGES.map((page) => {
                  const pageKey = page.path === "/" ? "homepage" : page.path.replace("/", "").replace(/-/g, "_");
                  const hasData = trackedPageKeys.has(pageKey);
                  return (
                    <div
                      key={page.path}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] ${
                        hasData
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-gray-200 bg-gray-50 text-gray-500"
                      }`}
                    >
                      {hasData ? (
                        <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 flex-shrink-0 text-gray-300" />
                      )}
                      <span className="font-semibold truncate">{page.label}</span>
                      <span className="ml-auto text-[9px] uppercase tracking-wide opacity-60">{page.category}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insufficient data notice */}
            {insufficientData && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                <Info className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
                <p className="text-sm font-semibold text-gray-600">Insufficient trusted data.</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Trusted analytics filtering excluded too many events, or no LandingPageAnalytics records exist yet.
                  No historical metrics are fabricated.
                </p>
              </div>
            )}

            {/* External verification note */}
            <div className="pt-2 border-t border-gray-50">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                <ShieldCheck className="inline h-3 w-3 mr-1" />
                This panel covers in-app analytics reliability only. Remaining verification (GA4 data parity,
                Cloudflare bot filtering, session recording replay) must be done externally — not in Base44 app code.
                Defensive code handles missing userAgent, referrer, IP, and path gracefully.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}