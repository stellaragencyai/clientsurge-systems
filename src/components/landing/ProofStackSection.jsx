import { ArrowRight, CheckCircle2, FileCheck2, ShieldCheck, TestTube2 } from "lucide-react";

const PROOF_CARDS = [
  {
    icon: FileCheck2,
    label: "Verified Production Proof",
    status: "Customer data only",
    body: "Used only when a real client, real workflow, real timestamp, and real outcome can be supported.",
  },
  {
    icon: TestTube2,
    label: "Internal QA Evidence",
    status: "Clearly labeled",
    body: "Demo sends, test leads, and installation checks can prove mechanics, but they must never be presented as customer results.",
  },
  {
    icon: ShieldCheck,
    label: "Claim Guardrails",
    status: "No fake stats",
    body: "No fake testimonials, no fake live dashboards, no guaranteed revenue claims, and no made-up client outcomes.",
  },
];

export default function ProofStackSection() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-16 md:py-24" id="proof-stack">
      <div className="mx-auto max-w-6xl rounded-[2.5rem] border border-sky-100 bg-gradient-to-br from-sky-50/80 via-white to-white p-6 shadow-[0_30px_90px_rgba(0,107,176,0.10)] md:p-10">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#006BB0]">
              Proof Standards
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.055em] text-slate-950 md:text-5xl">
              Trust will come from proof labels, not fake testimonials.
            </h2>
            <p className="mt-5 text-base font-medium leading-8 text-slate-500 md:text-lg">
              IdentityIQ can lean on review volume and awards. ClientSurge should win trust by being more precise: every result, screenshot, and workflow claim needs a visible evidence label.
            </p>
            <a
              href="/proof"
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#0095d9] px-6 text-sm font-black text-white shadow-[0_16px_34px_rgba(0,149,217,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0087c6]"
            >
              View Proof Standards
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="grid gap-4">
            {PROOF_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.label}
                  className="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-[0_18px_50px_rgba(0,107,176,0.08)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#00AEEF] text-white shadow-[0_12px_28px_rgba(0,174,239,0.22)]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-950">{card.label}</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#006BB0]">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          {card.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{card.body}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
