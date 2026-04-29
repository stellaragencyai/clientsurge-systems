import {
  mapCardSurface,
  mapCardSurfaceActive,
  mapCardBorder,
  mapCardBorderActive,
  mapCardShadow,
  mapCardShadowActive,
  mapCardInnerFrame,
} from "./coreOfferStyles";
import { systemMapStages } from "./coreOfferData";

export default function SystemMap({ selectedSystemId, onStageSelect }) {
  return (
    <div className="mt-12 md:mt-14">
      <div className="hidden lg:block relative">
        <div
          aria-hidden="true"
          className="absolute top-8 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, rgba(154,92,46,0.12), rgba(154,92,46,0.35), rgba(154,92,46,0.12))",
          }}
        />
        <div className="grid grid-cols-5 gap-4">
          {systemMapStages.map((stage) => {
            const active = stage.systemsIncluded.includes(selectedSystemId);
            return (
              <button
                type="button"
                key={stage.id}
                className="relative rounded-2xl px-5 pt-5 pb-4 overflow-hidden transition-all duration-200"
                onClick={() => onStageSelect(stage.systemsIncluded[0])}
                style={{
                  background: active ? mapCardSurfaceActive : mapCardSurface,
                  border: active ? mapCardBorderActive : mapCardBorder,
                  boxShadow: active ? mapCardShadowActive : mapCardShadow,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"
                      : "linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%)",
                    border: active
                      ? "2px solid rgba(255,255,255,0.98)"
                      : "2px solid rgba(246,250,255,0.96)",
                    boxShadow: active
                      ? "0 0 0 6px rgba(226,232,240,0.35), 0 6px 14px rgba(100,116,139,0.12)"
                      : "0 4px 10px rgba(100,116,139,0.08)",
                  }}
                />
                <h3
                  className="relative z-10 text-sm font-semibold leading-snug mb-2"
                  style={{ color: active ? "rgba(252,241,222,0.98)" : "hsl(var(--foreground))" }}
                >
                  {stage.title}
                </h3>
                <p className="relative z-10 text-xs leading-relaxed" style={{ color: active ? "rgba(245,217,168,0.85)" : "rgba(51,65,85,0.9)" }}>
                  {stage.summary}
                </p>
                {active && (
                  <div className="relative z-10 mt-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Active</span>
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: active ? "inset 0 1px 0 rgba(255,248,235,0.15)" : mapCardInnerFrame }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {systemMapStages.map((stage) => {
          const active = stage.systemsIncluded.includes(selectedSystemId);
          return (
            <button
              type="button"
              key={stage.id}
              className="rounded-2xl px-4 py-4 relative overflow-hidden transition-all duration-200"
              onClick={() => onStageSelect(stage.systemsIncluded[0])}
              style={{
                background: active ? mapCardSurfaceActive : mapCardSurface,
                border: active ? mapCardBorderActive : mapCardBorder,
                boxShadow: active ? mapCardShadowActive : mapCardShadow,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <h3
                className="relative z-10 text-sm font-semibold leading-snug mb-1.5"
                style={{ color: active ? "rgba(252,241,222,0.98)" : "hsl(var(--foreground))" }}
              >
                {stage.title}
              </h3>
              <p className="relative z-10 text-xs leading-relaxed" style={{ color: active ? "rgba(245,217,168,0.85)" : "rgba(51,65,85,0.9)" }}>
                {stage.summary}
              </p>
              {active && (
                <div className="relative z-10 mt-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Active</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}