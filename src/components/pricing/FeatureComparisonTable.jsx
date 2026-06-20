import { Check, X } from 'lucide-react';

const features = [
  'Instant Lead Response',
  'Missed Call Text Back',
  'Nurture Sequence',
  'AI Booking Agent',
  'Daily Lead Digest',
  'AI Voice Receptionist',
  'Lead Reactivation',
  'Review Request Automation',
  'Client Portal',
  'Revenue Tracking',
  'Conversion Analytics',
  'Agency Multi-Client Dashboard',
];

const featureMatrix = {
  'Instant Lead Response': { starter: true, growth: true, elite: true, agency: true },
  'Missed Call Text Back': { starter: true, growth: true, elite: true, agency: true },
  'Nurture Sequence': { starter: false, growth: true, elite: true, agency: true },
  'AI Booking Agent': { starter: false, growth: true, elite: true, agency: true },
  'Daily Lead Digest': { starter: false, growth: true, elite: true, agency: true },
  'AI Voice Receptionist': { starter: false, growth: false, elite: true, agency: true },
  'Lead Reactivation': { starter: false, growth: false, elite: true, agency: true },
  'Review Request Automation': { starter: false, growth: false, elite: true, agency: true },
  'Client Portal': { starter: false, growth: true, elite: true, agency: true },
  'Revenue Tracking': { starter: false, growth: true, elite: true, agency: true },
  'Conversion Analytics': { starter: false, growth: true, elite: true, agency: true },
  'Agency Multi-Client Dashboard': { starter: false, growth: false, elite: false, agency: true },
};

function FeatureCell({ included }) {
  return (
    <div className="flex justify-center">
      {included ? (
        <Check className="w-5 h-5 text-green-600" />
      ) : (
        <X className="w-5 h-5 text-slate-300" />
      )}
    </div>
  );
}

export default function FeatureComparisonTable() {
  return (
    <section className="py-16 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900 text-center mb-12">
          Feature Comparison
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left py-4 px-6 font-semibold text-slate-900">
                  Feature
                </th>
                <th className="text-center py-4 px-6 font-semibold text-slate-900">
                  Starter
                </th>
                <th className="text-center py-4 px-6 font-semibold text-slate-900 bg-blue-50">
                  Growth
                </th>
                <th className="text-center py-4 px-6 font-semibold text-slate-900">
                  Elite
                </th>
                <th className="text-center py-4 px-6 font-semibold text-slate-900">
                  Agency
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-slate-200 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  }`}
                >
                  <td className="py-4 px-6 font-medium text-slate-700">{feature}</td>
                  <td className="py-4 px-6">
                    <FeatureCell included={featureMatrix[feature].starter} />
                  </td>
                  <td className="py-4 px-6 bg-blue-50">
                    <FeatureCell included={featureMatrix[feature].growth} />
                  </td>
                  <td className="py-4 px-6">
                    <FeatureCell included={featureMatrix[feature].elite} />
                  </td>
                  <td className="py-4 px-6">
                    <FeatureCell included={featureMatrix[feature].agency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}