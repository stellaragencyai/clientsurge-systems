import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";
import CSButton from "@/components/design-system/CSButton";

const WORKFLOW_PREVIEWS = [
  {
    title: "Lead Captured",
    before: "Inquiry details are scattered across calls, forms, ads, inboxes, and staff notes.",
    after: "The lead source, contact details, service need, and next step are organized in one workflow.",
  },
  {
    title: "Response Triggered",
    before: "A new inquiry waits until someone has time to answer or call back.",
    after: "An approved response path triggers quickly and routes the conversation toward the right next step.",
  },
  {
    title: "Follow-Up Structured",
    before: "Follow-up depends on memory and is easy to forget after the first attempt.",
    after: "A controlled sequence keeps the opportunity moving until there is a reply, booking, opt-out, or closed status.",
  },
  {
    title: "Launch Proof Checked",
    before: "The business has to trust that the workflow works without seeing the path clearly.",
    after: "ClientSurge checks the lead path, response flow, booking handoff, and activity proof before go-live.",
  },
];

const CHECKS = [
  "Lead source captured",
  "Response path verified",
  "Booking handoff reviewed",
  "Stop conditions defined",
  "Activity proof visible",
  "Human handoff preserved",
];

export default function IndustrySuccessGallery({ industry = {}, industrySlug = "" }) {
  const navigate = useNavigate();
  const label = industry.industry_name || industry.shortName || "Service Business";

  return (
    <section className="py-20 px-4 md:px-6 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,174,239,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(0,59,143,0.05) 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-14">
          <CSSectionHeader
            eyebrow="Workflow Proof Preview"
            title={`What a ${label} Launch Should Prove`}
            subtitle="No fake testimonials. No invented revenue screenshots. This section shows the operational proof the system should make visible before launch."
            align="center"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {WORKFLOW_PREVIEWS.map((item) => (
            <article key={item.title} className="cs-glow-card p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">{industrySlug || "workflow"}</p>
              <h3 className="font-titles text-xl font-bold text-foreground mb-5">{item.title}</h3>
              <div className="space-y-4">
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1.5">Before</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.before}</p>
                </div>
                <div className="flex justify-center"><div className="rounded-full p-2 bg-primary/10"><ArrowRight className="w-4 h-4 text-primary" /></div></div>
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-1.5">After ClientSurge</p>
                  <p className="text-sm text-foreground leading-relaxed">{item.after}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="cs-card rounded-2xl overflow-hidden mb-12" style={{ background: "linear-gradient(135deg, #003B8F 0%, #006BB0 50%, #00AEEF 100%)" }}>
          <div className="p-8 md:p-12">
            <h3 className="text-center text-white text-xl md:text-2xl font-bold mb-8 font-titles">Launch Checks We Want Visible</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CHECKS.map((check) => (
                <div key={check} className="cs-card rounded-xl border border-white/15 bg-white/10 p-4 text-white text-sm font-semibold flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> {check}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-6 max-w-xl mx-auto">
            Compare the ClientSurge packages and choose how much of your lead flow you want installed first.
          </p>
          <CSButton
            onClick={() => navigate("/pricing")}
            variant="primary"
            size="lg"
            iconRight={ArrowRight}
          >
            Compare Packages
          </CSButton>
        </div>
      </div>
    </section>
  );
}