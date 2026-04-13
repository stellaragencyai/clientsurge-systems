import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Will this replace my front desk staff?",
    a: "No. It handles the repetitive, time-consuming parts — instant replies, follow-up messages, reminders. Your team stays focused on clients in front of them, not chasing cold leads.",
  },
  {
    q: "How fast can this be set up?",
    a: "Most med spas are fully live within 5–7 business days. We handle the entire build. You need to show up for one onboarding call.",
  },
  {
    q: "Does it work with my current leads and software?",
    a: "Yes. We integrate with your existing lead sources — website forms, social ads, Google — and connect to the tools you already use.",
  },
  {
    q: "How does this actually increase bookings?",
    a: "By responding instantly, following up consistently, and removing friction from the booking process. Leads that would normally go cold stay engaged and convert to consultations.",
  },
  {
    q: "What if leads are already in my database?",
    a: "We run reactivation campaigns to re-engage them. Many med spas recover a significant number of bookings from contacts they considered lost.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No. Month-to-month only. We earn your business every month by delivering results.",
  },
];

export default function MedSpaFAQ() {
  return (
    <section className="py-20 md:py-28 px-6 bg-white border-y border-[#EDE8DF]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-[#A8874A] tracking-widest uppercase mb-4">
            Questions
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C]">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-[#EDE8DF] rounded-xl px-6 data-[state=open]:border-[#C9A96E]/50 transition-colors bg-[#FAFAF8]"
            >
              <AccordionTrigger className="text-left text-sm font-semibold text-[#1C1C1C] hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[#6B6B6B] leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}