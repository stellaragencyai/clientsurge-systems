import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { appParams } from "@/lib/app-params";

/**
 * ProductSignup — resilient, self-contained checkout page.
 * Zero non-essential imports. Never returns null. Every state renders visible HTML.
 * Defaults to growth_system. Calls createCheckoutSession backend function.
 */
const PACKAGES = [
  {
    id: "starter_system",
    title: "Starter System",
    price: "$497",
    setup: "$797 setup",
    description: "Instant lead response + missed-call recovery foundation.",
    features: ["Lead capture", "Instant lead response", "Missed-call text-back", "Basic follow-up"],
  },
  {
    id: "growth_system",
    title: "Growth System",
    price: "$997",
    setup: "$1,297 setup",
    description: "Response, follow-up, and booking automation system.",
    features: ["Everything in Starter", "AI scheduling handoff", "Multi-step follow-up", "Booking automation", "Client dashboard"],
    recommended: true,
  },
  {
    id: "pro_system",
    title: "Pro System",
    price: "$1,997",
    setup: "$2,497 setup",
    description: "Full lead recovery, website, and automation layer.",
    features: ["Everything in Growth", "Website design & build", "Lead reactivation", "Advanced reporting", "Priority setup"],
  },
];

const DEFAULT_PACKAGE = "growth_system";
const VALID_KEYS = ["starter_system", "growth_system", "pro_system"];
const CHECKOUT_FUNCTION_NAME = "createCheckoutSession";
const FALLBACK_APP_ID = "69dc4a79656fdba136d413d3";

function resolvePackage(pkgParam) {
  if (!pkgParam) return DEFAULT_PACKAGE;
  const normalized = String(pkgParam).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (VALID_KEYS.includes(normalized)) return normalized;
  // Try common aliases
  const aliasMap = { starter: "starter_system", growth: "growth_system", pro: "pro_system", elite: "pro_system" };
  if (aliasMap[normalized]) return aliasMap[normalized];
  return DEFAULT_PACKAGE;
}

