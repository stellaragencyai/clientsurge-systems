import { useState, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { FAQ_ITEMS } from "./FAQData";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);
  const [query, setQuery] = useState("");

  // Deep-link: auto-open FAQ item from URL hash (#faq-<n>)
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#faq-(\d+)$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx >= 0 && idx < FAQ_ITEMS.length) {
        setOpenIndex(idx);
      }
    }
  }, []);

  // Microdata: inject FAQPage JSON-LD schema for SEO rich results
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    script.setAttribute("data-faq-schema", "true");
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredItems = useMemo(() => {
    if (!query.trim()) return FAQ_ITEMS.map((item, i) => ({ ...item, originalIndex: i }));
    const q = query.toLowerCase();
    return FAQ_ITEMS
      .map((item, i) => ({ ...item, originalIndex: i }))
      .filter((item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <section id="faq" className="py-16 md:py-24 px-4" style={{ background: "#F7F8FA" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr,1.15fr] gap-10 lg:gap-16 items-start">
          {/* Left Column — Heading & Contact */}
          <div className="lg:sticky lg:top-28">
            <CSSectionHeader
              title="Answers to Your Questions"
              align="left"
            />

            <p className="text-sm leading-relaxed text-muted-foreground max-w-sm mt-8">
              If you have any other questions, feel free to reach out to us at{" "}
              <a
                href="mailto:support@clientsurgesystems.com"
                className="font-semibold transition-colors"
                style={{ color: "#00D4FF" }}
              >
                support@clientsurgesystems.com
              </a>
              .
            </p>
          </div>

          {/* Right Column — Search + FAQ Accordion */}
          <div className="space-y-4">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions..."
                aria-label="Search FAQ questions"
                className="w-full rounded-xl border bg-white pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.18)] transition-colors"
                style={{ borderColor: "rgba(0,212,255,0.3)" }}
              />
            </div>

            {/* Accordion */}
            <div className="space-y-3">
              {filteredItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No questions match "{query}".
                </p>
              )}
              {filteredItems.map((item) => {
                const isOpen = openIndex === item.originalIndex;
                return (
                  <div
                    key={item.originalIndex}
                    id={`faq-${item.originalIndex}`}
                    className="rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden scroll-mt-28"
                    onClick={() => toggle(item.originalIndex)}
                    style={{
                      background: "#ffffff",
                      borderColor: isOpen ? "rgba(0,212,255,0.35)" : "#E5E7EB",
                      boxShadow: isOpen
                        ? "0 4px 24px rgba(0,212,255,0.12), 0 0 0 1px rgba(0,212,255,0.08)"
                        : "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                      <ChevronDown
                        className={`w-4 h-4 flex-shrink-0 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        style={{ color: isOpen ? "#00D4FF" : "#9CA3AF", transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
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
                      <p className="px-5 pb-4 text-sm leading-relaxed text-gray-700">
                        {item.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}