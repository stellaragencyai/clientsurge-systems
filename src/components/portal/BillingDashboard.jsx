import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  getCurrentPackageKey,
  getSubscriptionChangeOptions,
  getSubscriptionChangeOrderId,
} from '@/lib/subscriptionChangeOptions';
import {
  CreditCard, Download, ExternalLink, Loader2, AlertCircle,
  CheckCircle2, Clock, RefreshCw, FileText, ShieldCheck, Zap,
  XCircle, ChevronDown, ChevronUp, BadgeCheck, AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import GuaranteeCard from './GuaranteeCard';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtDate(unix) {
  if (!unix) return '—';
  const d = typeof unix === 'number' ? new Date(unix * 1000) : new Date(unix);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtCents(cents, currency = 'usd') {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

function fmtDollars(dollars) {
  if (dollars == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);
}

// ─── status helpers ──────────────────────────────────────────────────────────

const SUB_STATUS = {
  active:            { cls: 'bg-green-100 border-green-300 text-green-800',  icon: CheckCircle2,  label: 'Active' },
  trialing:          { cls: 'bg-blue-100 border-blue-300 text-blue-800',    icon: Clock,         label: 'Trial' },
  past_due:          { cls: 'bg-red-100  border-red-300  text-red-800',     icon: AlertCircle,   label: 'Past Due' },
  canceled:          { cls: 'bg-gray-100 border-gray-300 text-gray-700',    icon: XCircle,       label: 'Canceled' },
  unpaid:            { cls: 'bg-red-100  border-red-300  text-red-800',     icon: AlertCircle,   label: 'Unpaid' },
  incomplete:        { cls: 'bg-amber-100 border-amber-300 text-amber-800', icon: AlertTriangle, label: 'Incomplete' },
  incomplete_expired:{ cls: 'bg-gray-100 border-gray-300 text-gray-700',    icon: XCircle,       label: 'Expired' },
};

const INV_STATUS = {
  paid:    { cls: 'bg-green-100 border-green-300 text-green-800',  icon: CheckCircle2, label: 'Paid' },
  open:    { cls: 'bg-amber-100 border-amber-300 text-amber-800',  icon: Clock,        label: 'Open' },
  draft:   { cls: 'bg-gray-100  border-gray-300  text-gray-700',   icon: FileText,     label: 'Draft' },
  void:    { cls: 'bg-gray-100  border-gray-300  text-gray-700',   icon: XCircle,      label: 'Void' },
  uncollectible: { cls: 'bg-red-100 border-red-300 text-red-800',  icon: AlertCircle,  label: 'Uncollectible' },
  // internal fallbacks
  unpaid:  { cls: 'bg-amber-100 border-amber-300 text-amber-800',  icon: Clock,        label: 'Unpaid' },
  overdue: { cls: 'bg-red-100   border-red-300   text-red-800',    icon: AlertCircle,  label: 'Overdue' },
};

function StatusPill({ status, map }) {
  const cfg = map[status] || map.draft || { cls: 'bg-gray-100 border-gray-300 text-gray-700', icon: FileText, label: status };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-xs font-bold ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function SubscriptionCard({ sub, onManage, managing }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SUB_STATUS[sub.status] || SUB_STATUS.active;
  const Icon = cfg.icon;
  const renewDate = sub.current_period_end ? fmtDate(sub.current_period_end) : '—';
  const pm = sub.payment_method;

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-foreground text-sm">{sub.plan_name}</p>
            <StatusPill status={sub.status} map={SUB_STATUS} />
            {sub.cancel_at_period_end && (
              <span className="text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 rounded-full px-2 py-0.5">
                Cancels {renewDate}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtCents(sub.amount, sub.currency)} / {sub.interval}
            {!sub.cancel_at_period_end && sub.status === 'active' && (
              <span className="ml-2">· Renews {renewDate}</span>
            )}
          </p>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Current Period</p>
              <p className="text-foreground text-xs">{fmtDate(sub.current_period_start)} – {fmtDate(sub.current_period_end)}</p>
            </div>
            {pm && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Payment Method</p>
                <p className="text-foreground text-xs capitalize">
                  {pm.brand ? `${pm.brand} ····${pm.last4}` : pm.type || 'On file'}
                  {pm.exp_month && ` (${pm.exp_month}/${pm.exp_year})`}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Subscription ID</p>
              <p className="text-foreground text-xs font-mono truncate">{sub.id}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionChangePanel({
  project,
  order,
  subscription,
  onChanged,
}) {
  const currentPackageKey = getCurrentPackageKey({ project, subscription, order });
  const orderId = getSubscriptionChangeOrderId({ project, subscription, order });
  const options = getSubscriptionChangeOptions({ project, subscription, order });
  const [selectedKey, setSelectedKey] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState(null);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  const selectedPlan = options.find((plan) => plan.package_key === selectedKey) || null;
  const canRequestChange = Boolean(orderId && selectedPlan && !selectedPlan.is_current);

  const previewChange = async () => {
    if (!canRequestChange) return;
    setPreviewing(true);
    setChangeError('');
    setChangeSuccess('');
    setPreview(null);

    try {
      const res = await base44.functions.invoke('requestSubscriptionChange', {
        order_id: orderId,
        new_price_id: selectedPlan.monthly_price_id,
        preview_only: true,
      });
      setPreview(res.data || res);
    } catch (err) {
      setChangeError(
        err?.response?.data?.error ||
          err?.data?.error ||
          err?.message ||
          'Unable to preview this subscription change.'
      );
    } finally {
      setPreviewing(false);
    }
  };

  const applyChange = async () => {
    if (!canRequestChange || !preview) return;
    setApplying(true);
    setChangeError('');
    setChangeSuccess('');

    try {
      await base44.functions.invoke('requestSubscriptionChange', {
        order_id: orderId,
        new_price_id: selectedPlan.monthly_price_id,
        preview_only: false,
      });
      setChangeSuccess(`Subscription change to ${selectedPlan.name} submitted.`);
      setPreview(null);
      setSelectedKey('');
      onChanged?.();
    } catch (err) {
      setChangeError(
        err?.response?.data?.error ||
          err?.data?.error ||
          err?.message ||
          'Unable to apply this subscription change.'
      );
    } finally {
      setApplying(false);
    }
  };

  if (!currentPackageKey && !orderId) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-primary" />
          Upgrade or Downgrade
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Preview Stripe proration before changing your monthly package.
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {options.map((plan) => {
            const isSelected = selectedKey === plan.package_key;
            return (
              <button
                key={plan.package_key}
                type="button"
                disabled={plan.is_current || previewing || applying}
                onClick={() => {
                  setSelectedKey(plan.package_key);
                  setPreview(null);
                  setChangeError('');
                  setChangeSuccess('');
                }}
                className={`text-left rounded-xl border-2 p-4 transition-colors ${
                  plan.is_current
                    ? 'border-green-300 bg-green-50 cursor-default'
                    : isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                } disabled:opacity-80`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-foreground">{plan.name}</p>
                  {plan.is_current && (
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-primary mt-1">{fmtDollars(plan.monthly_total)} / month</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{plan.description}</p>
              </button>
            );
          })}
        </div>

        {!orderId && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This portal account is missing a linked order ID, so package changes need support review.
          </div>
        )}

        {selectedPlan && !selectedPlan.is_current && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Change to {selectedPlan.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  First preview the prorated invoice impact, then confirm the change.
                </p>
              </div>
              <button
                type="button"
                onClick={previewChange}
                disabled={!canRequestChange || previewing || applying}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#0088CC,#003B8F)' }}
              >
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {previewing ? 'Previewing...' : 'Preview Proration'}
              </button>
            </div>

            {preview && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border bg-white p-3">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Proration Preview</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {fmtCents(preview.proration_cents || 0)} prorated adjustment
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyChange}
                  disabled={applying}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-green-700 hover:bg-green-800 disabled:opacity-60"
                >
                  {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {applying ? 'Applying...' : 'Confirm Change'}
                </button>
              </div>
            )}
          </div>
        )}

        {changeSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" /> {changeSuccess}
          </div>
        )}

        {changeError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4" /> {changeError}
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceRow({ inv }) {
  const isPaid = inv.status === 'paid';

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-foreground">{inv.number}</p>
        {inv.description && (
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{inv.description}</p>
        )}
        {inv.period_start && inv.period_end && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
          </p>
        )}
      </td>
      <td className="px-5 py-4 text-sm text-foreground whitespace-nowrap">{fmtDate(inv.created)}</td>
      <td className="px-5 py-4 text-sm font-semibold text-foreground whitespace-nowrap">{fmtCents(inv.amount_due, inv.currency)}</td>
      <td className="px-5 py-4"><StatusPill status={inv.status} map={INV_STATUS} /></td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {inv.invoice_pdf && (
            <a
              href={inv.invoice_pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </a>
          )}
          {inv.hosted_invoice_url && !isPaid && (
            <a
              href={inv.hosted_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Pay Now
            </a>
          )}
          {inv.hosted_invoice_url && isPaid && (
            <a
              href={inv.hosted_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="View Invoice"
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function BillingDashboard({ project, order, subscription, onSubscriptionChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [managing, setManaging] = useState(false);
  const [manageError, setManageError] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('all'); // all | unpaid | paid

  useEffect(() => { load(); }, [project?.id]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getStripeBillingData', {});
      setData(res.data);
    } catch (err) {
      // Fallback: try legacy internal invoice endpoint
      try {
        // #306: getClientInvoices wired as fallback for real invoice history
        const res2 = await base44.functions.invoke('getClientInvoices', { project_id: project?.id });
        setData({
          source: 'internal',
          subscriptions: [],
          invoices: (res2.data.invoices || []).map(inv => ({
            id: inv.id,
            number: inv.invoice_number || `INV-${inv.id.slice(-6).toUpperCase()}`,
            description: inv.description,
            amount_due: (inv.amount || 0) * 100,
            currency: 'usd',
            status: inv.payment_status || 'draft',
            created: inv.issue_date ? Math.floor(new Date(inv.issue_date).getTime() / 1000) : null,
            hosted_invoice_url: inv.payment_link || null,
            invoice_pdf: inv.pdf_url || null,
          })),
          summary: res2.data.summary || {},
        });
      } catch {
        setError('Unable to load billing data. Please try again or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setManaging(true);
    setManageError('');
    try {
      // #305: Stripe Customer Portal — getStripeCustomerPortalUrl is deployed + wired
      const res = await base44.functions.invoke('getStripeCustomerPortalUrl', {
        return_url: window.location.href,
      });
      if (res.data.url) window.open(res.data.url, '_blank');
    } catch (err) {
      setManageError(err?.response?.data?.error || 'Unable to open billing portal. Please contact support.');
    } finally {
      setManaging(false);
    }
  };

  const subscriptions = data?.subscriptions || [];
  const allInvoices = data?.invoices || [];
  const summary = data?.summary || {};
  const hasStripe = data?.source === 'stripe';

  const filteredInvoices = allInvoices.filter(inv => {
    if (invoiceFilter === 'paid') return inv.status === 'paid';
    if (invoiceFilter === 'unpaid') return inv.status !== 'paid' && inv.status !== 'void';
    return true;
  });

  // Active subscription for header
  const activeSub = subscriptions.find(s => s.status === 'active' || s.status === 'trialing') || subscriptions[0];
  const subStatus = activeSub?.status || subscription?.status || 'unknown';
  const planName = activeSub?.plan_name || subscription?.plan_type || project?.plan || '—';
  const renewDate = activeSub?.current_period_end ? fmtDate(activeSub.current_period_end) : '—';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading billing data…
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Subscription Header ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div
          className="px-6 py-5 flex items-start justify-between flex-wrap gap-4"
          style={{ background: 'linear-gradient(135deg,#003B8F 0%,#006BB0 60%,#00AEEF 100%)' }}
        >
          <div>
            <p className="text-xs font-bold text-blue-200/70 uppercase tracking-widest mb-1">Your Plan</p>
            <h2 className="text-2xl font-bold text-white">{planName}</h2>
            {activeSub && (
              <p className="text-blue-100/80 text-sm mt-1">
                {fmtCents(activeSub.amount, activeSub.currency)} / {activeSub.interval}
                {!activeSub.cancel_at_period_end && ` · Renews ${renewDate}`}
              </p>
            )}
          </div>
          <StatusPill status={subStatus} map={SUB_STATUS} />
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
          <SummaryCard
            label="Status"
            value={activeSub ? (SUB_STATUS[subStatus]?.label || subStatus) : (subscription?.status || '—')}
            accent={subStatus === 'active'}
          />
          <SummaryCard label="Next Renewal" value={renewDate} sub={activeSub?.cancel_at_period_end ? 'Then cancels' : 'Auto-renews'} />
          <SummaryCard
            label="Outstanding"
            value={fmtDollars(summary.total_outstanding || 0)}
            accent={(summary.total_outstanding || 0) > 0}
            sub={summary.unpaid_count ? `${summary.unpaid_count} unpaid` : 'All clear'}
          />
          <SummaryCard label="Total Invoices" value={summary.total_invoices ?? allInvoices.length} />
        </div>

        {/* Manage billing CTA */}
        <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Manage Billing & Payment Method</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your card, view receipts, or cancel your subscription via the secure Stripe portal.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <button
              onClick={handleManageBilling}
              disabled={managing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#0088CC,#003B8F)' }}
            >
              {managing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {managing ? 'Opening…' : 'Open Stripe Portal'}
            </button>
            {manageError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {manageError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Subscriptions ────────────────────────────────── */}
      {subscriptions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-primary" />
            Active Subscriptions
          </h3>
          {subscriptions.map(sub => (
            <SubscriptionCard key={sub.id} sub={sub} onManage={handleManageBilling} managing={managing} />
          ))}
        </div>
      )}

      {/* ── Security note ─────────────────────────────────────── */}
      <SubscriptionChangePanel
        project={project}
        order={order}
        subscription={subscription}
        onChanged={() => {
          load();
          onSubscriptionChanged?.();
        }}
      />

      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-green-600" />
        <span>Payment details are managed securely by <strong>Stripe</strong>. We never store your full card number.</span>
        {hasStripe && (
          <span className="ml-auto flex-shrink-0 text-xs font-bold bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
            Live Data
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Invoice History ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Invoice History</h3>
            {allInvoices.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{allInvoices.length}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'unpaid', label: 'Unpaid' },
                { key: 'paid', label: 'Paid' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setInvoiceFilter(f.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    invoiceFilter === f.key ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={load} disabled={loading} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="font-semibold text-foreground">
              {invoiceFilter === 'all' ? 'No invoices yet' : `No ${invoiceFilter} invoices`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {invoiceFilter === 'all' ? 'Invoices will appear here once billing begins.' : 'Try the "All" filter to see everything.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  {['Invoice', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => <InvoiceRow key={inv.id} inv={inv} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 30-day guarantee reassurance ──────────────────────── */}
      <GuaranteeCard />

      {/* ── Help callout ──────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-2">
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Billing Help
        </p>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li className="flex gap-2"><span>•</span><span>Click <strong>Open Stripe Portal</strong> to update your card, download receipts, or cancel.</span></li>
          <li className="flex gap-2"><span>•</span><span>Click <strong>Pay Now</strong> on any open invoice to complete the payment securely via Stripe.</span></li>
          <li className="flex gap-2"><span>•</span><span>Click the <Download className="inline w-3 h-3 mx-0.5" /> icon to download a PDF invoice for your records.</span></li>
          <li className="flex gap-2"><span>•</span><span>Questions? Email <a href="mailto:billing@clientsurgesystems.com" className="text-primary underline">billing@clientsurgesystems.com</a></span></li>
        </ul>
      </div>

    </div>
  );
}