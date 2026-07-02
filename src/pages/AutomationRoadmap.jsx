import React from 'react';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    title: 'Foundation & Core Automations',
    status: 'complete',
    description: 'The core engine that powers lead capture, instant response, and missed-call recovery.',
    items: [
      'Instant Lead Response SMS (under 60 seconds)',
      'Missed Call Text-Back automation',
      'AI lead qualification & scoring',
      'Automated booking link delivery',
      'Multi-channel follow-up sequences (SMS + Email)',
      'Admin real-time lead notifications',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Onboarding & Client Portal',
    status: 'complete',
    description: 'Streamlined onboarding flow that activates new clients within 48 hours of purchase.',
    items: [
      'Post-purchase intake form & business setup',
      'Client dashboard with live installation tracking',
      '6-step automation checklist system',
      'Automated client welcome & setup emails',
      'Credential collection & Twilio provisioning',
      'Go-live readiness verification',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Voice AI & Advanced Routing',
    status: 'in_progress',
    description: 'ElevenLabs-powered voice agents for inbound reception and outbound hot-lead calls.',
    items: [
      'AI inbound voice receptionist (industry-aware)',
      'Automated outbound calls for HOT leads (score ≥ 75)',
      'Payment recovery voice calls for failed invoices',
      'Daily AI-generated business briefing call',
      'Post-call webhook logging & transcription',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Intelligence & Conversion Optimization',
    status: 'in_progress',
    description: 'Predictive analytics that identify revenue leaks and recommend next-best-actions.',
    items: [
      'Lead Next-Best-Action predictive scoring',
      'Conversion funnel analytics per client',
      'Revenue attribution tracking',
      'A/B testing framework for message templates',
      'Conversion optimization signal detection',
      'Churn risk prediction engine',
    ],
  },
  {
    phase: 'Phase 5',
    title: 'Multi-Industry Templates & GTM',
    status: 'planned',
    description: 'Pre-configured automation blueprints for every supported local service vertical.',
    items: [
      'Industry-specific SMS/email template libraries',
      'Business config templates (Med Spa, Dental, HVAC, etc.)',
      'Go-to-market launch engine & campaign tracking',
      'Landing page analytics & attribution',
      'GA4 conversion tracking integration',
      'Automated review request system',
    ],
  },
  {
    phase: 'Phase 6',
    title: 'Agency & White-Label Layer',
    status: 'planned',
    description: 'Multi-tenant agency management with revenue sharing and white-label branding.',
    items: [
      'Agency workspace & client mapping',
      'Revenue share & commission tracking',
      'White-label branding configuration',
      'Agency performance dashboard',
      'Bulk client provisioning pipeline',
      'Per-agency webhook isolation',
    ],
  },
];

const STATUS_CONFIG = {
  complete: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    label: 'Complete',
  },
  in_progress: {
    icon: Clock,
    color: 'text-[#00AEEF]',
    bg: 'bg-[#00AEEF]/10',
    border: 'border-[#00AEEF]/30',
    label: 'In Progress',
  },
  planned: {
    icon: ArrowRight,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    label: 'Planned',
  },
};

export default function AutomationRoadmap() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="cs-section-header cs-section-header--center">
            <p className="cs-section-eyebrow">Product Vision</p>
            <div className="cs-section-title-row cs-section-header--center">
              <span className="cs-section-bar" />
              <h1 className="cs-section-title">Automation Roadmap</h1>
            </div>
          </div>
          <p className="cs-section-subtitle mt-4">
            Our commitment to building the most complete AI automation platform for local
            service businesses. Here's exactly what's live, what's in progress, and what's coming next.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#00AEEF] via-[#00AEEF]/40 to-transparent hidden md:block" />

            <div className="space-y-8">
              {ROADMAP_PHASES.map((phase, idx) => {
                const cfg = STATUS_CONFIG[phase.status];
                const Icon = cfg.icon;

                return (
                  <div
                    key={idx}
                    className="relative md:pl-16"
                  >
                    {/* Node */}
                    <div
                      className={`absolute left-0 top-6 w-12 h-12 rounded-full ${cfg.bg} ${cfg.border} border-2 flex items-center justify-center hidden md:flex`}
                    >
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8">
                      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-[#00AEEF]">
                            {phase.phase}
                          </span>
                          <h2 className="font-titles text-xl md:text-2xl font-bold text-black mt-1">
                            {phase.title}
                          </h2>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                        {phase.description}
                      </p>

                      <ul className="space-y-2.5">
                        {phase.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm">
                            <div className={`w-5 h-5 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <Icon className={`w-3 h-3 ${cfg.color}`} />
                            </div>
                            <span className="text-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-4">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-[#00AEEF] to-[#006BB0] rounded-2xl p-10 text-white">
          <h2 className="font-titles text-2xl md:text-3xl font-bold mb-3">
            Ready to automate your business?
          </h2>
          <p className="text-white/90 mb-6">
            Book a free discovery call and see exactly which automations we'd deploy for your industry.
          </p>
          <a href="/book" className="inline-flex items-center gap-2 bg-white text-[#006BB0] font-bold px-6 py-3 rounded-full hover:shadow-lg transition-all">
            Book Your Free Call
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}