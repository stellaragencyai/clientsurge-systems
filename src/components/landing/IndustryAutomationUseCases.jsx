import { CheckCircle2 } from "lucide-react";
import { getIndustryAutomationUseCases, SIX_AUTOMATIONS } from "@/lib/sixAutomations";

export default function IndustryAutomationUseCases({ industry }) {
  const useCases = getIndustryAutomationUseCases(industry.slug);

  if (!useCases.length) {
    return null;
  }

  return (
    <section className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#f8fbff" }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#005f99" }}>
            Industry-specific workflows
          </p>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            How the 6 automations work for {industry.shortName}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            The same ClientSurge engine is mapped to the real lead flow, timing, and revenue moments in this industry.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {SIX_AUTOMATIONS.map((automation, index) => (
            <div
              key={automation.slug}
              className="flex gap-4 rounded-lg border bg-white p-5"
              style={{ borderColor: "rgba(0,174,239,0.14)" }}
            >
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(0,174,239,0.1)", color: "#005f99" }}
              >
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-2 text-base font-bold text-foreground">{automation.shortTitle}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{useCases[index]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
