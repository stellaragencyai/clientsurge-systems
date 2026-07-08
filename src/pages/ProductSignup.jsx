import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { appParams } from "@/lib/app-params";
import { PACKAGE_OFFERS, normalizePackageKey } from "@/lib/salesCatalog";
import { isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from "@/lib/formSanitizers";

const DEFAULT_PACKAGE = "growth_system";
const CHECKOUT_FUNCTION_NAME = "createCheckoutSession";
const FALLBACK_APP_ID = "69dc4a79656fdba136d413d3";
const CHECKOUT_CONSENT_VERSION = "checkout_contact_consent_v1";

const CHECKOUT_PACKAGES = PACKAGE_OFFERS.filter((offer) => offer.checkout_enabled);
const PACKAGE_BY_KEY = Object.fromEntries(CHECKOUT_PACKAGES.map((offer) => [offer.package_key, offer]));

const PACKAGE_SUMMARIES = {
  starter_system: {
    problem: "We miss calls or reply too late.",
    shortDescription: "Instant response and missed-call recovery foundation.",
  },
  growth_system: {
    problem: "We need follow-up and booking handled.",
    shortDescription: "Response, nurture, and booking automation system.",
    recommended: true,
  },
  pro_system: {
    problem: "We want the full lead recovery layer.",
    shortDescription: "Full response, reactivation, review, and reporting layer.",
  },
};

const INDUSTRIES = [
  "Med Spa / Aesthetics",
  "Dental / Orthodontics",
  "HVAC / Home Services",
  "Plumbing",
  "Roofing / Contractors",
  "Chiropractic / Physical Therapy",
  "Real Estate",
  "Legal / Personal Injury",
  "Auto Repair",
  "Salon / Spa",
  "Fitness / Gym",
  "Accounting / Finance",
  "Other",
];

function currency(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

function resolvePackage(pkgParam) {
  const normalized = normalizePackageKey(pkgParam || DEFAULT_PACKAGE);
  return PACKAGE_BY_KEY[normalized]?.package_key || DEFAULT_PACKAGE;
}

async function invokePublicCheckoutSession(payload) {
  const appId = appParams?.appId || FALLBACK_APP_ID;
  const endpoint = `/api/apps/${appId}/functions/${CHECKOUT_FUNCTION_NAME}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
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
    const err = new Error(message);
    err.request_id = result?.request_id || result?.data?.request_id || null;
    err.code = result?.code || result?.data?.code || null;
    throw err;
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
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const resolved = resolvePackage(pkgParam);
    setSelectedPackage(resolved);
    if (pkgParam && normalizePackageKey(pkgParam) !== resolved) {
      const next = new URLSearchParams(searchParams);
      next.set("package", resolved);
      next.delete("plan");
      setSearchParams(next, { replace: true });
    }
  }, [pkgParam, searchParams, setSearchParams]);

  const currentPkg = PACKAGE_BY_KEY[selectedPackage] || PACKAGE_BY_KEY[DEFAULT_PACKAGE];
  const currentSummary = PACKAGE_SUMMARIES[currentPkg.package_key] || {};
  const monthlyLabel = currency(currentPkg.monthly_total);
  const setupLabel = currency(currentPkg.setup_total);

  const featureList = useMemo(() => {
    const features = currentPkg.features?.length
      ? currentPkg.features
      : currentPkg.included_services?.map((service) => service.name) || [];
    return features.slice(0, 6);
  }, [currentPkg]);

  const selectPackage = useCallback((pkgId) => {
    const resolved = resolvePackage(pkgId);
    setSelectedPackage(resolved);
    setError("");
    const next = new URLSearchParams(searchParams);
    next.set("package", resolved);
    next.delete("plan");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const validate = () => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!businessName.trim()) return "Please enter your business name.";
    if (!isValidEmail(email)) return "Please enter a valid email address.";
    if (!isValidPhone(phone)) return "Please enter a valid US phone number.";
    if (!consentGiven) return "Please confirm consent so we can contact you about your purchase and setup.";
    return "";
  };

  const handleCheckout = useCallback(async (event) => {
    event?.preventDefault?.();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://clientsurgesystems.com";
      const payload = {
        package_key: selectedPackage,
        customer_name: fullName.trim(),
        customer_email: normalizedEmail,
        customer_phone: normalizedPhone,
        business_name: businessName.trim(),
        industry: industry.trim(),
        success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/product-signup?package=${encodeURIComponent(selectedPackage)}`,
        source: "product_signup",
        consent_given: true,
        consent_source: "product_signup_checkout_form",
        consent_text_version: CHECKOUT_CONSENT_VERSION,
        requested_channels: ["email", "sms", "call"],
      };

      const response = await invokePublicCheckoutSession(payload);
      const url = response?.data?.url || response?.url;

      if (!url) {
        throw new Error(response?.data?.error || response?.error || "No checkout URL returned by the server.");
      }

      setSuccess(true);
      window.setTimeout(() => { window.location.assign(url); }, 500);
    } catch (err) {
      const msg = err?.message || "Checkout could not be started.";
      const requestId = err?.request_id;
      const suffix = requestId ? ` Request ID: ${requestId}.` : "";
      setError(`${msg}.${suffix} Retry checkout or contact support if it continues.`.replace("..", "."));
      setSuccess(false);
      setLoading(false);
    }
  }, [selectedPackage, fullName, businessName, email, phone, industry, consentGiven]);

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}>
      <div data-route-verify="product-signup" data-selected-package={selectedPackage} style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
        Checkout page loaded — package: {selectedPackage}
      </div>

      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-gray-900 no-underline" aria-label="ClientSurge Systems home">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#005691" aria-hidden="true">
              <path d="M12 2L4 6v6c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V6l-8-4z" />
            </svg>
            <span className="text-xl font-black tracking-tight">ClientSurge</span>
          </Link>
          <Link to="/pricing" className="text-xs font-bold underline" style={{ color: "#0088CC" }}>Compare packages</Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#0088CC" }}>
            Secure Checkout
          </p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
            Complete your ClientSurge signup
          </h1>
          <p className="text-sm text-gray-500">
            Checkout page loaded — selected package: <strong className="text-gray-900">{currentPkg.name}</strong>
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Choose Your System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CHECKOUT_PACKAGES.map((pkg) => {
              const summary = PACKAGE_SUMMARIES[pkg.package_key] || {};
              const isSelected = pkg.package_key === selectedPackage;
              return (
                <button
                  key={pkg.package_key}
                  type="button"
                  onClick={() => selectPackage(pkg.package_key)}
                  className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                  style={isSelected ? { borderColor: "#0088CC" } : {}}
                  aria-pressed={isSelected}
                >
                  {(summary.recommended || pkg.highlight) && (
                    <span
                      className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[10px] font-black text-white uppercase tracking-wide"
                      style={{ background: "#0088CC" }}
                    >
                      Recommended
                    </span>
                  )}
                  <h3 className="font-black text-gray-900 text-lg">{pkg.name}</h3>
                  <p className="text-2xl font-black text-gray-900 mt-1">{currency(pkg.monthly_total)}<span className="text-sm font-medium text-gray-400">/mo</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">{currency(pkg.setup_total)} one-time setup</p>
                  <p className="text-xs text-gray-600 mt-2">{summary.shortDescription || pkg.description}</p>
                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold" style={{ color: "#0088CC" }}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z"/></svg>
                      Selected
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleCheckout} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#0088CC" }}>Order Summary</p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-lg font-black text-gray-900">{currentPkg.name}</p>
                <p className="text-sm text-gray-600">{setupLabel} setup + {monthlyLabel}/month</p>
              </div>
              <p className="text-xs text-gray-500">Billed securely through Stripe after you continue.</p>
            </div>
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
              {featureList.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span aria-hidden="true" style={{ color: "#0088CC" }}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <h2 className="text-lg font-black text-gray-900 mb-1">Your Information</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your details to continue to secure Stripe checkout.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
              <input id="fullName" name="name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Smith" autoComplete="name" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" style={{ fontSize: "16px" }} />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="businessName" className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name *</label>
              <input id="businessName" name="organization" type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Landscaping LLC" autoComplete="organization" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" style={{ fontSize: "16px" }} />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
              <input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@yourbusiness.com" autoComplete="email" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" style={{ fontSize: "16px" }} />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
              <input id="phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" autoComplete="tel" required className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400" style={{ fontSize: "16px" }} />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 mb-1.5">Industry / Business Type</label>
              <select id="industry" name="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white" style={{ fontSize: "16px" }}>
                <option value="">— Select your industry —</option>
                {INDUSTRIES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700">
            <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span>
              I agree that ClientSurge Systems may contact me by email, phone, or SMS about this purchase and setup. Message/data rates may apply. Reply STOP to opt out. See <Link to="/privacy" className="font-semibold underline">Privacy</Link>, <Link to="/terms" className="font-semibold underline">Terms</Link>, and <Link to="/sms-terms" className="font-semibold underline">SMS Terms</Link>.
            </span>
          </label>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 011.4 0L10 7.6l.3-.3a1 1 0 111.4 1.4l-.3.3.3.3a1 1 0 11-1.4 1.4L10 10.4l-.3.3a1 1 0 11-1.4-1.4l.3-.3-.3-.3a1 1 0 010-1.4z" clipRule="evenodd"/></svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900">Checkout Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center" role="status">
              <svg className="w-8 h-8 text-green-600 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd"/></svg>
              <p className="text-sm font-bold text-green-900">Redirecting to secure checkout…</p>
              <p className="text-xs text-green-700 mt-1">You will be transferred to Stripe to complete your payment safely.</p>
            </div>
          )}

          {!success && (
            <button type="submit" disabled={loading} className="mt-6 w-full py-4 rounded-xl font-black text-white text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60" style={{ background: loading ? "#9cb3c9" : "linear-gradient(135deg, #003B8F 0%, #0088CC 60%, #00AEEF 100%)", boxShadow: loading ? "none" : "0 4px 16px rgba(0,136,204,0.35)", minHeight: "56px" }}>
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                  Preparing secure checkout…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                  Continue to Secure Checkout — {currentPkg.name}
                </>
              )}
            </button>
          )}

          {!success && (
            <p className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              Stripe checkout · encrypted payment form · no card details stored by ClientSurge
            </p>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Need help? <Link to="/contact" className="font-semibold underline" style={{ color: "#0088CC" }}>Contact support</Link> · <Link to="/pricing" className="font-semibold underline" style={{ color: "#0088CC" }}>Compare packages</Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} ClientSurge Systems · AI-powered sales systems for local service businesses
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
