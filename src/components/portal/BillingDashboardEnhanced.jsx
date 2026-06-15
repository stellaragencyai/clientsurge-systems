import { Download, DollarSign, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BillingDashboardEnhanced({ orderId, subscriptionId }) {
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        const response = await fetch(`/api/billing-summary?order_id=${orderId}`, {
          method: 'GET',
        });
        if (response.ok) {
          const data = await response.json();
          setBilling(data.summary);
          setInvoices(data.invoices || []);
        }
      } catch (err) {
        console.error('Failed to fetch billing:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, [orderId]);

  if (loading) return <div className="h-40 bg-muted rounded-lg animate-pulse" />;
  if (!billing) return null;

  return (
    <div className="space-y-4">
      {/* Fee breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">Setup Fee</span>
          </div>
          <p className="text-2xl font-bold">${billing.setup_fee || '0'}</p>
          <p className="text-xs text-muted-foreground mt-1">One-time, due today</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-xs font-semibold uppercase text-muted-foreground">Monthly Recurring</span>
          </div>
          <p className="text-2xl font-bold">${billing.monthly_fee || '0'}</p>
          <p className="text-xs text-muted-foreground mt-1">Starting {new Date(billing.billing_start_date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Subscription updates */}
      {billing.subscription_updates && billing.subscription_updates.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Upcoming Changes</p>
          <ul className="text-xs text-amber-800 mt-2 space-y-1">
            {billing.subscription_updates.map((update, idx) => (
              <li key={idx}>
                • {update.change_type} → ${update.new_amount} (effective {update.effective_date})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invoice history */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-3">Invoice History</p>
        {invoices.length === 0 ? (
          <p className="text-xs text-muted-foreground">No invoices yet</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                <div>
                  <p className="text-xs font-medium">${invoice.amount}</p>
                  <p className="text-xs text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</p>
                </div>
                <a
                  href={`/api/invoice-pdf/${invoice.id}`}
                  download
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary text-white text-xs font-semibold hover:opacity-90"
                >
                  <Download className="w-3 h-3" /> PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold mb-2">Payment Method</p>
        <p className="text-xs text-muted-foreground mb-3">Charged on day {billing.billing_day} of each month</p>
        <button className="w-full px-4 py-2 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5">
          Update Payment Method
        </button>
      </div>
    </div>
  );
}