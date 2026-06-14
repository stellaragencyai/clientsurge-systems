import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { setPageMetadata } from '@/lib/seo';
import { ArrowRight, ChevronRight } from 'lucide-react';

const PLANS = {
  starter_system: { name: 'Starter System', setup: 797, monthly: 497 },
  growth_system: { name: 'Growth System', setup: 1297, monthly: 997 },
  pro_system: { name: 'Pro System', setup: 2497, monthly: 1997 },
};

export default function ProductSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(
    searchParams.get('plan') || 'starter_system'
  );
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    email: '',
    phone: '',
    industry: 'Services',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPageMetadata({
      title: 'Start Your Free Trial | ClientSurge Systems',
      description: '14-day free trial of AI lead automation. No credit card required.',
      canonicalPath: '/signup',
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContinue = async () => {
    if (!formData.full_name || !formData.business_name || !formData.email || !formData.phone) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create WebsiteLead to capture funnel traffic
      await base44.entities.WebsiteLead.create({
        full_name: formData.full_name,
        business_name: formData.business_name,
        email: formData.email,
        phone_number: formData.phone,
        business_type: formData.industry,
        source: 'product_signup_flow',
        lead_status: 'new',
        consent_given: true,
        consent_given_at: new Date().toISOString(),
      });

      // Move to plan selection if not already selected
      if (step === 1) {
        setStep(2);
      } else {
        // Proceed to checkout
        handleCheckout();
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      // Redirect to checkout with plan and email
      const response = await base44.functions.invoke('createCheckoutSession', {
        email: formData.email,
        business_name: formData.business_name,
        selected_package_type: selectedPlan,
      });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Start Your Free Trial</h1>
          <p className="text-muted-foreground text-lg">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
            step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
            step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
            step >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Your Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Business Name *</label>
                <input
                  type="text"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleInputChange}
                  placeholder="Your Business LLC"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@business.com"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue to Plan Selection {!loading && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Step 2: Plan Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
              <div className="space-y-4">
                {Object.entries(PLANS).map(([key, plan]) => (
                  <label
                    key={key}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPlan === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={key}
                      checked={selectedPlan === key}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                      className="mr-3"
                    />
                    <div className="inline-block">
                      <div className="font-semibold">{plan.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${plan.setup} setup + ${plan.monthly}/month
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-border text-foreground rounded-lg font-semibold hover:bg-muted"
                >
                  Back
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>🔒 Your data is secure • 🚀 Setup in minutes • 💪 14-day free trial</p>
        </div>
      </div>
    </div>
  );
}