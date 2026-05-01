import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function IndustryFAQ({ faqs }) {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-20 px-6" style={{ overflowX: "hidden", background: "#ffffff" }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">FAQ</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Questions We Always Get
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.9)",
                border: open === i
                  ? "1.5px solid rgba(154,92,46,0.35)"
                  : "1.5px solid rgba(154,92,46,0.14)",
                boxShadow: open === i
                  ? "0 6px 22px rgba(111,67,31,0.1)"
                  : "0 2px 8px rgba(111,67,31,0.05)",
                transition: "all 0.2s ease",
              }}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  className="flex-shrink-0 transition-transform duration-300"
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "#9a5c2e",
                    transform: open === i ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-foreground/70 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}