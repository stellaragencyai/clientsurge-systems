import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
  "@/components/ui/accordion";
import { FAQ_ITEMS } from "./FAQData";
import SectionHeader from "@/components/design-system/SectionHeader";

export default function FAQ() {

  return (
    <section id="faq" className="px-4 pt-8 pb-20 md:px-6 md:pt-10 md:pb-32 relative overflow-hidden bg-gradient-to-b from-card to-background">

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="mb-8 md:mb-14">
          <SectionHeader
            eyebrow="Questions"
            title="Frequently Asked Questions"
          />
          <p className="mt-3 md:mt-4 text-muted-foreground text-sm md:text-base text-center">
            Still unsure? <a href="/contact" className="text-primary font-semibold hover:underline">Get Help Choosing</a> or <a href="/pricing" className="text-primary font-semibold hover:underline">Compare Packages</a>
          </p>
          <div className="mt-8 border-t border-border/40" />
        </div>

        {FAQ_ITEMS.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="rounded-xl px-6 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-colors duration-200"
                style={{
                  background: "rgba(255,255,255,0.90)",
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