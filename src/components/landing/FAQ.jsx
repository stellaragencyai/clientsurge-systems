import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Who is this built for?",
    a: "Service businesses that already generate leads but aren't converting them efficiently — med spas, aesthetic clinics, real estate agencies, home service companies, and similar appointment-based businesses.",
  },
  {
    q: "Do I need existing software or systems?",
    a: "No. We work with what you have or build from the ground up. Either way, we handle the entire setup.",
  },
  {
    q: "Will this replace my staff?",
    a: "No. It handles the repetitive work — instant responses, follow-up sequences, reminders — so your team can focus on the clients in front of them.",
  },
  {
    q: "How fast can I get set up?",
    a: "Most clients are fully live within 5–7 business days. We do the work. You just need to show up for one onboarding call.",
  },
  {
    q: "What results should I expect?",
    a: "Faster lead response, more booked appointments, and recovered revenue from leads that would otherwise go cold. Many clients see clear results in the first 30 days.",
  },
  {
    q: "Is there a long-term contract?",
    a: "No. Month-to-month only. We keep your business because the system works — not because you're locked in.",
  },
  {
    q: "How much does it cost?",
    a: "It depends on the scope. We discuss everything transparently on your demo call. Our pricing is designed to make the ROI obvious before you commit.",
  },
  {
    q: "What happens on the demo call?",
    a: "We spend 30 minutes understanding your business, your lead volume, and where you're losing bookings. Then we show you exactly what we'd build and what you can expect.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="py-24 md:py-32 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-foreground/70 tracking-widest uppercase mb-4">Questions</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3" onValueChange={(v) => setOpenIndex(v ? parseInt(v.split('-')[1]) : null)}>
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-slate-600/0 hover:border-slate-600 rounded-xl px-6 data-[state=open]:border-amber-500/40 transition-colors bg-background overflow-hidden"
            >
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="overflow-visible pb-6 min-h-32">
                {openIndex === i && (
                  <div className="animate-in fade-in duration-300">
                    <style>{`
                      @keyframes handwrite {
                        0% { 
                          background-size: 0% 100%;
                        }
                        100% { 
                          background-size: 100% 100%;
                        }
                      }
                      .handwrite-text {
                        background: linear-gradient(90deg, #9a5c2e 0%, #9a5c2e 0%, transparent 0%);
                        background-size: 0% 100%;
                        animation: handwrite 1.8s ease-out forwards;
                        color: #9a5c2e;
                        font-family: 'Segoe Print', 'Comic Sans MS', cursive;
                        font-weight: 500;
                        letter-spacing: 0.5px;
                        line-height: 1.8;
                      }
                    `}</style>
                    <p className="handwrite-text text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}