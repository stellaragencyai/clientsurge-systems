import { useState } from "react";
import { ChevronDown } from "lucide-react";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

export default function IndustryFAQ({ faqs }) {
  const [open, setOpen] = useState(null);
  if (!faqs || !faqs.length) return null;

  return (
    <section className="px-4 py-14 md:px-6 md:py-20" style={{ overflowX: "hidden", background: "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(0,174,239,0.07) 0%, transparent 60%), radial-gradient(ellipse 55% 50% at 15% 80%, rgba(0,59,143,0.05) 0%, transparent 55%), linear-gradient(180deg, #f4f9ff 0%, #eef6ff 100%)" }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <CSSectionHeader
            eyebrow="FAQ"
            title="Questions We Always Get"
            align="center"
          />
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="cs-card rounded-2xl overflow-hidden"
              style={{
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