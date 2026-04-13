import { MessageSquare, Zap, Phone, Calendar, RotateCw } from "lucide-react";

export default function MedSpaSolution() {
  const solutions = [
    {
      icon: Zap,
      title: "Instant Response",
      desc: "Every lead gets a response within seconds. Automatically.",
    },
    {
      icon: MessageSquare,
      title: "Automated Follow-Up",
      desc: "Smart messages sent at the right time to nurture leads toward booking.",
    },
    {
      icon: Phone,
      title: "Missed Call Text-Back",
      desc: "Calls missed? Automatic SMS reaches out and gets them back on track.",
    },
    {
      icon: Calendar,
      title: "Booking Link Sent Automatically",
      desc: "Lead is ready? They get a direct link to book their consultation.",
    },
    {
      icon: RotateCw,
      title: "Reactivate Old Leads",
      desc: "Turn past inquiries into new bookings with smart re-engagement.",
    },
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4">
            We Fix Your Follow-Up System
          </h2>
          <p className="text-lg text-muted-foreground">
            Here's exactly what we automate for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}