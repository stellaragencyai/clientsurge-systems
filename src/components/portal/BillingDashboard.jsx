import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  CreditCard, Download, ExternalLink, Loader2, AlertCircle,
  CheckCircle2, Clock, RefreshCw, FileText, ShieldCheck, Zap,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(cents) {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    active:          { cls: 'bg-green-100 border-green-300 text-green-800',  icon: CheckCircle2, label: 'Active' },
    paid:            { cls: 'bg-green-100 border-green-300 text-green-800',  icon: CheckCircle2, label: 'Paid' },
    partially_paid:  { cls: 'bg-amber-100 border-amber-300 text-amber-800',  icon: Clock,        label: 'Partially Paid' },
    unpaid:          { cls: 'bg-red-100   border-red-300   text-red-800',    icon: AlertCircle,  label: 'Unpaid' },
    overdue:         { cls: 'bg-red-100   border-red-300   text-red-800',    icon: AlertCircle,  label: 'Overdue' },
    draft:           { cls: 'bg-gray-100  border-gray-300  text-gray-700',   icon: FileText,     label: 'Draft' },
    cancelled:       { cls: 'bg-gray-100  border-gray-300  text-gray-700',   icon: FileText,     label: 'Cancelled' },
  };
  const cfg = map[status] || map.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-bold ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

function SummaryCard({ label, value, sub, accent }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'}`}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function InvoiceRow({ invoice, onPay, paying }) {
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-foreground">{invoice.invoice_number}</p>
        {invoice.description && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{invoice.description}</p>}
      </td>
      <td className="px-5 py-4 text-sm text-foreground">{formatDate(invoice.issue_date)}</td>
      <td className="px-5 py-4 text-sm text-foreground">{formatDate(invoice.due_date)}</td>
      <td className="px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency((invoice.amount || 0) * 100)}</td>
      <td className="px-5 py-4"><StatusBadge status={invoice.payment_status} /></td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {invoice.pdf_url && (
            <a
              href={invoice.pdf_url}
              download
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Download PDF"
            >
              <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </a>
          )}
          {invoice.payment_status !== 'paid' && invoice.payment_status !== 'cancelled' && (
            <button
              onClick={() => onPay(invoice.id)}
              disabled={paying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {paying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
              Pay Now
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function BillingDashboard({ project, subscription }) {
  const [invoices, setInvoices]     = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [payingId, setPayingId]     = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError]     = useState('');

  useEffect(() => { loadInvoices(); }, [project?.id]);

  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getClientInvoices', { project_id: project.id });
      setInvoices(res.data.invoices || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      setError('Failed to load billing data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    setPayingId(invoiceId);
    try {
      const res = await base44.functions.invoke('createInvoicePaymentLink', { invoice_id: invoiceId });
      if (res.data.payment_link) window.open(res.data.payment_link, '_blank');
    } catch {
      setError('Failed to create payment link.');
    } finally {
      setPayingId(null);
    }
  };

  const handleUpdateCard = async () => {
    setPortalLoading(true);
    setPortalError('');
    try {
      const res = await base44.functions.invoke('getStripeCustomerPortalUrl', {
        return_url: window.location.href,
      });
      if (res.data.url) window.open(res.data.url, '_blank');
    } catch (err) {
      setPortalError(err?.data?.error || 'Unable to open billing portal. Please contact support.');
    } finally {
      setPortalLoading(false);
    }
  };

  // ── subscription status derived ──────────────────────────────────────────
  const subStatus   = subscription?.status || 'unknown';
  const renewsOn    = subscription?.current_period_end;
  const currentPlan = subscription?.plan_type || project?.plan || '—';

  return (
    <div className="space-y-8">

      {/* ── Subscription Status Card ──────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        {/* gradient header */}
        <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 60%,#c8965c 100%)' }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold text-amber-300/70 uppercase tracking-widest mb-1">Your Subscription</p>
              <h2 className="text-xl font-display font-semibold text-white">{currentPlan}</h2>
            </div>
            <StatusBadge status={subStatus} />
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="Status"     value={subStatus === 'active' ? 'Active' : subStatus} accent={subStatus === 'active'} />
          <SummaryCard label="Next Renewal" value={renewsOn ? formatDate(renewsOn) : '—'} sub="Auto-renews" />
          <SummaryCard label="Outstanding" value={summary ? `$${(summary.total_outstanding || 0).toFixed(2)}` : '—'} accent={summary?.total_outstanding > 0} />
          <SummaryCard label="Invoices" value={summary?.total_invoices ?? '—'} sub={`${summary?.unpaid_count || 0} unpaid`} />
        </div>

        {/* Update payment method CTA */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-border pt-5">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Update Payment Method</p>
              <p className="text-xs text-muted-foreground mt-0.5">Change your credit card or billing details securely via Stripe.</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 items-start sm:items-end">
            <button
              onClick={handleUpdateCard}
              disabled={portalLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#6b3f1f,#9a5c2e)' }}
            >
              {portalLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CreditCard className="w-4 h-4" />}
              {portalLoading ? 'Opening…' : 'Manage Payment'}
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
            {portalError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {portalError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Security note ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <ShieldCheck className="w-4 h-4 flex-shrink-0 text-green-600" />
        Payment details are managed securely by Stripe. We never store your full card number.
      </div>

      {/* ── Invoices ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Invoice History</h3>
          </div>
          <button
            onClick={loadInvoices}
            disabled={loading}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading invoices…
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="font-semibold text-foreground">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1">Invoices will appear here once billing begins.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-muted/40 border-b border-border text-xs font-semibold text-foreground uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Invoice</th>
                  <th className="px-5 py-3 text-left">Issued</th>
                  <th className="px-5 py-3 text-left">Due</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    onPay={handlePayInvoice}
                    paying={payingId === inv.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payment instructions ──────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
        <p className="text-sm font-semibold text-amber-900 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Payment Information
        </p>
        <ul className="text-sm text-amber-800 space-y-1.5">
          <li className="flex gap-2"><span>•</span><span>Click <strong>Pay Now</strong> to securely complete outstanding invoices via Stripe.</span></li>
          <li className="flex gap-2"><span>•</span><span>Click <strong>Manage Payment</strong> above to update your card or view payment history in Stripe.</span></li>
          <li className="flex gap-2"><span>•</span><span>PDF invoices can be downloaded using the <Download className="inline w-3 h-3" /> icon on each row.</span></li>
          <li className="flex gap-2"><span>•</span><span>Payment receipts are automatically emailed to you after each successful charge.</span></li>
        </ul>
      </div>

    </div>
  );
}