async function invokePublicCheckoutSession(payload) {
  const appId = appParams?.appId || FALLBACK_APP_ID;
  const endpoint = `/api/apps/${appId}/functions/${CHECKOUT_FUNCTION_NAME}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let result = {};

  if (rawText) {
    try {
      result = JSON.parse(rawText);
    } catch {
      result = { error: rawText.slice(0, 500) };
    }
  }

  const checkoutUrl = result?.url || result?.data?.url;

  if (!response.ok || !checkoutUrl) {
    const message =
      result?.error ||
      result?.data?.error ||
      `Checkout server returned HTTP ${response.status || "error"}.`;
    throw new Error(message);
  }

  return {
    data: {
      ...result,
      url: checkoutUrl,
    },
    url: checkoutUrl,
  };
}

export default function ProductSignup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pkgParam = searchParams.get("package") || searchParams.get("plan") || "";
  const [selectedPackage, setSelectedPackage] = useState(() => resolvePackage(pkgParam));
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Sync URL param → selected package
  useEffect(() => {
    const resolved = resolvePackage(pkgParam);
    setSelectedPackage(resolved);
  }, [pkgParam]);

  const selectPackage = useCallback((pkgId) => {
    setSelectedPackage(pkgId);
    const next = new URLSearchParams(searchParams);
    next.set("package", pkgId);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleCheckout = useCallback(async () => {
    setError("");

    // Basic validation
    if (!fullName.trim()) { setError("Please enter your full name."); return; }
    if (!businessName.trim()) { setError("Please enter your business name."); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    if (phone.replace(/\D/g, "").length < 10) { setError("Please enter a valid phone number."); return; }

    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://clientsurgesystems.com";
      const payload = {
        package_key: selectedPackage,
        customer_name: fullName.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        business_name: businessName.trim(),
        industry: industry.trim(),
        success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/product-signup?package=${selectedPackage}`,
      };

      // Public checkout must not use the Base44 browser SDK here. The SDK can run an
      // implicit auth probe against /entities/User/me, which breaks anonymous buyers
      // with a 401 before Stripe checkout starts.
      const response = await invokePublicCheckoutSession(payload);
      const url = response?.data?.url || response?.url;

      if (!url) {
        throw new Error(response?.data?.error || response?.error || "No checkout URL returned by the server.");
      }

      setSuccess(true);
      // Brief delay so user sees confirmation before redirect
      setTimeout(() => { window.location.assign(url); }, 800);
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Checkout could not be started.";
      setError(`${msg} Click "Retry Checkout" to try again, or contact support if it persists.`);
      setLoading(false);
    }
  }, [selectedPackage, fullName, businessName, email, phone, industry]);

  const handleRetry = useCallback(() => {
    setError("");
    handleCheckout();
  }, [handleCheckout]);

  const currentPkg = PACKAGES.find((p) => p.id === selectedPackage) || PACKAGES[1];

  // ── ALWAYS render visible HTML — never return null ──
  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>
      {/* ── Route-level verification marker (hidden but in DOM for production verification) ── */}
      <div data-route-verify="product-signup" data-selected-package={selectedPackage} style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
        Checkout page loaded — package: {selectedPackage}
      </div>

      {/* ── Logo Header ── */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-center gap-2">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#005691" aria-hidden="true">
            <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
          </svg>
          <span className="text-xl font-black text-gray-900 tracking-tight">ClientSurge</span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Heading */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#0088CC" }}>
            Secure Checkout
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            Complete your ClientSurge signup
          </h1>
          <p className="text-sm text-gray-500">
            {/* Verification text per requirement #12 */}
            Checkout page loaded — selected package: <strong className="text-gray-900">{currentPkg.title}</strong>
          </p>
        </div>

        {/* Package Selector */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Choose Your System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PACKAGES.map((pkg) => {
              const isSelected = pkg.id === selectedPackage;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => selectPackage(pkg.id)}
                  className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                  style={isSelected ? { borderColor: "#0088CC" } : {}}
                >
                  {pkg.recommended && (
                    <span
                      className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[10px] font-black text-white uppercase tracking-wide"
                      style={{ background: "#0088CC" }}
                    >
                      Recommended
                    </span>
                  )}
                  <h3 className="font-black text-gray-900 text-lg">{pkg.title}</h3>
                  <p className="text-2xl font-black text-gray-900 mt-1">{pkg.price}<span className="text-sm font-medium text-gray-400">/mo</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">{pkg.setup}</p>
                  <p className="text-xs text-gray-600 mt-2">{pkg.description}</p>
                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold" style={{ color: "#0088CC" }}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"/></svg>
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Checkout Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-black text-gray-900 mb-1">Your Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your details to continue to secure Stripe checkout.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                style={{ fontSize: "16px" }}
              />
            </div>

            {/* Business Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name *</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Landscaping LLC"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                style={{ fontSize: "16px" }}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@yourbusiness.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                style={{ fontSize: "16px" }}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                style={{ fontSize: "16px" }}
              />
            </div>

            {/* Industry */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Industry / Business Type</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                style={{ fontSize: "16px" }}
              >
                <option value="">— Select your industry —</option>
                <option value="Med Spa">Med Spa / Aesthetics</option>
                <option value="Dental">Dental / Orthodontics</option>
                <option value="HVAC">HVAC / Home Services</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Roofing">Roofing / Contractors</option>
                <option value="Chiropractic">Chiropractic / Physical Therapy</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Legal / Personal Injury">Legal / Personal Injury</option>
                <option value="Automotive">Automotive / Auto Repair</option>
                <option value="Salon / Spa">Salon / Spa</option>
                <option value="Fitness">Fitness / Gym</option>
                <option value="Accounting">Accounting / Finance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 011.4 0L10 7.6l.3-.3a1 1 0 111.4 1.4l-.3.3.3.3a1 1 0 11-1.4 1.4L10 10.4l-.3.3a1 1 0 11-1.4-1.4l.3-.3-.3-.3a1 1 0 010-1.4z" clipRule="evenodd"/></svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Checkout Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                disabled={loading}
                className="mt-3 w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: loading ? "#9cb3c9" : "#dc2626" }}
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.1a8 8 0 0113 6.9 8 8 0 01-13 6.9V17a1 1 0 11-2 0v-5a1 1 0 011-1h5a1 1 0 110 2H6.7A6 6 0 1016 10a1 1 0 112 0 8 8 0 11-14-5.3V3a1 1 0 011-1z" clipRule="evenodd"/></svg>
                )}
                Retry Checkout
              </button>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <svg className="w-8 h-8 text-green-600 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd"/></svg>
              <p className="text-sm font-bold text-green-900">Redirecting to secure checkout…</p>
              <p className="text-xs text-green-700 mt-1">You'll be transferred to Stripe to complete your payment safely.</p>
            </div>
          )}

          {/* Checkout Button */}
          {!success && (
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 w-full py-4 rounded-xl font-black text-white text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{
                background: loading ? "#9cb3c9" : "linear-gradient(135deg, #003B8F 0%, #0088CC 60%, #00AEEF 100%)",
                boxShadow: loading ? "none" : "0 4px 16px rgba(0,136,204,0.35)",
                minHeight: "56px",
              }}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  Preparing secure checkout…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                  Continue to Secure Checkout — {currentPkg.title}
                </>
              )}
            </button>
          )}

          {!success && (
            <p className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              Secured by Stripe · 256-bit encryption · Your information is protected
            </p>
          )}
        </div>

        {/* Help links */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Need help? <Link to="/contact" className="font-semibold underline" style={{ color: "#0088CC" }}>Contact support</Link> · <Link to="/pricing" className="font-semibold underline" style={{ color: "#0088CC" }}>Compare packages</Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} ClientSurge Systems · The Amazon of AI Services for Business
          </p>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700">Privacy</Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-700">Terms</Link>
            <Link to="/sms-terms" className="text-gray-500 hover:text-gray-700">SMS Terms</Link>
            <Link to="/refund-policy" className="text-gray-500 hover:text-gray-700">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
