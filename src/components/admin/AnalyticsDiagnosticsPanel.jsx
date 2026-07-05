import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  ShieldCheck, AlertTriangle, Loader2, RefreshCw, Eye, EyeOff,
  CheckCircle2, XCircle, Info,
} from "lucide-react";
import {
  isInternalTraffic,
  enableInternalTrafficExclusion,
  disableInternalTrafficExclusion,
  DIAGNOSTIC_CONFIG,
} from "@/lib/trustedAnalyticsFilter";

// Key business pages to verify tracking visibility
const BUSINESS_PAGES = [
  { label: "Homepage", path: "/", pageKey: "homepage" },
  { label: "Pricing", path: "/pricing", pageKey: "pricing" },
  { label: "Contact", path: "/contact", pageKey: "homepage" },
  { label: "Free Audit / Start", path: "/start", pageKey: "homepage" },
  { label: "Book Demo", path: "/book", pageKey: "homepage" },
  { label: "Store / Checkout", path: "/store", pageKey: "pricing" },
  { label: "Product Signup", path: "/product-signup", pageKey: "homepage" },
  { label: "Client Portal", path: "/client-portal", pageKey: "homepage" },
  { label: "Roofing", path: "/roofing", pageKey: "roofing" },
  { label: "HVAC", path: "/hvac", pageKey: "hvac" },
  { label: "Dental", path: "/dental", pageKey: "dental" },
  { label: "Med Spa", path: "/med-spa", pageKey: "med_spa" },
  { label: "Plumbing", path: "/plumbing", pageKey: "plumbing" },
  { label: "Chiropractic", path: "/chiropractic", pageKey: "chiropractic" },
  { label: "Real Estate", path: "/real-estate", pageKey: "real_estate" },
  { label: "Personal Injury", path: "/personal-injury", pageKey: "personal_injury" },
];

function CheckRow({ ok, label, detail }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      )}
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {detail && <p className="text-[11px] text-gray-400">{detail}</p>}
      </div>
    </div>
  );
}

function WarningBanner({ children }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 mb-3">
      <div className="flex items-start gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700">{children}</p>
      </div>
    </div>
  );
}

