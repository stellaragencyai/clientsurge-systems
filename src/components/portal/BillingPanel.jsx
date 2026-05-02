import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, Eye, ExternalLink, Loader2, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';

const STATUS_COLORS = {
  paid: 'bg-green-50 border-green-200 text-green-700',
  unpaid: 'bg-red-50 border-red-200 text-red-700',
  partially_paid: 'bg-amber-50 border-amber-200 text-amber-700',
  overdue: 'bg-red-100 border-red-300 text-red-800',
};

const STATUS_ICONS = {
  paid: <CheckCircle2 className="w-4 h-4" />,
  unpaid: <AlertCircle className="w-4 h-4" />,
  partially_paid: <Clock className="w-4 h-4" />,
  overdue: <AlertCircle className="w-4 h-4" />,
};

export default function BillingPanel({ project }) {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingInvoiceId, setPayingInvoiceId] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, [project.id]);

  const loadInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('getClientInvoices', {
        project_id: project.id,
      });
      setInvoices(res.data.invoices || []);
      setSummary(res.data.summary || {});
    } catch (err) {
      setError('Failed to load invoices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    setPayingInvoiceId(invoiceId);
    try {
      const res = await base44.functions.invoke('createInvoicePaymentLink', {
        invoice_id: invoiceId,
      });
      if (res.data.payment_link) {
        window.open(res.data.payment_link, '_blank');
      }
    } catch (err) {
      setError('Failed to create payment link');
      console.error(err);
    } finally {
      setPayingInvoiceId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8 flex items-center justify-center min-h-96">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Invoices"
            value={summary.total_invoices || 0}
            color="blue"
          />
          <SummaryCard
            label="Outstanding Balance"
            value={`$${(summary.total_outstanding || 0).toFixed(2)}`}
            color={summary.total_outstanding > 0 ? 'red' : 'green'}
          />
          <SummaryCard
            label="Unpaid Invoices"
            value={summary.unpaid_count || 0}
            color="amber"
          />
          <SummaryCard
            label="Overdue"
            value={summary.overdue_count || 0}
            color={summary.overdue_count > 0 ? 'red' : 'gray'}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Invoice History
          </h3>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary/50" />
            </div>
            <p className="font-semibold text-foreground mb-1">No invoices yet</p>
            <p className="text-sm text-muted-foreground">Your invoices will appear here once your project begins billing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{invoice.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(invoice.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[invoice.payment_status]}`}>
                        {STATUS_ICONS[invoice.payment_status]}
                        {invoice.payment_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {invoice.pdf_url && (
                          <a
                            href={invoice.pdf_url}
                            download
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </a>
                        )}
                        {invoice.payment_status !== 'paid' && (
                          <button
                            onClick={() => handlePayInvoice(invoice.id)}
                            disabled={payingInvoiceId === invoice.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center gap-1.5"
                          >
                            {payingInvoiceId === invoice.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ExternalLink className="w-3 h-3" />
                            )}
                            {payingInvoiceId === invoice.id ? 'Processing...' : 'Pay Now'}
                          </button>
                        )}
                        {invoice.payment_status === 'paid' && (
                          <span className="text-xs font-semibold text-green-700">Paid</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
        <p className="text-sm font-semibold text-amber-900">Payment Information</p>
        <ul className="text-sm text-amber-800 space-y-1.5">
          <li className="flex gap-2">
            <span>•</span>
            <span>Click "Pay Now" to securely process payment via Stripe</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Download PDF invoices for your records</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Payment receipts are sent automatically to your email</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}