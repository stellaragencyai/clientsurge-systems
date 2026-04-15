import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Will the automated messages feel robotic to my clients?",
    a: "Not at all. Every message is written to sound warm, professional, and on-brand for your med spa. Think of it like your best receptionist — always on, always polished. We customize the tone (Professional, Friendly, Luxury, Casual) to match your brand. Most clients have no idea it's automated.",
  },
  {
    q: "Does this work with my booking software (Mindbody, Jane, Vagaro, Acuity)?",
    a: "Yes. We integrate with your existing booking system and send leads directly to your calendar link. No switching software. No new platforms to learn. It works alongside what you already use.",
  },
  {
    q: "How fast are leads actually replied to?",
    a: "Within 90 seconds on average — including nights, weekends, and holidays. The system never sleeps. As soon as an inquiry comes in from any channel (website, Instagram, Google, phone call), an instant personalized reply goes out.",
  },
  {
    q: "What happens if a lead asks a question the system can't answer?",
    a: "The system is trained to handle the most common inquiries for your specific treatments and services. For anything outside that, it captures the question and flags your team to follow up personally. Nothing falls through the cracks.",
  },
  {
    q: "How quickly can this be set up and live?",
    a: "Most med spas are fully live within 5–7 business days of the onboarding call. We do the entire build — you attend one 30-minute setup call, and we handle everything else.",
  },
  {
    q: "Can it reactivate old leads I never converted?",
    a: "Yes — and this is often where the fastest ROI comes from. If you have a list of past inquiries (even from 6–12 months ago), we build a reactivation campaign that re-engages them with the right message. Many of those leads are still looking for a provider.",
  },
  {
    q: "Will this work if I'm already running ads on Facebook or Google?",
    a: "Absolutely. In fact, this is where the system has the biggest impact. You're already paying for those leads — the system makes sure none of them fall through the cracks. Better follow-up means better ROI on every dollar you spend on ads.",
  },
  {
    q: "What makes this different from a generic CRM or chatbot?",
    a: "This is a fully done-for-you system built specifically around how med spas operate — high-value treatments, consultation-based booking, and a front desk that can't manually chase every lead. We don't hand you software and wish you luck. We build it, install it, and it runs for you.",
  },
];

export default function MedSpaFAQ() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">FAQ</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
            Questions Med Spa Owners Ask Before Starting
          </h2>
          <p className="text-base text-muted-foreground">Straight answers. No fluff.</p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-xl px-6 bg-white data-[state=open]:border-primary/40 data-[state=open]:bg-primary/3 transition-colors"
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