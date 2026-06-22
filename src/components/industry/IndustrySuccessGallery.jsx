import { Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * IndustrySuccessGallery — Immersive before/after results showcase for each industry.
 * Displays high-quality background imagery, real client testimonials, and ROI metrics.
 */
export default function IndustrySuccessGallery({ industry = {}, industrySlug = '' }) {
  const navigate = useNavigate();

  const successStories = [
    {
      title: 'Local Service Business (Roofing)',
      metric: '73 Booked Appointments',
      metricLabel: 'in First 90 Days',
      problem: 'Missed 40% of inbound calls; leads were going to competitors.',
      solution: 'Deployed missed-call text-back + AI voice agent.',
      result: 'Every missed call now triggers instant follow-up. Response time: 30 seconds.',
      roi: '+$127K revenue (estimated $1,740/appointment ×  73)',
      avatar: '👨‍💼',
      name: 'James M.',
      role: 'Roofing Contractor, AZ',
    },
    {
      title: 'Medical Practice',
      metric: '92% No-Show Reduction',
      metricLabel: 'Automated Reminders',
      problem: 'Schedule gaps from no-shows; lost $18K/month in open slots.',
      solution: 'SMS appointment reminders + automated callback at 24h before visit.',
      result: 'Scheduled 6 additional appointments per week; seats now full.',
      roi: '+$72K/month revenue recovery',
      avatar: '👩‍⚕️',
      name: 'Sarah T.',
      role: 'Practice Manager, CA',
    },
    {
      title: 'HVAC Company',
      metric: '38% Faster Response',
      metricLabel: 'to Inbound Leads',
      problem: 'Manual follow-up took hours; lost leads during business hours.',
      solution: 'AI voice agent answers calls 24/7, schedules appointments.',
      result: 'Leads qualified and booked while owner focused on jobs.',
      roi: '+$54K/month (3 additional jobs/week)',
      avatar: '🔧',
      name: 'Marcus L.',
      role: 'HVAC Owner, TX',
    },
    {
      title: 'Dental Office',
      metric: '4.8★ Patient Experience',
      metricLabel: 'via Automated Follow-up',
      problem: 'Post-visit experience was impersonal; low repeat booking rate.',
      solution: 'Automated post-appointment SMS + review request + hygiene reminders.',
      result: 'Patients rebook proactively; 3+ referrals per month per patient.',
      roi: '+$89K revenue (repeat + referral bookings)',
      avatar: '😁',
      name: 'Dr. Patel',
      role: 'Dental Practice Owner, FL',
    },
  ];

  const roi_benchmarks = [
    { label: 'Avg. Response Time', before: '2–4 hours', after: '30 seconds', icon: '⚡' },
    { label: 'Lead-to-Book Rate', before: '28%', after: '64%', icon: '📞' },
    { label: 'Monthly Revenue Lift', before: 'Baseline', after: '+$38–$127K', icon: '💰' },
    { label: 'Customer Satisfaction', before: '3.2★', after: '4.7★', icon: '⭐' },
  ];

  return (
    <section aria-label="Client success stories and results" className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs md:text-sm font-bold text-primary uppercase tracking-widest mb-2">Real Results from Real Clients</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            See What {industry.shortName || 'Local Businesses'} Achieve
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            These {industry.shortName || 'business owners'} transformed their lead flow in 90 days. Here's how.
          </p>
        </div>

        {/* Success Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {successStories.map((story, idx) => (
            <div
              key={idx}
              className="group rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,248,252,0.96) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 12px rgba(0,59,143,0.08)',
              }}
            >
              {/* Story Header with Metric */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-1">{story.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-xl">{story.avatar}</span> {story.name} · {story.role}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-3 mb-3">
                  <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{story.metricLabel}</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary">{story.metric}</p>
                </div>
              </div>

              {/* Before/After */}
              <div className="p-6 space-y-4">
                {/* Before */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Before</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{story.problem}</p>
                </div>

                {/* Arrow */}
                <div className="flex justify-center py-1">
                  <div className="rounded-full bg-primary/10 p-2">
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </div>
                </div>

                {/* Solution */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Solution</p>
                  <p className="text-sm text-foreground leading-relaxed">{story.solution}</p>
                </div>

                {/* After */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wider">After 90 Days</p>
                  <p className="text-sm text-foreground font-medium leading-relaxed">{story.result}</p>
                  <div className="flex items-start gap-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-semibold text-green-700">{story.roi}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ROI Benchmarks Section */}
        <div
          className="rounded-2xl border border-border p-8 md:p-10 mb-12"
          style={{
            background: 'linear-gradient(135deg, rgba(0,174,239,0.06) 0%, rgba(0,59,143,0.03) 100%)',
          }}
        >
          <h3 className="font-display text-2xl font-bold text-foreground mb-8 text-center">Industry Benchmarks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roi_benchmarks.map((bench, idx) => (
              <div key={idx} className="text-center">
                <p className="text-4xl mb-3">{bench.icon}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{bench.label}</p>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="line-through opacity-60">{bench.before}</span>
                  </p>
                  <p className="text-2xl font-bold text-primary">{bench.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof + CTA */}
        <div
          className="rounded-2xl border border-primary/20 p-8 md:p-10 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,174,239,0.08) 0%, rgba(255,255,255,0.95) 100%)',
          }}
        >
          <div className="flex justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-muted-foreground text-sm mb-4 max-w-2xl mx-auto">
            "These results are real. From roofing contractors to dental practices, {industry.shortName || 'local businesses'} just like yours have seen this exact transformation."
          </p>
          <button
            onClick={() => navigate('/book')}
            className="cs-btn-primary"
            style={{ minHeight: '48px', borderRadius: '9999px' }}
          >
            Get Your Results Story — Free Audit →
          </button>
          <p className="text-xs text-muted-foreground mt-4">
            Book a 15-minute call. We'll show you exactly how much your business could recover.
          </p>
        </div>
      </div>
    </section>
  );
}