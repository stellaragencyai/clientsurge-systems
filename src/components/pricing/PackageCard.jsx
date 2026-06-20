import { Check, ArrowRight } from 'lucide-react';

export default function PackageCard({
  name,
  description,
  setupFee,
  monthlyFee,
  automations = [],
  outcome,
  ctaLabel,
  ctaAction,
  isRecommended = false,
  isBestFor = false,
  highlighted = false,
}) {
  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        highlighted
          ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
          : 'border-slate-200 bg-white hover:shadow-md'
      }`}
    >
      {/* Badges */}
      {isRecommended && (
        <div className="flex justify-center pt-4">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            RECOMMENDED
          </span>
        </div>
      )}
      {isBestFor && (
        <div className="flex justify-center pt-4">
          <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            BEST FOR AGENCIES
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-8">
        {/* Package Name */}
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{name}</h3>

        {/* Best For */}
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{description}</p>

        {/* Pricing */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <div className="flex items-baseline gap-2 mb-2">
            {setupFee && (
              <>
                <span className="text-3xl font-bold text-slate-900">${setupFee}</span>
                <span className="text-sm text-slate-600">setup</span>
              </>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">${monthlyFee}</span>
            <span className="text-sm text-slate-600">/month</span>
          </div>
        </div>

        {/* Outcome */}
        <p className="font-semibold text-slate-900 mb-6">
          {outcome ? `Outcome: ${outcome}` : ''}
        </p>

        {/* Automations */}
        {automations.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-4">
              Included Automations
            </p>
            <ul className="space-y-3">
              {automations.map((automation, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{automation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={ctaAction}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
            highlighted
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
          }`}
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}