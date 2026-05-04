import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Order, Subscription } from "@/api/entities";
import { getStripeCustomerPortalUrl } from "@/api/functions";
import PaymentFailedBanner from "./PaymentFailedBanner";

const PLAN_RATES = {
  starter: { monthly: 497, setup: 797 },
  growth: { monthly: 997, setup: 1297 },
  elite: { monthly: 1997, setup: 2497 },
};

const FALLBACK_SERVICES = {
  starter: ["Instant Lead Response", "Missed Call Text-Back"],
  growth: [
    "Instant Lead Response",
    "Missed Call Text-Back",
    "Appointment Booking AI",
    "Follow-Up Sequences",
  ],
  elite: [
    "Instant Lead Response",
    "Missed Call Text-Back",
    "Appointment Booking AI",
    "Follow-Up Sequences",
    "Lead Reactivation",
    "Review Request System",
  ],
};

const SERVICE_LABELS = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "Follow-Up Sequences",
  ai_booking_agent: "Appointment Booking AI",
  lead_reactivation: "Lead Reactivation",
  review_request: "Review Request System",
};

function normalizePlanKey(value) {
  return (value || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/_system$/, "")
    .replace(/-system$/, "")
    .replace(/system$/, "")
    .replace(/^_+|_+$/g, "");
}

function capitalize(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPlanName(planType) {
  const normalized = normalizePlanKey(planType);
  return normalized ? `${capitalize(normalized)} System` : "Custom System";
}

function formatBillingDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusMeta(order, subscription) {
  if (subscription?.status === "active") {
    return {
      label: "Active",
      className: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/30",
    };
  }

  if (subscription?.status === "past_due" || order?.billing_status === "past_due") {
    return {
      label: "Past Due",
      className: "bg-red-500/15 text-red-300 border border-red-400/30",
    };
  }

  return {
    label: "Unknown",
    className: "bg-white/10 text-white/70 border border-white/15",
  };
}

function getServicesIncluded(planType, subscription) {
  if (subscription?.services_included?.length) {
    return subscription.services_included.map((service) => SERVICE_LABELS[service] || service);
  }

  return FALLBACK_SERVICES[normalizePlanKey(planType)] || [];
}

function LoadingState() {
  return (
    <div className="bg-[#0a1628] rounded-xl border border-white/10 p-6">
      <div className="animate-pulse bg-white/5 rounded-xl h-8 w-full mb-3" />
      <div className="animate-pulse bg-white/5 rounded-xl h-8 w-full mb-3" />
      <div className="animate-pulse bg-white/5 rounded-xl h-8 w-full mb-3" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-[#0a1628] rounded-xl border border-white/10 p-6">
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-white font-semibold text-lg mb-1">No active plan found</p>
        <p className="text-white/50 text-sm mb-4">Browse the AI Store to get started.</p>
        <a
          href="/Store"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 py-2 font-semibold"
        >
          Browse Store →
        </a>
      </div>
    </div>
  );
}

export default function BillingDashboard({ currentUser }) {
  const [order, setOrder] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [portalError, setPortalError] = useState("");
  const [portalAction, setPortalAction] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const loadBilling = async () => {
      if (!currentUser?.email) {
        if (!isCancelled) {
          setOrder(null);
          setSubscription(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError("");
      setPortalError("");

      try {
        const orders = await Order.filter({ customer_email: currentUser.email });
        const nextOrder = orders[0] || null;

        // Filter Subscription by order_id NOT client_email — client_email is null in prod
        const subs = nextOrder ? await Subscription.filter({ order_id: nextOrder.id }) : [];
        const nextSubscription = subs[0] || null;

        if (!isCancelled) {
          setOrder(nextOrder);
          setSubscription(nextSubscription);
        }
      } catch (loadError) {
        console.error("Failed to load billing info.", loadError);
        if (!isCancelled) {
          setOrder(null);
          setSubscription(null);
          setError("Could not load billing info. Try refreshing or contact support.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadBilling();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.email]);

  const planKey = normalizePlanKey(order?.plan_type);
  const rates = useMemo(() => PLAN_RATES[planKey] || { monthly: 0, setup: 0 }, [planKey]);
  const status = useMemo(() => getStatusMeta(order, subscription), [order, subscription]);
  const servicesIncluded = useMemo(
    () => getServicesIncluded(order?.plan_type, subscription),
    [order?.plan_type, subscription]
  );

  const openPortal = async (action) => {
    if (!currentUser?.email) {
      return;
    }

    setPortalAction(action);
    setPortalError("");

    try {
      const result = await getStripeCustomerPortalUrl({ customer_email: currentUser.email });
      const portalUrl = result?.portal_url || result?.url;

      if (portalUrl) {
        window.open(portalUrl, "_blank", "noopener,noreferrer");
        return;
      }

      throw new Error("Portal URL missing from response.");
    } catch (portalError) {
      console.error("Unable to open Stripe customer portal.", portalError);
      setPortalError("Could not load billing info. Try refreshing or contact support.");
    } finally {
      setPortalAction(null);
    }
  };

  const handleManageBilling = async () => {
    await openPortal("manage");
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      "Are you sure? Canceling will stop your automations at the end of the billing period."
    );

    if (!confirmed) {
      return;
    }

    await openPortal("cancel");
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <p className="text-amber-600 text-sm">{error}</p>;
  }

  if (!order) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <PaymentFailedBanner
        order={order}
        subscription={subscription}
        onManageBilling={handleManageBilling}
        loading={portalAction !== null}
      />

      <div className="bg-[#0a1628] rounded-xl border border-white/10 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-white/60 text-sm mb-2">Current plan</p>
            <h2 className="text-white text-2xl font-semibold">{formatPlanName(order.plan_type)}</h2>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mt-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-2">Monthly rate</p>
            <p className="text-white text-xl font-semibold">${rates.monthly}/mo</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-2">Setup fee</p>
            <p className="text-white text-xl font-semibold">${rates.setup} (paid)</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-2">Next billing date</p>
            <p className="text-white text-xl font-semibold">
              {formatBillingDate(subscription?.current_period_end)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/50 text-xs uppercase tracking-[0.2em] mb-2">Services included</p>
            <div className="flex flex-wrap gap-2">
              {servicesIncluded.length > 0 ? (
                servicesIncluded.map((service) => (
                  <span
                    key={service}
                    className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/85"
                  >
                    {service}
                  </span>
                ))
              ) : (
                <span className="text-white/60 text-sm">—</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row mt-6">
          <button
            onClick={handleManageBilling}
            disabled={portalAction !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-400/40 px-4 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/10 disabled:opacity-70"
          >
            {portalAction === "manage" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Manage Billing
          </button>
          <button
            onClick={handleCancelSubscription}
            disabled={portalAction !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-70"
          >
            {portalAction === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Cancel Subscription
          </button>
        </div>

        {portalError ? <p className="text-amber-300 text-sm mt-4">{portalError}</p> : null}
      </div>
    </div>
  );
}
