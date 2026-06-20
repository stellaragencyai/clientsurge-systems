import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2 } from 'lucide-react';

/**
 * Stripe Checkout Button — Production Ready
 * 
 * Handles:
 * - Iframe sandbox detection (blocks checkout in editor preview)
 * - Stripe session creation via backend
 * - Redirection to Stripe Checkout
 * - Error display
 */
export default function CheckoutButton({ planType, billingMode = 'monthly', label = 'Get Started' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Detect iframe sandbox (Base44 editor)
      if (window.self !== window.top) {
        setError('Checkout only works on the published app, not in the editor preview. Deploy your app and try again.');
        setLoading(false);
        return;
      }

      // Create checkout session
      const response = await base44.functions.invoke('createCheckoutSession', {
        plan_type: planType,
        billing_mode: billingMode,
      });

      if (response.data?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        setError(response.data?.error || 'Failed to create checkout session.');
      }
    } catch (err) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Processing...
          </>
        ) : (
          label
        )}
      </button>
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}