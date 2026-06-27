import { useState } from 'react';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { getPackageOffer, normalizePackageKey } from '@/lib/salesCatalog';

/**
 * Stripe Checkout Button — redirects to canonical Stripe Payment Link.
 *
 * Props:
 * - packageKey: 'starter_system' | 'growth_system' | 'pro_system' (or aliases)
 * - label: button text
 */
export default function CheckoutButton({ packageKey, label = 'Get Started' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = () => {
    setError(null);

    // Iframe sandbox guard — checkout only works on the published app
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setError('Checkout only works on the published app, not in the editor preview. Deploy your app and try again.');
      return;
    }

    const normalizedKey = normalizePackageKey(packageKey);
    const offer = getPackageOffer(normalizedKey);

    if (!offer?.checkout_url) {
      setError('Checkout is not available for this package. Please contact support.');
      return;
    }

    setLoading(true);
    window.location.href = offer.checkout_url;
  };

  return (
    <div className="w-full">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="cs-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
        style={{ minHeight: 'unset', minWidth: 'unset' }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            {label}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm mt-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}