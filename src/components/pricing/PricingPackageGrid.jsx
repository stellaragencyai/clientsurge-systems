import PackageCard from './PackageCard';

const packages = [
  {
    name: 'Starter System',
    description: 'Best for small local businesses that need fast lead response and missed-call text back.',
    setupFee: 399,
    monthlyFee: 249,
    outcome: 'Stop losing easy leads',
    automations: [
      'Instant lead response via SMS',
      'Missed call text back',
      'Lead capture form',
      'Basic lead tracking',
    ],
    ctaLabel: 'Start Starter',
    isRecommended: false,
  },
  {
    name: 'Growth System',
    description: 'Best for businesses that want automated follow-up, booking support, and better conversion tracking.',
    setupFee: 649,
    monthlyFee: 499,
    outcome: 'Turn more leads into booked appointments',
    automations: [
      'Instant lead response via SMS',
      'Missed call text back',
      'Automated email nurture sequences',
      'AI booking agent',
      'Daily lead digest',
      'Conversion analytics',
      'Client portal',
    ],
    ctaLabel: 'Start Growth',
    isRecommended: true,
    highlighted: true,
  },
  {
    name: 'Pro System',
    description: 'Best for businesses that want the full automation stack, AI voice, reactivation, analytics, and optimization.',
    setupFee: 1249,
    monthlyFee: 999,
    outcome: 'Build a complete lead-to-revenue operating system',
    automations: [
      'Instant lead response via SMS',
      'Missed call text back',
      'Automated email nurture sequences',
      'AI booking agent',
      'AI voice receptionist',
      'Lead reactivation campaigns',
      'Review request automation',
      'Advanced revenue tracking',
      'Conversion analytics & optimization',
      'Daily lead digest',
      'Client portal',
    ],
    ctaLabel: 'Start Pro',
    isRecommended: false,
  },
  {
    name: 'Agency System',
    description: 'Best for agencies that want to manage multiple client automation systems under one platform.',
    setupFee: null,
    monthlyFee: 'Custom',
    outcome: 'Sell and fulfill AI automation services at scale',
    automations: [
      'Manage unlimited clients',
      'White-label branding',
      'All Starter + Growth + Pro features',
      'Agency performance dashboard',
      'Client provisioning pipeline',
      'Dedicated support',
    ],
    ctaLabel: 'Talk About Agency Setup',
    isBestFor: true,
  },
];

export default function PricingPackageGrid({ onSelectPackage }) {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-black text-center mb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Choose Your Automation System
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, i) => (
            <PackageCard
              key={i}
              name={pkg.name}
              description={pkg.description}
              setupFee={pkg.setupFee}
              monthlyFee={pkg.monthlyFee}
              outcome={pkg.outcome}
              automations={pkg.automations}
              ctaLabel={pkg.ctaLabel}
              ctaAction={() => onSelectPackage?.(pkg.name)}
              isRecommended={pkg.isRecommended}
              isBestFor={pkg.isBestFor}
              highlighted={pkg.highlighted}
            />
          ))}
        </div>
      </div>
    </section>
  );
}