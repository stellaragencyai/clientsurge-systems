import { CheckCircle2 } from "lucide-react";
import { launchTimelineSteps, iconMap } from "./coreOfferData";

export default function LaunchTimeline() {
  return (
    <div className="mt-16 md:mt-20">
      {/* Section Header */}
      <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase text-center mb-3">
        Get Live In 2 Hours
      </p>
      <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
        Our Process — Start To Launch
      </h3>
      <p className="text-center text-sm text-muted-foreground mb-10">
        From first contact to successful launch in 5 clear steps. We make it easy.
      </p>

      {/* Desktop: Horizontal step tracker with icon + step number + title + duration */}
      <div className="hidden sm:flex justify-center items-start gap-4 md:gap-6 px-4 mb-14">
        {launchTimelineSteps.map((step, idx) => {
          const Icon = iconMap[step.icon];
          return (
            <div key={step.id} className="flex items-start gap-4 md:gap-6">
              <div className="flex flex-col items-center gap-1.5">
                {/* Step number badge above circle */}
                <span
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(154,92,46,0.12)",
                    color: "#9a5c2e",
                  }}
                >
                  Step {step.number}
                </span>
                {/* Icon circle */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
                    boxShadow: "0 4px 12px rgba(154,92,46,0.3)",
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-semibold text-foreground text-center max-w-[80px] leading-tight">{step.title}</p>
                <p className="text-[10px] text-muted-foreground text-center">{step.duration}</p>
              </div>
              {idx < launchTimelineSteps.length - 1 && (
                <div className="flex-shrink-0 text-primary/30 text-2xl mt-10">→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical Stepper summary */}
      <div className="sm:hidden relative pl-10 mb-12">
        <div
          className="absolute left-4 top-3 bottom-3 w-0.5"
          style={{ background: "linear-gradient(180deg, #9a5c2e 0%, rgba(154,92,46,0.2) 100%)" }}
        />
        <div className="space-y-6">
          {launchTimelineSteps.map((step) => {
            const Icon = iconMap[step.icon];
            return (
              <div key={step.id} className="relative flex items-start gap-4">
                <div
                  className="absolute -left-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{
                    background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
                    boxShadow: "0 2px 8px rgba(154,92,46,0.4)",
                  }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div
                  className="rounded-xl px-4 py-3 flex-1"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(154,92,46,0.12)",
                    boxShadow: "0 4px 12px rgba(111,67,31,0.06)",
                  }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#9a5c2e" }}>
                    Step {step.number}
                  </p>
                  <p className="text-sm font-bold text-foreground">{step.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(154,92,46,0.8)" }}>{step.duration}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed vertical timeline with alternating image/content */}
      <div className="relative">
        <div
          className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 hidden md:block"
          style={{
            background: "linear-gradient(180deg, rgba(154,92,46,0.6) 0%, rgba(154,92,46,0.3) 50%, rgba(154,92,46,0.1) 100%)",
            transform: "translateX(-50%)",
          }}
        />

        <div className="space-y-16 md:space-y-20">
          {launchTimelineSteps.map((step, idx) => {
            const isEven = idx % 2 === 0;
            const Icon = iconMap[step.icon];
            return (
              <div key={step.id} className="relative">
                {/* Center dot on desktop */}
                <div
                  className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-8 w-10 h-10 rounded-full items-center justify-center z-10"
                  style={{
                    background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)",
                    boxShadow: "0 0 0 4px rgba(154,92,46,0.15), 0 4px 12px rgba(154,92,46,0.3)",
                  }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center ${isEven ? "" : "md:[&>:first-child]:order-2 md:[&>:last-child]:order-1"}`}>
                  {/* Content */}
                  <div>
                    <div
                      className="rounded-2xl p-6 md:p-7"
                      style={{
                        background: "rgba(255,255,255,0.9)",
                        border: "1.5px solid rgba(154,92,46,0.12)",
                        boxShadow: "0 8px 24px rgba(111,67,31,0.06)",
                      }}
                    >
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-4"
                        style={{ background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)" }}
                      >
                        <Icon className="w-3 h-3" />
                        Step {step.number} — {step.duration}
                      </div>
                      <h4 className="text-lg md:text-xl font-bold text-foreground mb-4">
                        {step.title}
                      </h4>
                      <ul className="space-y-2.5">
                        {step.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                            <span className="text-sm leading-relaxed text-foreground/75">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Image */}
                  <div
                    className="rounded-2xl overflow-hidden h-64 md:h-72"
                    style={{
                      border: "1.5px solid rgba(154,92,46,0.12)",
                      boxShadow: "0 8px 24px rgba(111,67,31,0.1)",
                    }}
                  >
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}