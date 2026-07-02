import { ShieldCheck } from 'lucide-react';

const proofCards = [
  {
    label: 'Workflow proof status',
    status: 'Needs instrumentation',
    detail: 'Industry-specific results will only be published after source data, timestamp, and metric definition are attached.',
  },
  {
    label: 'Client story status',
    status: 'Verification required',
    detail: 'Testimonials stay unpublished until client identity, approval, and before/after evidence are documented.',
  },
  {
    label: 'Public metric rule',
    status: 'Source required',
    detail: 'No revenue, satisfaction, or automation-count claim is displayed without a verified data source.',
  },
];

export default function IndustrySocialProof({ industryName }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-titles text-[#001B44] text-3xl md:text-4xl font-bold mb-4">
          Proof for {industryName} Workflows
        </h2>
        <p className="text-muted-foreground text-lg">
          ClientSurge publishes industry proof only when the metric has a clear source, timestamp, and definition.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {proofCards.map((card) => (
          <div
            key={card.label}
            className="p-8 rounded-xl border border-primary/20 bg-primary/5 text-center"
          >
            <div className="flex justify-center mb-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="w-6 h-6" aria-hidden="true" />
              </span>
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
              {card.status}
            </p>
            <h3 className="font-semibold text-foreground mb-3">{card.label}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-xl border border-border bg-card/70 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Trust policy
        </p>
        <p className="text-foreground font-semibold mb-2">
          Public numbers are hidden until verified.
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Unsupported claims such as client counts, recovered revenue, satisfaction percentages, and testimonial ratings must remain off the public site until backed by production records or approved case-study evidence.
        </p>
      </div>
    </div>
  );
}
