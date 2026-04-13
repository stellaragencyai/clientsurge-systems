import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Who is this for?",
    a: "Our automation systems are designed for service businesses that rely on appointments and bookings — including med spas, aesthetic clinics, real estate agencies, home service companies, and other local businesses that are already generating leads but want to convert more of them.",
  },
  {
    q: "Do I need any existing systems in place?",
    a: "Not necessarily. We can work with your existing CRM, booking tools, and marketing platforms — or help you set everything up from scratch. We'll tailor the system to fit your current operations.",
  },
  {
    q: "Will this replace my staff?",
    a: "No. Our systems handle the repetitive, time-sensitive tasks that your team doesn't have time for — like instant responses and follow-up sequences. This frees your staff to focus on in-person service and higher-value work.",
  },
  {
    q: "How quickly can I get set up?",
    a: "Most clients are fully operational within 5–7 business days. We handle the entire setup process, so there's minimal time required from your team.",
  },
  {
    q: "What kind of results can I expect?",
    a: "Results vary by business, but our clients typically see faster response times, higher booking rates, and recovered revenue from leads that would have otherwise been lost. Many see measurable improvement within the first 30 days.",
  },
  {
    q: "How does onboarding work?",
    a: "We start with a strategy call to understand your business, your lead sources, and your goals. From there, we design and build your custom automation system, test everything, and go live with ongoing optimization and support.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No. We believe our results should earn your business every month. Our engagements are month-to-month with no long-term commitment required.",
  },
  {
    q: "How much does it cost?",
    a: "Pricing depends on the complexity of your needs and the scope of the automation system. We'll discuss everything transparently during your demo call. Our systems are designed to deliver ROI that far exceeds the investment.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            Common Questions
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-xl px-6 data-[state=open]:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline py-5">
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