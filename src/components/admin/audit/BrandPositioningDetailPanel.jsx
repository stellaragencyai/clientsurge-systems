import {
  Megaphone,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lightbulb,
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";

const STATUS_STYLES = {
  passed: { color: "#16a34a", Icon: CheckCircle2 },
  needs_proof: { color: "#d97706", Icon: AlertCircle },
  failed: { color: "#dc2626", Icon: XCircle },
};

function ClarityRow({ label, value, positive }) {
  const color = positive ? "#16a34a" : "#d97706";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function KeywordList({ keywords, emptyLabel }) {
  if (!keywords || keywords.length === 0) {
    return <span className="text-[11px] text-muted-foreground italic">{emptyLabel}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map((kw, i) => (
        <span
          key={i}
          className="text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,174,239,0.08)", color: "#006BB0" }}
        >
          {kw}
        </span>
      ))}
    </div>
  );
}

export default function BrandPositioningDetailPanel({ detail }) {
  const detected = detail?.detected_content || {};
  const analysis = detail?.analysis || {};
  const preferred = detail?.preferred_positioning || {};

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-primary" />
        <h3
          className="text-base font-bold text-foreground"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Brand Positioning & Offer Clarity
        </h3>
      </div>

      {/* Detected content */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Detected Homepage Content
          </p>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">Page Title</span>
              <p className="text-xs text-foreground mt-0.5">{detected.page_title || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">Meta Description</span>
              <p className="text-xs text-foreground mt-0.5">{detected.meta_description || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">H1 Headline</span>
              <p className="text-xs text-foreground mt-0.5">{detected.h1 || "—"}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">H2 Subheadlines</span>
              {detected.h2s?.length > 0 ? (
                <ul className="text-xs text-foreground mt-0.5 space-y-0.5">
                  {detected.h2s.slice(0, 3).map((h2, i) => (
                    <li key={i}>• {h2}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">—</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Detected CTAs
          </p>
          {detected.ctas?.length > 0 ? (
            <div className="space-y-1">
              {detected.ctas.slice(0, 8).map((cta, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  {detected.primary_ctas?.includes(cta) ? (
                    <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                  ) : detected.vague_ctas?.includes(cta) ? (
                    <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span className="text-foreground">{cta}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No CTAs detected</p>
          )}
        </div>
      </div>

      {/* Clarity analysis */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Target className="w-3 h-3" /> Clarity Analysis
          </p>
          <ClarityRow label="Target audience clarity" value={analysis.target_audience_clarity ? "Clear" : "Needs Proof"} positive={analysis.target_audience_clarity} />
          <ClarityRow label="Offer clarity" value={analysis.offer_clarity ? "Clear" : "Needs Proof"} positive={analysis.offer_clarity} />
          <ClarityRow label="Problem clarity" value={analysis.problem_clarity ? "Clear" : "Needs Proof"} positive={analysis.problem_clarity} />
          <ClarityRow label="Outcome clarity" value={analysis.outcome_clarity ? "Clear" : "Needs Proof"} positive={analysis.outcome_clarity} />
          <ClarityRow label="Trust/proof evidence" value={analysis.trust_proof_exists ? "Exists" : "Needs Proof"} positive={analysis.trust_proof_exists} />
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Zap className="w-3 h-3" /> Detected Keywords
          </p>
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">Audience</span>
              <div className="mt-0.5"><KeywordList keywords={analysis.audience_keywords_found} emptyLabel="None found" /></div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">Offer</span>
              <div className="mt-0.5"><KeywordList keywords={analysis.offer_keywords_found} emptyLabel="None found" /></div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">Problem</span>
              <div className="mt-0.5"><KeywordList keywords={analysis.problem_keywords_found} emptyLabel="None found" /></div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground">Outcome</span>
              <div className="mt-0.5"><KeywordList keywords={analysis.outcome_keywords_found} emptyLabel="None found" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings: unsupported claims & generic AI wording */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div
          className="rounded-xl p-3"
          style={{
            background: analysis.unsupported_claims?.length > 0 ? "rgba(220,38,38,0.06)" : "rgba(22,163,74,0.06)",
            border: `1px solid ${analysis.unsupported_claims?.length > 0 ? "rgba(220,38,38,0.2)" : "rgba(22,163,74,0.2)"}`,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: analysis.unsupported_claims?.length > 0 ? "#dc2626" : "#16a34a" }}>
            Unsupported Claims
          </p>
          {analysis.unsupported_claims?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.unsupported_claims.map((claim, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white" style={{ color: "#dc2626" }}>
                  {claim}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No unsupported claims detected.</p>
          )}
        </div>

        <div
          className="rounded-xl p-3"
          style={{
            background: analysis.generic_ai_phrases?.length > 0 ? "rgba(217,119,6,0.06)" : "rgba(22,163,74,0.06)",
            border: `1px solid ${analysis.generic_ai_phrases?.length > 0 ? "rgba(217,119,6,0.2)" : "rgba(22,163,74,0.2)"}`,
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: analysis.generic_ai_phrases?.length > 0 ? "#d97706" : "#16a34a" }}>
            Generic AI Wording
          </p>
          {analysis.generic_ai_phrases?.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.generic_ai_phrases.map((phrase, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-white" style={{ color: "#d97706" }}>
                  {phrase}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No generic AI buzzwords detected.</p>
          )}
        </div>
      </div>

      {/* Preferred positioning recommendations */}
      <div className="rounded-xl p-3" style={{ background: "rgba(0,174,239,0.04)", border: "1px solid rgba(0,174,239,0.15)" }}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
          <Lightbulb className="w-3 h-3" /> Recommended Positioning Language
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground">Preferred Headlines</span>
            <ul className="text-xs text-foreground mt-0.5 space-y-1">
              {preferred.headlines?.map((h, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <TrendingUp className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground">Preferred Subheadlines</span>
            <ul className="text-xs text-foreground mt-0.5 space-y-1">
              {preferred.subheadlines?.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <TrendingUp className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground">Preferred CTAs</span>
            <ul className="text-xs text-foreground mt-0.5 space-y-1">
              {preferred.ctas?.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <TrendingUp className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}