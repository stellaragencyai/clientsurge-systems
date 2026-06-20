import React, { useState } from 'react';
import { Target, Zap, TrendingUp, Users, DollarSign, ArrowRight, CheckCircle2, Star, Shield, Layers } from 'lucide-react';

const TIERS = [
  {
    name: 'Starter System',
    tagline: 'Entry-level automation adoption',
    price: '$497/mo + $797 setup',
    color: 'border-gray-200 bg-gray-50',
    headerColor: 'bg-gray-100 border-gray-200',
    badgeColor: 'bg-gray-200 text-gray-700',
    icon: Zap,
    idealFor: 'Local businesses beginning their automation journey',
    features: [
      'Instant lead response (SMS + Email)',
      'Missed call text-back automation',
      'Basic CRM + lead tracking',
      'Standard observability dashboard',
      'Up to 500 leads/mo',
      '1,000 SMS / 2,000 emails per month',
    ],
    notIncluded: ['Advanced lead intelligence', 'Funnel optimization', 'White-label', 'Command center'],
    positioning: 'Replaces the "manual response" step. Captures and responds to every lead instantly.',
  },
  {
    name: 'Growth System',
    tagline: 'Operational automation replacement',
    price: '$997/mo + $1,297 setup',
    color: 'border-blue-200 bg-blue-50',
    headerColor: 'bg-blue-600 border-blue-600',
    badgeColor: 'bg-blue-600 text-white',
    icon: TrendingUp,
    idealFor: 'Established businesses replacing manual CRM workflows',
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      'Full nurture sequence automation',
      'Lead reactivation campaigns',
      'AI booking agent',
      'Advanced lead intelligence & scoring',
      'Review request automation',
      'Full conversion analytics',
      'Up to 2,000 leads/mo',
      '5,000 SMS / 10,000 emails per month',
    ],
    notIncluded: ['White-label', 'Command center', 'Multi-client scaling'],
    positioning: 'Replaces the "manual follow-up" process entirely. Autonomous outreach at scale.',
  },
  {
    name: 'Pro System',
    tagline: 'Full business operating system',
    price: '$1,997/mo + $2,497 setup',
    color: 'border-purple-200 bg-purple-50',
    headerColor: 'bg-purple-700 border-purple-700',
    badgeColor: 'bg-purple-700 text-white',
    icon: Star,
    idealFor: 'High-volume operators or agencies managing multiple clients',
    features: [
      'Everything in Growth',
      'AI Command Center access',
      'Assisted Operations Mode',
      'Funnel optimization dashboard',
      'Conversion intelligence layer',
      'White-label branding support',
      'Multi-client scaling tools',
      'Advanced analytics & decision support',
      'Unlimited leads',
      'Priority support',
    ],
    notIncluded: [],
    positioning: 'Replaces the "business operations manager" role. Full autonomous execution layer.',
  },
];

const SEGMENTS = [
  {
    name: 'Med Spa',
    icon: '💆',
    pain: 'Consultations go uncontacted. Instagram DMs and website forms never get followed up.',
    value: 'Automated intake + instant SMS response within 2 min. AI books consultations 24/7.',
    revenue: '$3,000–$8,000/client/mo average',
    fit: 'Growth or Pro',
  },
  {
    name: 'Dental Clinics',
    icon: '🦷',
    pain: 'Phone calls go to voicemail. Patients book with the first practice that responds.',
    value: 'Missed call text-back + instant email follow-up = more patients booked without extra staff.',
    revenue: '$2,000–$5,000/client/mo average',
    fit: 'Starter or Growth',
  },
  {
    name: 'HVAC Contractors',
    icon: '❄️',
    pain: 'Seasonal leads lost during peak hours. No systematic follow-up after missed calls.',
    value: 'Every missed call triggers automated text-back + service booking link within 60 seconds.',
    revenue: '$1,500–$4,000/client/mo average',
    fit: 'Starter',
  },
  {
    name: 'Roofing Companies',
    icon: '🏠',
    pain: 'High-intent storm damage leads go cold within hours without fast follow-up.',
    value: 'Instant response + lead scoring identifies highest-value estimate requests immediately.',
    revenue: '$2,000–$6,000/client/mo average',
    fit: 'Growth',
  },
  {
    name: 'Local Service Businesses',
    icon: '🔧',
    pain: 'Competing on price because they respond slower than competitors.',
    value: 'Speed-to-lead advantage: automating the first 5 touchpoints within 24 hours.',
    revenue: '$1,000–$3,000/client/mo average',
    fit: 'Starter or Growth',
  },
];

