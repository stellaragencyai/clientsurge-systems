import { useId, useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import { HOMEPAGE_FAQ_ITEMS } from "./FAQData";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  const accordionId = useId();

  return (
    <section
      id="faq"
      className="bg-[#F7F8FA] px-5 py-16 sm:px-8 md:py-24 lg:px-10"
      aria-label="Frequently asked questions"
    >
      <div className="mx-auto grid w-full max-w-[1180px] grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-[#008fc9]">
            <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
          </div>

          <CSSectionHeader
            eyebrow="Essential Questions"
            title="What buyers need to know before choosing a system."
            subtitle="Five direct answers covering package scope, setup, integrations, expansion, and what happens after checkout."
            align="left"
            className="mt-5"
          />

          <p className="mt-6 max-w-sm text-sm font-medium leading-7 text-slate-600">
            Need an answer specific to your business? Email{" "}
            <a
              href="mailto:support@clientsurgesystems.com"
              className="font-black text-[#008fc9] underline decoration-sky-200 underline-offset-4 transition-colors hover:text-[#006f9d] focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2"
            >
              support@clientsurgesystems.com
            </a>
            .
          </p>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.07)]">
          {HOMEPAGE_FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const questionId = `${accordionId}-question-${index}`;
            const answerId = `${accordionId}-answer-${index}`;

            return (
              <div
                key={item.q}
                className={index > 0 ? "border-t border-slate-100" : undefined}
              >
                <h3>
                  <button
                    id={questionId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex min-h-[68px] w-full items-center justify-between gap-5 bg-white px-5 py-5 text-left transition-colors hover:bg-sky-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00AEEF] sm:px-6"
                  >
                    <span className="text-base font-black leading-6 tracking-[-0.015em] text-slate-950">
                      {item.q}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                </h3>

                {isOpen && (
                  <div
                    id={answerId}
                    role="region"
                    aria-labelledby={questionId}
                    className="px-5 pb-6 pr-16 sm:px-6 sm:pr-20"
                  >
                    <p className="max-w-3xl text-sm font-medium leading-7 text-slate-600">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
