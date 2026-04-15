import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Will this replace my front desk?",
    a: "No. It supports your team by handling the fast response and repetitive follow-up they don't have time for. Your staff focuses on the clients in the room. The system handles the leads coming in.",
  },
  {
    q: "How quickly can this be set up?",
    a: "Most systems are live within 5–7 business days once onboarding is complete. We do the build. You just need to show up for a short setup call.",
  },
  {
    q: "Does this work with my current leads?",
    a: "Yes. It can work with new leads coming in from any channel, and it can also help re-engage older inquiries you already have. No massive overhaul required.",
  },
  {
    q: "What kinds of med spas is this best for?",
    a: "It works best for med spas that are already getting inquiries and want to convert more of them into booked appointments. If you have lead flow but inconsistent follow-up, this is built for you.",
  },
  {
    q: "What happens after I book a demo?",
    a: "We'll review your current lead flow, identify where bookings are being lost, and walk you through exactly how the system would work for your specific med spa. No obligation.",
  },
  {
    q: "Will the responses sound robotic?",
    a: "No. The messaging is crafted to feel clean, professional, and natural — consistent with the tone of your brand. It should feel like a well-trained team member, not an autoresponder.",
  },
];

export default function MedSpaFAQ() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">FAQ</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-muted-foreground">Straight answers. No fluff.</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-xl px-6 bg-[#FAFAF8] data-[state=open]:border-primary/40 data-[state=open]:bg-primary/3 transition-colors"
            >
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-5 text-foreground">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-5 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}