const FUNNEL_STEPS = [
  {
    step: 1,
    label: 'Awareness',
    description: 'Free lead audit or system demo',
    detail: 'Show the prospect how many leads they\'re currently losing. Use real data from their industry.',
    icon: '👁️',
    cta: 'Free lead audit / ROI estimate',
  },
  {
    step: 2,
    label: 'Interest',
    description: 'Live system demo or recorded walkthrough',
    detail: 'Walk through the full automation flow: lead capture → instant response → follow-up → booking.',
    icon: '⚡',
    cta: 'Book a 20-min demo',
  },
  {
    step: 3,
    label: 'Decision',
    description: 'Tier selection + pricing conversation',
    detail: 'Match the prospect to Starter, Growth, or Pro based on lead volume and business complexity.',
    icon: '🎯',
    cta: 'Choose a plan + setup call',
  },
  {
    step: 4,
    label: 'Activation',
    description: 'Onboarding + system setup',
    detail: 'Client fills onboarding form. Setup takes 3–5 days. System goes live with real leads.',
    icon: '🚀',
    cta: 'System live within 5 days',
  },
];

function TierCard({ tier }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = tier.icon;
  return (
    <div className={`rounded-xl border-2 overflow-hidden ${tier.color} flex flex-col`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${tier.headerColor} flex items-start justify-between gap-3`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            {tier.badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${tier.badgeColor}`}>
                {tier.badge}
              </span>
            )}
          </div>
          <h3 className={`font-bold text-lg ${tier.headerColor.includes('bg-gray') ? 'text-foreground' : 'text-white'}`}>
            {tier.name}
          </h3>
          <p className={`text-xs mt-0.5 ${tier.headerColor.includes('bg-gray') ? 'text-muted-foreground' : 'text-white/80'}`}>
            {tier.tagline}
          </p>
        </div>
        <Icon className={`w-7 h-7 flex-shrink-0 ${tier.headerColor.includes('bg-gray') ? 'text-muted-foreground' : 'text-white'}`} />
      </div>

      {/* Price */}
      <div className="px-5 py-4 border-b border-current border-opacity-10">
        <p className="text-xl font-bold text-foreground">{tier.price}</p>
        <p className="text-xs text-muted-foreground mt-1">{tier.idealFor}</p>
      </div>

      {/* Positioning */}
      <div className="px-5 py-3 border-b border-current border-opacity-10">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Market Position</p>
        <p className="text-sm text-foreground font-medium italic">"{tier.positioning}"</p>
      </div>

      {/* Features */}
      <div className="px-5 py-4 flex-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Includes</p>
        <ul className="space-y-1.5">
          {tier.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-foreground">{f}</span>
            </li>
          ))}
        </ul>
        {tier.notIncluded.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="mt-3 text-xs text-muted-foreground underline">
            {expanded ? 'Hide' : 'Show'} what\'s not included
          </button>
        )}
        {expanded && tier.notIncluded.length > 0 && (
          <ul className="mt-2 space-y-1">
            {tier.notIncluded.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5 opacity-50">✕</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SegmentCard({ seg }) {
  return (
    <div className="rounded-lg border border-border bg-white p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl flex-shrink-0">{seg.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-foreground">{seg.name}</p>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{seg.fit}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{seg.revenue}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-red-600 mb-1">Pain</p>
          <p className="text-sm text-muted-foreground">{seg.pain}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-green-600 mb-1">Our Value</p>
          <p className="text-sm text-foreground">{seg.value}</p>
        </div>
      </div>
    </div>
  );
}

function FunnelStep({ step }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-border flex items-center justify-center font-bold text-foreground text-sm">
        {step.step}
      </div>
      <div className="flex-1 pb-6 relative">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{step.icon}</span>
              <p className="font-bold text-foreground">{step.label}</p>
            </div>
            <p className="text-sm font-medium text-primary mt-0.5">{step.description}</p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-lg bg-muted border border-border font-medium text-muted-foreground flex-shrink-0">
            {step.cta}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{step.detail}</p>
      </div>
    </div>
  );
}

export default function GTMStrategyPanel() {
  return (
    <div className="space-y-10 max-w-6xl">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Go-To-Market Strategy</span>
          </div>
          <h1 className="text-3xl font-black text-foreground leading-tight">
            ClientSurge is an AI-powered business operating system that converts website traffic into automated revenue systems.
          </h1>
          <p className="text-muted-foreground mt-4 text-base leading-relaxed">
            While traditional CRMs require humans to execute every step, ClientSurge automates the entire lead activation lifecycle — from first contact to booked appointment — with zero manual intervention.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '⚡', stat: '< 2 min', label: 'Average first response time' },
              { icon: '🤖', stat: '100%', label: 'Automated follow-up execution' },
              { icon: '📈', stat: '3–5x', label: 'Lead conversion improvement' },
            ].map(({ icon, stat, label }) => (
              <div key={label} className="rounded-lg bg-white border border-border p-4 text-center">
                <span className="text-2xl">{icon}</span>
                <p className="text-2xl font-black text-foreground mt-1">{stat}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Pricing Tiers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map(tier => <TierCard key={tier.name} tier={tier} />)}
        </div>
      </div>

      {/* Pricing Logic */}
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center gap-2 mb-5">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Pricing Logic Framework</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              tier: 'Starter',
              color: 'bg-gray-50 border-gray-200',
              headline: 'Entry-level automation adoption',
              logic: 'Sell to businesses that are still manually responding to leads. The ROI is immediate — every lead they were losing now gets followed up.',
              objection: '"We already follow up manually."',
              answer: 'Not within 2 minutes, at 2am, on weekends.',
            },
            {
              tier: 'Growth',
              color: 'bg-blue-50 border-blue-200',
              headline: 'Operational automation replacement',
              logic: 'Sell to businesses that have outgrown manual CRMs. They have volume, but no systems. The cost of a Growth plan is less than one part-time hire.',
              objection: '"We have a CRM already."',
              answer: 'A CRM tracks. ClientSurge executes. There\'s no comparison.',
            },
            {
              tier: 'Pro',
              color: 'bg-purple-50 border-purple-200',
              headline: 'Full business operating system',
              logic: 'Sell to high-volume operators, agencies, or businesses with multiple locations. Pro replaces an ops manager role entirely.',
              objection: '"That\'s expensive."',
              answer: 'At $1,997/mo, if it books 2 extra clients per month, it pays for itself 3x over.',
            },
          ].map(({ tier, color, headline, logic, objection, answer }) => (
            <div key={tier} className={`rounded-lg border p-5 ${color}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{tier} System</p>
              <p className="font-bold text-foreground mb-3">{headline}</p>
              <p className="text-sm text-muted-foreground mb-4">{logic}</p>
              <div className="rounded p-3 bg-white/60 border border-white">
                <p className="text-xs font-bold text-red-600 mb-1">Common objection</p>
                <p className="text-sm italic text-muted-foreground">{objection}</p>
                <p className="text-xs font-bold text-green-600 mt-2 mb-1">Response</p>
                <p className="text-sm text-foreground">{answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Segments */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Target Customer Segments</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SEGMENTS.map(seg => <SegmentCard key={seg.name} seg={seg} />)}
        </div>
      </div>

      {/* Conversion Funnel */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <ArrowRight className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Conversion Funnel Strategy</h2>
        </div>
        <div className="rounded-xl border border-border bg-white p-6">
          <div className="divide-y divide-border">
            {FUNNEL_STEPS.map(step => (
              <div key={step.step} className="py-5 first:pt-0 last:pb-0">
                <FunnelStep step={step} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Differentiation */}
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Positioning vs Competitors</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="text-left px-4 py-3 font-bold text-foreground">Capability</th>
                <th className="text-center px-4 py-3 font-bold text-muted-foreground">Traditional CRM</th>
                <th className="text-center px-4 py-3 font-bold text-muted-foreground">GoHighLevel</th>
                <th className="text-center px-4 py-3 font-bold text-primary">ClientSurge</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Instant lead response (< 2 min)', '❌', '⚠️ Manual setup', '✅ Automatic'],
                ['AI-powered lead scoring', '❌', '❌', '✅ Built-in'],
                ['Autonomous follow-up execution', '❌', '⚠️ Requires workflows', '✅ Pre-configured'],
                ['Industry-specific automation', '❌', '❌', '✅ Per-industry defaults'],
                ['Onboarding in < 5 days', '❌', '❌', '✅ Done-for-you'],
                ['No learning curve for clients', '❌', '❌', '✅ Fully managed'],
              ].map(([cap, crm, ghl, cs], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-medium text-foreground">{cap}</td>
                  <td className="px-4 py-3 text-center text-sm">{crm}</td>
                  <td className="px-4 py-3 text-center text-sm">{ghl}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-green-700">{cs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground border-t border-border pt-6 italic">
        This is a read-only strategic planning view. No system behavior, data, or automation is affected.
      </p>
    </div>
  );
}