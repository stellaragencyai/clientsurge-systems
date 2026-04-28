import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";

export const FAQ_ITEMS = [
{
  q: "Who is this built for?",
  a: "Service businesses that already generate leads but are not converting them efficiently - med spas, aesthetic clinics, real estate agencies, home service companies, and similar appointment-based businesses.",
  category: "setup"
},
{
  q: "Do I need existing software or systems?",
  a: "No. We work with what you have or build from the ground up. Either way, we handle the entire setup.",
  category: "setup"
},
{
  q: "Will this replace my staff?",
  a: "No. It handles the repetitive work - instant responses, follow-up sequences, reminders - so your team can focus on the clients in front of them.",
  category: "setup"
},
{
  q: "How fast can I get set up?",
  a: "Most clients are fully live within 5-7 business days. We do the work. You just need to show up for one onboarding call.",
  category: "setup"
},
{
  q: "What results should I expect?",
  a: "Faster lead response, more booked appointments, and recovered revenue from leads that would otherwise go cold. Many clients see clear results in the first 30 days.",
  category: "pricing"
},
{
  q: "Is there a long-term contract?",
  a: "No. Month-to-month only. We keep your business because the system works - not because you are locked in.",
  category: "pricing"
},
{
  q: "How much does it cost?",
  a: "Plans start at $397/month with a one-time setup fee. We have three tiers - Starter, Growth, and Pro - depending on your lead volume and goals. See our Pricing section for full details, and we will confirm the best fit on your demo call.",
  category: "pricing"
},
{
  q: "What happens on the demo call?",
  a: "We spend 30 minutes understanding your business, your lead volume, and where you are losing bookings. Then we show you exactly what we would build and what you can expect.",
  category: "integration"
},
{
  q: "Will this actually work for my specific business?",
  a: "If you generate leads but lose conversions due to slow follow-up, the answer is almost always yes. We have worked across many appointment-based industries. On your demo call, we will identify the exact gaps and show you the specific solution. If we do not think we can help, we will tell you upfront.",
  category: "integration"
},
{
  q: "How much time will I need to spend managing this?",
  a: "Almost none. The system runs on autopilot. You check in weekly to review results, and we handle all updates and optimization. No learning curve and no training required for your team.",
  category: "support"
},
{
  q: "What if the system does not increase my bookings?",
  a: "We set clear success goals during onboarding and review performance with you after launch. If we do not think we can create a meaningful improvement for your business, we will tell you before you move forward.",
  category: "support"
},
{
  q: "Can you integrate this with my current booking system?",
  a: "Usually, yes. We review your current booking and follow-up tools during the demo, confirm what can be connected cleanly, and recommend the simplest setup path for your business.",
  category: "integration"
},
{
  q: "How do I know if this is the right investment for my business?",
  a: "That is what the demo is for. We will show you the specific system we would build, what it costs, and the projected ROI based on your current lead volume and conversion rate. You will have concrete numbers before deciding.",
  category: "support"
}];


export default function FAQ() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState(0);

  const categories = ["all", "setup", "pricing", "integration", "support"];
  const categoryLabels = { all: "All", setup: "Getting Started", pricing: "Pricing", integration: "Integrations", support: "Support" };

  const filtered = FAQ_ITEMS.filter((item, idx) => {
    const matchesSearch = item.q.toLowerCase().includes(search.toLowerCase()) || 
                         item.a.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="faq" className="px-6 py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-card to-background">

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Questions</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
           Frequently Asked Questions
          </h2>
          <p className="mt-4 text-muted-foreground text-base">
            Still have questions? <a href="/contact" className="text-primary font-semibold hover:underline">Send us a message</a>
          </p>
          <div className="mt-8 border-t border-border/40" />
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
                category === cat
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <Accordion type="single" collapsible value={`faq-${expandedIndex}`} onValueChange={(val) => setExpandedIndex(parseInt(val.split("-")[1]))} className="space-y-3">
            {filtered.map((faq, idx) => {
              const originalIdx = FAQ_ITEMS.indexOf(faq);
              return (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="rounded-xl px-6 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1.5px solid rgba(200,205,215,0.55)",
                  boxShadow: "0 2px 14px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5 focus:outline-none focus:ring-2 focus:ring-primary focus:rounded">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/80 leading-relaxed pb-5 word-wrap break-words">
                    <div style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>
                      <p>{faq.a}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-semibold mb-2">No results found</p>
            <p className="text-sm">Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </section>);
}