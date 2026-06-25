import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2 } from 'lucide-react';

// Canonical product_ids mapping per package
const PRODUCT_IDS_MAP = {
  starter_system: ['prod_UNi5RHiKNSTfQl', 'prod_UNi5QL0bQl98If'],
  starter: ['prod_UNi5RHiKNSTfQl', 'prod_UNi5QL0bQl98If'],
  growth_system: ['prod_UNi5RHiKNSTfQl', 'prod_UNi5QL0bQl98If', 'prod_UNi5N0l5MtaV0R', 'prod_UNi5fLL2SyJJdP'],
  growth: ['prod_UNi5RHiKNSTfQl', 'prod_UNi5QL0bQl98If', 'prod_UNi5N0l5MtaV0R', 'prod_UNi5fLL2SyJJdP'],
  pro_system: ['prod_UNi5RHiKNSTfQl', 'prod_UNi5QL0bQl98If', 'prod_UNi5N0l5MtaV0R', 'prod_UNi5fLL2SyJJdP', 'prod_UNi5PWv05ECzXI', 'prod_UNi5dvOUm6Fi9i'],
  pro: ['prod_UNi5RHiKNSTfQl', 'prod_UNi5QL0bQl98If', 'prod_UNi5N0l5MtaV0R', 'prod_UNi5fLL2SyJJdP', 'prod_UNi5PWv05ECzXI', 'prod_UNi5dvOUm6Fi9i'],
  elite_system: ['prod_UNi5RHiKNSTfQl', 'prod_UNi5QL0bQl98If', 'prod_UNi5N0l5MtaV0R', 'prod_UNi5fLL2SyJJdP', 'prod_UNi5PWv05ECzXI', 'prod_UNi5dvOUm6Fi9i'],
  elite: ['prod_UNi5RHiKNSTfQl', 'prod_UNi5QL0bQl98If', 'prod_UNi5N0l5MtaV0R', 'prod_UNi5fLL2SyJJdP', 'prod_UNi5PWv05ECzXI', 'prod_UNi5dvOUm6Fi9i'],
};

/**
 * Stripe Checkout Button — Production Ready
 *
 * Handles:
 * - Iframe sandbox detection (blocks checkout in editor preview)
 * - Customer info collection (public app — no login required)
 * - Stripe session creation via backend
 * - Redirection to Stripe Checkout
 * - Error display
 *
 * Props:
 * - packageKey: 'starter_system' | 'growth_system' | 'pro_system' (or aliases like 'starter', 'elite')
 * - label: button text
 */
export default function CheckoutButton({ packageKey, label = 'Get Started' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', business: '', phone: '' });

  const handleCheckout = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.business.trim()) {
      setError('Please fill in your name, email, and business name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Detect iframe sandbox (Base44 editor)
      if (window.self !== window.top) {
        setError('Checkout only works on the published app, not in the editor preview. Deploy your app and try again.');
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('createCheckoutSession', {
        product_ids: PRODUCT_IDS_MAP[packageKey],
        package_key: packageKey,
        selected_package_type: packageKey,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        business_name: form.business,
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/pricing`,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setError(response.data?.error || 'Failed to create checkout session.');
      }
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="w-full">
        <button
          onClick={() => setShowForm(true)}
          className="cs-btn-primary w-full flex items-center justify-center gap-2"
          style={{ minHeight: 'unset', minWidth: 'unset' }}
        >
          {label}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Full Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Jane Smith"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="owner@yourbusiness.com"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Business Name *</label>
        <input
          type="text"
          value={form.business}
          onChange={(e) => setForm({ ...form, business: e.target.value })}
          placeholder="ABC Roofing Co."
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Phone (optional)</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(602) 555-0100"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="cs-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ minHeight: 'unset', minWidth: 'unset' }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Continue to Payment'
        )}
      </button>
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}