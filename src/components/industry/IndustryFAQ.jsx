import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function IndustryFAQ({ faqs }) {
  const [open, setOpen] = useState(null);
  if (!faqs || !faqs.length) return null;

  return (
    <section className="px-4 py-14 md:px-6 md:py-20" style={{ overflowX: "hidden", background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">FAQ</p>
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
                background: "#ffffff",
                border: open === i
                  ? "1px solid rgba(0,136,204,0.36)"
                  : "1px solid rgba(0,136,204,0.14)",
                boxShadow: open === i
                  ? "0 10px 28px rgba(0,59,143,0.1)"
                  : "0 4px 14px rgba(0,59,143,0.04)",
                transition: "all 0.2s ease",
              }}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-6 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="text-sm font-semibold text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  className="flex-shrink-0 transition-transform duration-300"
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "#0088CC",
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