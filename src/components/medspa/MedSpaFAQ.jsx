import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Will this replace my staff?",
    a: "No. It handles the repetitive follow-up work so your team can focus on clients in the chair. It gives your staff time back.",
  },
  {
    q: "How fast can it be set up?",
    a: "Most med spas are live within 5–7 business days. We do the work. You just show up for one setup call.",
  },
  {
    q: "Does this work with my current leads?",
    a: "Yes. We integrate with what you have—phone system, booking calendar, current databases. No massive overhaul needed.",
  },
  {
    q: "How does this actually increase bookings?",
    a: "Instant response + automatic follow-up = leads who would have gone cold now get converted. You're not getting more leads. You're converting more of the ones you have.",
  },
  {
    q: "What happens after I book a call?",
    a: "We'll spend 30 minutes learning your med spa—your services, lead sources, challenges. Then we show you exactly what we'd automate and what you can expect.",
  },
];

export default function MedSpaFAQ() {
  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 text-center">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12">
          Everything you need to know.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-lg px-6 data-[state=open]:border-primary data-[state=open]:bg-primary/5 transition-colors"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}