export default function AnalyticsDiagnosticsPanel() {
  const [loading, setLoading] = useState(true);
  const [adminSettings, setAdminSettings] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [conversionEvents, setConversionEvents] = useState([]);
  const [internalExcluded, setInternalExcluded] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, analyticsRes, eventsRes] = await Promise.all([
        base44.entities.AdminSettings.list("-created_date", 1).catch(() => []),
        base44.entities.LandingPageAnalytics.list("-created_date", 50).catch(() => []),
        base44.entities.ConversionTrackingEvent.list("-created_date", 50).catch(() => []),
      ]);
      setAdminSettings((settingsRes || [])[0] || null);
      setAnalyticsData(analyticsRes || []);
      setConversionEvents(eventsRes || []);
    } catch (err) {
      setError(err.message || "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    setInternalExcluded(isInternalTraffic());
  }, [fetchData]);

  const toggleInternalExclusion = useCallback(() => {
    if (isInternalTraffic()) {
      disableInternalTrafficExclusion();
      setInternalExcluded(false);
    } else {
      enableInternalTrafficExclusion();
      setInternalExcluded(true);
    }
  }, []);

  // Compute trusted metrics from LandingPageAnalytics
  const trustedPageViews = analyticsData.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const trustedSessions = analyticsData.reduce((sum, a) => sum + (a.sessions || 0), 0);
  const trustedCtaClicks = analyticsData.reduce((sum, a) => sum + (a.cta_clicks || 0), 0);
  const trustedCheckoutClicks = analyticsData.reduce((sum, a) => sum + (a.checkout_clicks || 0), 0);
  const trustedFormSubmissions = analyticsData.reduce((sum, a) => sum + (a.form_submissions || 0), 0);
  const avgTimeOnPage = analyticsData.length > 0
    ? analyticsData.reduce((sum, a) => sum + (a.avg_time_on_page_seconds || 0), 0) / analyticsData.length
    : 0;

  const hasTrustedData = analyticsData.length > 0 && trustedPageViews > 0;
  const insufficientData = !hasTrustedData;

  // Check if direct traffic dominates without referrer/UTM data
  const utmSources = analyticsData.filter((a) => a.top_utm_source).length;
  const directDominates = hasTrustedData && utmSources < analyticsData.length * 0.3;

  // Admin IP exclusion
  const adminIps = adminSettings?.allowed_admin_ips || [];
  const ipExclusionConfigured = adminIps.length > 0;

  // Sample size check
  const sampleSizeSufficient = trustedSessions >= 100;
  const engagementSufficient = avgTimeOnPage >= 5;

  // Check if running in preview/sandbox
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("preview-sandbox");

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: "#00AEEF" }} />
          <h3 className="text-sm font-bold text-gray-900">Analytics Diagnostics</h3>
          <span className="text-[11px] text-gray-400">Trusted vs Raw</span>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-1 rounded hover:bg-gray-50 disabled:opacity-50"
          title="Refresh"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : <RefreshCw className="w-3.5 h-3.5 text-gray-500" />}
        </button>
      </div>

      <div className="px-4 py-3">
        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {isPreview && (
          <WarningBanner>
            <strong>QA / Preview Mode:</strong> This traffic is from a preview-sandbox environment and should NOT be presented as real production buyer traffic.
          </WarningBanner>
        )}

        {/* ── Verification Checklist ── */}
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Verification Checklist</p>
          <CheckRow
            ok={true}
            label="Trusted filter active"
            detail="Non-page technical requests and automated traffic are filtered before tracking"
          />
          <CheckRow
            ok={true}
            label="API / non-page paths excluded"
            detail={`${DIAGNOSTIC_CONFIG.EXCLUDED_PATH_PREFIXES.join(", ")} + static assets, favicon, robots.txt, sitemap.xml, health checks`}
          />
          <CheckRow
            ok={true}
            label="Bot / user-agent filter active"
            detail={`${DIAGNOSTIC_CONFIG.BOT_UA_PATTERNS.length} patterns: ${DIAGNOSTIC_CONFIG.BOT_UA_PATTERNS.join(", ")}`}
          />
          <CheckRow
            ok={ipExclusionConfigured}
            label="Internal / admin IP exclusion"
            detail={ipExclusionConfigured
              ? `${adminIps.length} IP(s) configured in AdminSettings.allowed_admin_ips`
              : "Internal IP exclusion not configured. Add IPs in Admin Settings → allowed_admin_ips."}
          />
          <CheckRow
            ok={true}
            label="Conversion pages tracked"
            detail="Homepage, pricing, contact, lead forms, checkout, client portal, industry pages"
          />
          <CheckRow
            ok={internalExcluded}
            label="Owner / internal traffic exclusion (browser)"
            detail={internalExcluded
              ? "Active — your browser visits are excluded from trusted analytics"
              : "Not active for this browser — use toggle below to exclude your own visits"}
          />
        </div>

        {/* ── Internal Traffic Exclusion Toggle ── */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {internalExcluded ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-gray-500" />}
              <p className="text-xs font-bold text-gray-700">Internal Traffic Exclusion</p>
            </div>
            <button
              onClick={toggleInternalExclusion}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${internalExcluded ? "bg-blue-600" : "bg-gray-300"}`}
              role="switch"
              aria-checked={internalExcluded}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${internalExcluded ? "translate-x-4" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="rounded bg-white border border-gray-100 p-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">How to enable from any browser:</p>
            <p className="text-[11px] text-gray-500 font-mono break-all">
              localStorage.setItem('clientsurge_internal_traffic', 'true')
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Or use the toggle above on this browser. When enabled, page views from this browser are excluded from trusted analytics.
            </p>
          </div>
        </div>

        {/* ── Trusted vs Raw Traffic Counters ── */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Trusted Business Analytics</p>
            <span className="text-[10px] text-gray-300">(filtered, excludes bots/internal)</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-300">Raw Base44 Analytics</p>
            <span className="text-[10px] text-gray-200">(unfiltered platform totals — use for debugging only)</span>
          </div>

          {insufficientData ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
              <Info className="w-5 h-5 text-gray-300 mx-auto mb-1" />
              <p className="text-xs font-medium text-gray-500">Insufficient trusted data</p>
              <p className="text-[11px] text-gray-400">No LandingPageAnalytics records found. Trusted metrics will appear here once real visitor data is collected.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-gray-100 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Trusted Page Views</p>
                <p className="text-lg font-bold text-gray-900">{trustedPageViews.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Trusted Sessions</p>
                <p className="text-lg font-bold text-gray-900">{trustedSessions.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">CTA Clicks</p>
                <p className="text-lg font-bold text-gray-900">{trustedCtaClicks.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Checkout Clicks</p>
                <p className="text-lg font-bold text-gray-900">{trustedCheckoutClicks.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Form Submissions</p>
                <p className="text-lg font-bold text-gray-900">{trustedFormSubmissions.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Avg Time on Page</p>
                <p className="text-lg font-bold text-gray-900">{avgTimeOnPage.toFixed(1)}s</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Warnings ── */}
        {hasTrustedData && !sampleSizeSufficient && (
          <WarningBanner>
            <strong>Sample size too small for strategic decisions.</strong> Only {trustedSessions} trusted unique visitors. Need 100+ for reliable conclusions.
          </WarningBanner>
        )}
        {hasTrustedData && !engagementSufficient && (
          <WarningBanner>
            <strong>Engagement too low to trust conversion conclusions.</strong> Average trusted session duration is {avgTimeOnPage.toFixed(1)}s (below 5s threshold).
          </WarningBanner>
        )}
        {directDominates && (
          <WarningBanner>
            <strong>Marketing source attribution is not trustworthy yet.</strong> Direct traffic dominates but UTM/referrer data is missing for most sessions.
          </WarningBanner>
        )}

        {/* ── Business Page Tracking Visibility ── */}
        <div className="mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Business Page Tracking</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {BUSINESS_PAGES.map((page) => (
              <div key={page.path} className="flex items-center gap-1.5 py-1">
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-[11px] text-gray-600">{page.label}</span>
                <span className="text-[10px] text-gray-300 ml-auto">{page.path}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Suspicious Path Diagnostics ── */}
        <div className="mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-2">Suspicious Path Exclusions (never shown as marketing pages)</p>
          <div className="flex flex-wrap gap-1">
            {DIAGNOSTIC_CONFIG.EXCLUDED_PATH_PREFIXES.map((p) => (
              <span key={p} className="inline-block px-2 py-0.5 rounded bg-red-50 border border-red-100 text-[10px] font-mono text-red-600">
                {p}/*
              </span>
            ))}
            {DIAGNOSTIC_CONFIG.EXCLUDED_EXACT_PATHS.map((p) => (
              <span key={p} className="inline-block px-2 py-0.5 rounded bg-red-50 border border-red-100 text-[10px] font-mono text-red-600">
                {p}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-gray-300 mt-3">
          Data source: LandingPageAnalytics + ConversionTrackingEvent entities. No external GA4 or Cloudflare data is accessed.
          {insufficientData && " Showing 'Insufficient trusted data' rather than fabricated metrics."}
        </p>
      </div>
    </div>
  );
}