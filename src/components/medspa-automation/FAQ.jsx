import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Does this replace my staff?',
    a: 'No. It handles the repetitive parts—instant responses, follow-up, reminders. Your staff focuses on consultations and client care. Everyone wins.',
  },
  {
    q: 'Will it sound robotic?',
    a: 'We write every message specifically for your med spa with your voice and brand. It feels natural, not like a bot.',
  },
  {
    q: "Does it work with leads I already have?",
    a: "Absolutely. We can integrate with your existing database and start reactivating old leads immediately.",
  },
  {
    q: "How fast can it go live?",
    a: "Most med spas are fully live within 5–7 business days. We handle everything. One onboarding call and you're done.",
  },
  {
    q: "What if we use a custom calendar system?",
    a: "We integrate with most calendar platforms—Acuity, Calendly, Google Calendar, etc. If it's different, we can usually make it work.",
  },
  {
    q: 'How much does this cost?',
    a: 'Pricing depends on lead volume and complexity. We discuss everything transparently on your demo call. No surprises.',
  },
];

export default function FAQ() {
  return (
    <section className="py-24 md:py-32 px-6 bg-card">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-center mb-16">
          Common Questions
        </h2>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-lg px-6 data-[state=open]:bg-background transition-colors"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}