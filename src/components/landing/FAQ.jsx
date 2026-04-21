import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";

export const FAQ_ITEMS = [
{
  q: "Who is this built for?",
  a: "Service businesses that already generate leads but are not converting them efficiently - med spas, aesthetic clinics, real estate agencies, home service companies, and similar appointment-based businesses."
},
{
  q: "Do I need existing software or systems?",
  a: "No. We work with what you have or build from the ground up. Either way, we handle the entire setup."
},
{
  q: "Will this replace my staff?",
  a: "No. It handles the repetitive work - instant responses, follow-up sequences, reminders - so your team can focus on the clients in front of them."
},
{
  q: "How fast can I get set up?",
  a: "Most clients are fully live within 5-7 business days. We do the work. You just need to show up for one onboarding call."
},
{
  q: "What results should I expect?",
  a: "Faster lead response, more booked appointments, and recovered revenue from leads that would otherwise go cold. Many clients see clear results in the first 30 days."
},
{
  q: "Is there a long-term contract?",
  a: "No. Month-to-month only. We keep your business because the system works - not because you are locked in."
},
{
  q: "How much does it cost?",
  a: "Plans start at $397/month with a one-time setup fee. We have three tiers - Starter, Growth, and Pro - depending on your lead volume and goals. See our Pricing section for full details, and we will confirm the best fit on your demo call."
},
{
  q: "What happens on the demo call?",
  a: "We spend 30 minutes understanding your business, your lead volume, and where you are losing bookings. Then we show you exactly what we would build and what you can expect."
},
{
  q: "Will this actually work for my specific business?",
  a: "If you generate leads but lose conversions due to slow follow-up, the answer is almost always yes. We have worked across many appointment-based industries. On your demo call, we will identify the exact gaps and show you the specific solution. If we do not think we can help, we will tell you upfront."
},
{
  q: "How much time will I need to spend managing this?",
  a: "Almost none. The system runs on autopilot. You check in weekly to review results, and we handle all updates and optimization. No learning curve and no training required for your team."
},
{
  q: "What if the system does not increase my bookings?",
  a: "We set clear success goals during onboarding and review performance with you after launch. If we do not think we can create a meaningful improvement for your business, we will tell you before you move forward."
},
{
  q: "Can you integrate this with my current booking system?",
  a: "Usually, yes. We review your current booking and follow-up tools during the demo, confirm what can be connected cleanly, and recommend the simplest setup path for your business."
},
{
  q: "How do I know if this is the right investment for my business?",
  a: "That is what the demo is for. We will show you the specific system we would build, what it costs, and the projected ROI based on your current lead volume and conversion rate. You will have concrete numbers before deciding."
}];


export default function FAQ() {
  return (
    <section id="faq" className="bg-[hsl(var(--background))] px-6 py-24 md:py-32 from-background to-card">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Questions</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground text-base">
            Still have questions? <a href="/contact" className="text-primary font-semibold hover:underline">Send us a message</a>
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {FAQ_ITEMS.map((faq, i) =>
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-border hover:border-primary/40 rounded-xl px-6 data-[state=open]:border-primary/40 transition-colors bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary">
            
              <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5 focus:outline-none focus:ring-2 focus:ring-primary focus:rounded">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-foreground/80 leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </section>);

}