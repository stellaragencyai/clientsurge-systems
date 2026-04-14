import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Who is this built for?",
    a: "Service businesses that already generate leads but aren't converting them efficiently — med spas, aesthetic clinics, real estate agencies, home service companies, and similar appointment-based businesses.",
  },
  {
    q: "Do I need existing software or systems?",
    a: "No. We work with what you have or build from the ground up. Either way, we handle the entire setup.",
  },
  {
    q: "Will this replace my staff?",
    a: "No. It handles the repetitive work — instant responses, follow-up sequences, reminders — so your team can focus on the clients in front of them.",
  },
  {
    q: "How fast can I get set up?",
    a: "Most clients are fully live within 5–7 business days. We do the work. You just need to show up for one onboarding call.",
  },
  {
    q: "What results should I expect?",
    a: "Faster lead response, more booked appointments, and recovered revenue from leads that would otherwise go cold. Many clients see clear results in the first 30 days.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No. Month-to-month only. We keep your business because the system works — not because you're locked in.",
  },
  {
    q: "How much does it cost?",
    a: "It depends on the scope. We discuss everything transparently on your demo call. Our pricing is designed to make the ROI obvious before you commit.",
  },
  {
    q: "What happens on the demo call?",
    a: "We spend 30 minutes understanding your business, your lead volume, and where you're losing bookings. Then we show you exactly what we'd build and what you can expect.",
  },
  {
    q: "Will this actually work for my specific business?",
    a: "If you generate leads but lose conversions due to slow follow-up, the answer is almost always yes. We've worked across 15+ industries. On your demo call, we'll identify the exact gaps and show you the specific solution. If we don't think we can help, we'll tell you upfront.",
  },
  {
    q: "How much time will I need to spend managing this?",
    a: "Almost none. The system runs on autopilot. You check in weekly to review results, and we handle all updates and optimization. No learning curve, no training required for your team.",
  },
  {
    q: "What if the system doesn't increase my bookings?",
    a: "That's covered by our 30-day guarantee. If you're not seeing results by day 30, we refund your setup cost—no questions asked. But most clients see measurable improvements within the first two weeks.",
  },
  {
    q: "Can you integrate this with my current booking system?",
    a: "Yes. Whether you use Calendly, Acuity, Mindbody, or a custom system, we connect to it. If something unique, we build a custom integration.",
  },
  {
    q: "How do I know if this is the right investment for my business?",
    a: "That's what the demo is for. We'll show you the specific system we'd build, what it costs, and the projected ROI based on your current lead volume and conversion rate. You'll have concrete numbers before deciding.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Questions</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-slate-600/0 hover:border-slate-600 rounded-xl px-6 data-[state=open]:border-amber-500/40 transition-colors bg-background overflow-hidden"
            >
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}