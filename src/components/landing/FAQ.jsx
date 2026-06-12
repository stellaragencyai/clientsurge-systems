import { useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";
import { FAQ_ITEMS } from "./FAQData";


export default function FAQ() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = ["all", "setup", "pricing", "integration", "support", "billing", "compliance"];
  const categoryLabels = {
    all: "All Topics",
    setup: "Getting Started",
    pricing: "Pricing & Packages",
    integration: "Integrations",
    support: "Support",
    billing: "Billing & Cancellation",
    compliance: "SMS Compliance",
  };

  const filtered = FAQ_ITEMS.filter((item) => {
    const matchesSearch = item.q.toLowerCase().includes(search.toLowerCase()) || 
                         item.a.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <section id="faq" className="px-4 pt-8 pb-20 md:px-6 md:pt-10 md:pb-32 relative overflow-hidden bg-gradient-to-b from-card to-background">

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-8 md:mb-14">
          <p className="text-[11px] md:text-xs font-semibold text-primary tracking-widest uppercase mb-3 md:mb-4">Questions</p>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
           Frequently Asked Questions
          </h2>
          <p className="mt-3 md:mt-4 text-muted-foreground text-sm md:text-base">
            Still unsure? <a href="/contact" className="text-primary font-semibold hover:underline">See your specific gaps</a> or <a href="/pricing" className="text-primary font-semibold hover:underline">get your custom plan</a>
          </p>
          <div className="mt-8 border-t border-border/40" />
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            id="faq-search"
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            autoFocus={false}
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-label="Search FAQs"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold uppercase tracking-wide transition-all ${
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-3">
            {filtered.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 28, delay: idx * 0.05 }}
              >
                <AccordionItem
                  value={`faq-${idx}`}
                  className="rounded-xl px-6 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-colors duration-200"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1.5px solid rgba(200,205,215,0.55)",
                    boxShadow: "0 2px 14px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline py-5 focus-visible:outline-none min-h-[48px] border-b border-border/20 last:border-b-0">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-foreground/80 leading-relaxed pb-5 break-words overflow-wrap-anywhere">
                    <div style={{ wordWrap: "break-word", overflowWrap: "break-word" }}>
                      <p>{faq.a}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
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
