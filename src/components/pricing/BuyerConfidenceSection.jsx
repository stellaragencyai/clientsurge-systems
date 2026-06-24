import { CheckCircle, Zap, ClipboardList } from 'lucide-react';

const trustPoints = [
  {
    icon: Zap,
    title: 'Setup Guided After Purchase',
    description: 'Our team walks you through onboarding and configuration step by step.',
  },
  {
    icon: ClipboardList,
    title: 'Automation Testing Before Go-Live',
    description: 'We test every automation system to ensure it works perfectly for your business.',
  },
  {
    icon: CheckCircle,
    title: 'Client Dashboard Included',
    description: 'Track leads, revenue, and automation performance from day one.',
  },
];

export default function BuyerConfidenceSection() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-black text-center mb-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Why Customers Choose ClientSurge
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {trustPoints.map((point, idx) => {
            const Icon = point.icon;
            return (
              <div key={idx} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 p-3 rounded-full border border-primary/20">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">
                  {point.title}
                </h3>
                <p className="text-foreground text-sm leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}