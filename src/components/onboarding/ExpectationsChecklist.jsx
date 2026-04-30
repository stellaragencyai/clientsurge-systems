import { CheckCircle2, Clock, Zap, FileText } from 'lucide-react';

export default function ExpectationsChecklist() {
  const expectations = [
    {
      icon: Zap,
      title: 'Fast Deployment',
      description: 'Most clients are live within 2–3 business days from submission.',
    },
    {
      icon: FileText,
      title: 'AI Customization',
      description: 'Your brand voice and messaging templates are AI-generated based on your business details.',
    },
    {
      icon: Clock,
      title: 'Admin Review',
      description: 'Our team reviews your configuration within 24 hours to ensure accuracy.',
    },
    {
      icon: CheckCircle2,
      title: 'Testing Before Go-Live',
      description: 'We run end-to-end tests before activation to confirm everything works perfectly.',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">What to Expect</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {expectations.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-white p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="mt-6 rounded-2xl p-6" style={{ background: 'rgba(154,92,46,0.06)', border: '1px solid rgba(154,92,46,0.15)' }}>
        <h4 className="font-semibold text-foreground text-sm mb-4">Typical Timeline</h4>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="text-xs font-bold text-primary min-w-fit">Within 1 hour</div>
            <p className="text-sm text-foreground">Confirmation email with your portal login</p>
          </div>
          <div className="flex gap-4">
            <div className="text-xs font-bold text-primary min-w-fit">24 hours</div>
            <p className="text-sm text-foreground">Admin review and AI message generation complete</p>
          </div>
          <div className="flex gap-4">
            <div className="text-xs font-bold text-primary min-w-fit">2–3 days</div>
            <p className="text-sm text-foreground">System testing and final approval</p>
          </div>
          <div className="flex gap-4">
            <div className="text-xs font-bold text-primary min-w-fit">Go-Live</div>
            <p className="text-sm text-foreground">System goes live and starts capturing leads</p>
          </div>
        </div>
      </div>
    </div>
  );
}