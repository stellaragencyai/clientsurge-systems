import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { FAQ_ITEMS } from "./FAQData";

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

            <h2 className="font-display font-extrabold uppercase leading-[1.05] tracking-tight text-gray-900"
              style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
            >
              Find the Answers
            </h2>
            <h2 className="font-display font-extrabold uppercase leading-[1.05] tracking-tight mb-5"
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                color: "#00AEEF",
                textShadow: "0 0 24px rgba(0,174,239,0.45), 0 0 48px rgba(0,174,239,0.2)",
              }}
            >
              to Your Questions
            </h2>

            <p className="text-sm leading-relaxed text-gray-500 max-w-sm">
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
                      maxHeight: isOpen ? "300px" : "0px",
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
          </div>
        </div>
      </div>
    </section>
  );
}