import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, Loader2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import PostPurchaseWhatNext from "@/components/portal/PostPurchaseWhatNext";
import GuaranteeCard from "@/components/portal/GuaranteeCard";
import { trackEvent } from "@/lib/analytics";

function readPayload(result) {
  return result?.data || result || {};
}

export default function OrderSuccess() {
  const sessionId = useMemo(() => new URLSearchParams(window.location.search).get("session_id") || "", []);
  const [orderSummary, setOrderSummary] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [resolvingOrder, setResolvingOrder] = useState(Boolean(sessionId));
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    const previous = robots?.getAttribute("content") || "index,follow";
    if (robots) robots.setAttribute("content", "noindex,nofollow");
    return () => {
      if (robots) robots.setAttribute("content", previous);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("clientsurge:last-order");
      if (raw) {
        setOrderSummary(JSON.parse(raw));
        sessionStorage.removeItem("clientsurge:last-order");
      }
      sessionStorage.removeItem("clientsurge:cart");
    } catch {}

    if (!sessionId) {
      setResolvingOrder(false);
      return;
    }

    base44.functions.invoke("getOrderStatus", { session_id: sessionId })
      .then((result) => {
        const payload = readPayload(result);
        if (payload?.eligible && payload?.order?.id) {
          setOrderInfo(payload.order);
          return;
        }
        setResolveError("Your payment is confirmed, but the setup record is still syncing. The secure setup link below can finish resolving it.");
      })
      .catch(() => {
        setResolveError("Your payment is confirmed, but we could not display the order details yet. Continue with the secure setup link below.");
      })
      .finally(() => setResolvingOrder(false));
  }, [sessionId]);

  useEffect(() => {
    if (!orderInfo?.id) return;

    const email = (orderInfo.customer_email || "").toLowerCase();
    const testPatterns = [
      /@example\.com/i,
      /@clientsurge\.test/i,
      /@clientsurge-install\.internal/i,
      /runtime\.checkout/i,
      /test-/i,
      /stripe-.*-proof/i,
      /pricing-live-checkout/i,
      /postfix-live-checkout/i,
      /proof@/i,
    ];
    if (!email || testPatterns.some((pattern) => pattern.test(email))) return;

    const fireKey = `clientsurge:ga4-purchase-fired:${orderInfo.id}`;
    if (sessionStorage.getItem(fireKey)) return;
    sessionStorage.setItem(fireKey, "1");

    const totalValue = Number(orderInfo.total_setup || 0) + Number(orderInfo.total_monthly || 0);
    trackEvent("purchase", {
      transaction_id: orderInfo.stripe_session_id || orderInfo.id,
      value: totalValue,
      currency: "USD",
      items: (orderInfo.items || []).map((item, index) => ({
        item_id: item.product_id || item.service_key || `item-${index}`,
        item_name: item.product_name || item.service_key || "Service",
        price: Number(item.setup_fee || 0) + Number(item.monthly_fee || 0),
        quantity: 1,
      })),
    });
  }, [orderInfo]);

  const setupHref = orderInfo?.id
    ? `/setup/credentials?order_id=${encodeURIComponent(orderInfo.id)}&section=business`
    : sessionId
      ? `/setup/credentials?session_id=${encodeURIComponent(sessionId)}&section=business`
      : "/client-portal";

  return (
    <DemoBookingProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 font-sans">
        <Navbar />
        <main className="mx-auto max-w-3xl px-5 pb-16 pt-28 sm:px-8">
          <section className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-200 bg-green-50">
              <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden="true" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Payment confirmed</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Complete Your Secure Setup
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Your purchase is complete. Configuration begins after you submit the business details, booking information, and integration preferences needed for your system.
            </p>
          </section>

          <section className="mt-8 rounded-3xl border border-sky-200 bg-white p-6 shadow-[0_18px_50px_rgba(0,59,143,0.10)] sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 text-left">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50">
                  <ClipboardCheck className="h-6 w-6 text-sky-700" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-950">Next required step</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Complete the setup form now, or save your progress and return through the client portal.
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden="true" />
                    Secure, order-verified setup
                  </div>
                </div>
              </div>

              <Link
                to={setupHref}
                className="inline-flex min-h-12 flex-shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-900 px-6 py-3 text-sm font-extrabold text-white no-underline shadow-lg shadow-sky-900/15 transition-transform hover:-translate-y-0.5"
              >
                Start Setup <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            {resolvingOrder && (
              <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Verifying your order details…
              </p>
            )}

            {resolveError && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs font-semibold leading-5 text-amber-800">
                {resolveError}
              </p>
            )}
          </section>

          {orderSummary && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-700">Your order</p>
              <div className="mt-3 divide-y divide-slate-100">
                {orderSummary.items?.map((item, index) => (
                  <div key={`${item.name || "service"}-${index}`} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm font-semibold text-slate-900">{item.icon} {item.name}</span>
                    <span className="text-xs font-semibold text-slate-500">${item.setup_fee} + ${item.monthly_fee}/mo</span>
                  </div>
                ))}
              </div>
              {orderSummary.totalSetup != null && (
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-extrabold">
                  <span className="text-slate-950">Total</span>
                  <span className="text-sky-800">${orderSummary.totalSetup} setup · ${orderSummary.totalMonthly}/mo</span>
                </div>
              )}
            </section>
          )}

          <div className="mt-6">
            <PostPurchaseWhatNext />
          </div>

          <div className="mt-6">
            <GuaranteeCard />
          </div>

          <div className="mt-8 text-center">
            <Link to="/client-portal" className="text-sm font-bold text-sky-800 no-underline hover:text-blue-950">
              Open client portal
            </Link>
          </div>
        </main>
      </div>
    </DemoBookingProvider>
  );
}
