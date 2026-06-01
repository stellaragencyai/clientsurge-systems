import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const MEDSPA_FAQ_ITEMS = [
  {
    q: "Will my clients know they're talking to automation?",
    a: "No - and that's by design. Every message is written in your brand's voice: professional, warm, and personal. Clients experience it the same way they would a well-trained front desk team member. The only difference is it responds in seconds, even at 11pm.",
  },
  {
    q: "Does it work with my booking software (Vagaro, Mindbody, Acuity, Jane)?",
    a: "Yes. We integrate with all major med spa booking platforms. Your booking link gets sent automatically at exactly the right moment - so leads go directly into your calendar without any manual scheduling.",
  },
  {
    q: "We already have a front desk. Why do we need this?",
    a: "Your front desk is great - for clients already in the room. The problem is what happens to the leads who text, DM, or call while your team is busy. This system handles that gap 24/7, so your staff can focus on the experience you're paid to deliver, not chasing inquiries.",
  },
  {
    q: "How quickly can this be set up?",
    a: "The launch target is usually 5-7 business days after onboarding, access, messaging, and provider setup are complete. We handle the build, sequences, integrations, and testing, then confirm the timeline against your actual setup needs.",
  },
  {
    q: "We mostly get leads from Instagram DMs. Does this work for that?",
    a: "Yes. We capture and respond to leads from Instagram, your website, Google ads, phone calls, and more. Wherever your inquiries come from, the system picks them up and responds immediately.",
  },
  {
    q: "What if a lead asks a specific question about a treatment like Botox or filler pricing?",
    a: "The system is built around your specific services, FAQs, and pricing ranges. It handles common questions naturally and knows when to route a conversation to your team for anything more complex - so nothing gets mishandled.",
  },
  {
    q: "How much does it cost - and is it worth it?",
    a: "Plans start at $497/month with a one-time setup fee. Whether it is worth it depends on your lead volume, treatment value, response gaps, and follow-through process. Book the demo and we'll walk through the math for your actual business instead of giving a generic ROI promise.",
  },
  {
    q: "What happens after I book a demo?",
    a: "We review your current lead flow, identify likely response and follow-up gaps, and walk you through how the system would work for your specific med spa. It's 30 minutes, zero obligation, and designed to give you a clearer next step.",
  },
];

export default function MedSpaFAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Questions</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground text-base">
            Still have questions? <a href="/contact" className="text-primary font-semibold hover:underline">Send us a message â†’</a>
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {MEDSPA_FAQ_ITEMS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border hover:border-primary/40 rounded-xl px-6 data-[state=open]:border-primary/40 transition-colors bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary"
            >
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5 focus:outline-none focus:ring-2 focus:ring-primary focus:rounded">
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