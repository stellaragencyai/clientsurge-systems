import { useState } from 'react';
import { PLAN_REGISTRY, PLAN_FEATURE_MAPPING } from '@/lib/saasProductizationConfig';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PricingTableWithFeatures({ highlightedPlan = 'growth_system' }) {
  const navigate = useNavigate();
  const [billingMode, setBillingMode] = useState('monthly');

  const plans = Object.values(PLAN_REGISTRY).sort((a, b) => a.tier_order - b.tier_order);

  const handleCheckout = (planType) => {
    navigate('/pricing', { state: { selectedPlan: planType, billingMode } });
  };

  return (
    <div className="w-full">
      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
          <button
            onClick={() => setBillingMode('monthly')}
            className={`px-6 py-2 rounded-md font-semibold transition ${
              billingMode === 'monthly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingMode('setup')}
            className={`px-6 py-2 rounded-md font-semibold transition ${
              billingMode === 'setup'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            One-Time Setup
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const features = PLAN_FEATURE_MAPPING[plan.plan_type]?.feature_keys || [];
          const price = billingMode === 'monthly' ? plan.monthly_fee_usd : plan.setup_fee_usd;
          const isHighlighted = plan.plan_type === highlightedPlan;

          return (
            <div
              key={plan.plan_type}
              className={`relative rounded-2xl border-2 transition-all ${
                isHighlighted
                  ? 'border-blue-600 bg-white shadow-xl scale-105'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              {isHighlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.display_name}</h3>
                <p className="text-sm text-slate-600 mb-6 h-10">{plan.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">${price.toLocaleString()}</span>
                    <span className="text-slate-600">
                      {billingMode === 'monthly' ? '/month' : 'one-time'}
                    </span>
                  </div>
                  {billingMode === 'monthly' && (
                    <p className="text-xs text-slate-500 mt-2">
                      + ${plan.setup_fee_usd} setup fee (one-time)
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout(plan.plan_type)}
                  className={`w-full py-3 rounded-lg font-semibold mb-8 flex items-center justify-center gap-2 transition ${
                    isHighlighted
                      ? 'cs-btn-primary'
                      : 'border border-slate-300 text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Features List */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase text-slate-600 mb-4">Includes:</p>
                  {features.slice(0, 6).map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                  {features.length > 6 && (
                    <p className="text-xs text-slate-500 pt-2">
                      + {features.length - 6} more features
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}