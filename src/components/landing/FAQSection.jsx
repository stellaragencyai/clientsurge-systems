import { useState } from "react";
import { ChevronDown, MessageCircle, Phone, Mail } from "lucide-react";
import { FAQ_ITEMS } from "./FAQData";
import SectionHeader from "@/components/design-system/SectionHeader";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 md:py-24 px-4" style={{ background: "#F7F8FA" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr,1.15fr] gap-10 lg:gap-16 items-start">
          {/* Left Column — Heading & Contact */}
          <div className="lg:sticky lg:top-28">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
              style={{
                background: "rgba(0,174,239,0.08)",
                border: "1px solid rgba(0,174,239,0.18)",
                boxShadow: "0 0 20px rgba(0,174,239,0.12)",
              }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: "#00AEEF" }} />
            </div>

            <SectionHeader
              eyebrow="FAQ"
              title="Answers to Your Questions"
              align="left"
            />

            <p className="text-sm leading-relaxed text-muted-foreground max-w-sm mt-4">
              If you have any other questions, feel free to reach out to us at{" "}
              <a
                href="mailto:support@clientsurgesystems.com"
                className="font-semibold transition-colors"
                style={{ color: "#00AEEF" }}
              >
                support@clientsurgesystems.com
              </a>
              .
            </p>
          </div>

          {/* Right Column — FAQ Accordion */}
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => toggle(index)}
                  style={{
                    background: "#ffffff",
                    borderColor: isOpen ? "rgba(0,174,239,0.35)" : "#E5E7EB",
                    boxShadow: isOpen
                      ? "0 4px 24px rgba(0,174,239,0.12), 0 0 0 1px rgba(0,174,239,0.08)"
                      : "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      style={{ color: isOpen ? "#00AEEF" : "#9CA3AF", transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                    />
                  </div>
                  <div
                    className="overflow-hidden transition-all"
                    style={{
                      maxHeight: isOpen ? "500px" : "0px",
                      opacity: isOpen ? 1 : 0,
                      transitionDuration: "400ms",
                      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <p className="px-5 pb-4 text-sm leading-relaxed text-gray-500">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Still have questions CTA — clear next step after reading FAQ */}
            <div className="rounded-xl p-5 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: "linear-gradient(135deg, rgba(0,174,239,0.06), rgba(0,59,143,0.04))", border: "1px solid rgba(0,174,239,0.2)" }}>
              <div>
                <p className="font-bold text-gray-900 text-sm mb-1">Still have questions?</p>
                <p className="text-xs text-gray-500">We'll help you pick the right system — no sales pressure.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <a href="tel:+16025843227" className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border text-xs font-bold transition-colors" style={{ borderColor: "rgba(0,174,239,0.3)", color: "#006BB0", background: "#fff" }}>
                  <Phone className="w-3.5 h-3.5" /> Call Us
                </a>
                <a href="mailto:support@clientsurgesystems.com" className="cs-btn-primary inline-flex items-center justify-center gap-1.5 text-xs" style={{ height: "40px", padding: "0 20px" }}>
                  <Mail className="w-3.5 h-3.5" /> Email Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}