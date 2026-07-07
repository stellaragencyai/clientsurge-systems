import { ChevronRight, User, Bot, Filter, Mail, Calendar, Bell } from 'lucide-react';
import SectionHeader from '@/components/design-system/SectionHeader';

const STEP_ICONS = [User, Bot, Filter, Mail, Calendar, Bell];

/**
 * Visual lead capture workflow diagram.
 * Renders a horizontal flow: Visitor → AI Response → Qualification → Follow-up → Booking → Business Notification
 *
 * Props:
 *   - workflow: { title: string, steps: Array<{ label: string, desc: string }> }
 */
export default function LeadCaptureWorkflowSection({ workflow }) {
  if (!workflow || !workflow.steps || !workflow.steps.length) return null;

  const { title, steps } = workflow;

  return (
    <section className="py-14 md:py-20 px-4 md:px-6 bg-white/70">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Lead Capture Workflow"
          title={title}
          align="center"
        />
        <div className="mt-10">
          {/* Desktop horizontal flow */}
          <div className="hidden md:flex items-stretch justify-center gap-2 overflow-x-auto pb-4">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <div key={i} className="flex items-center flex-1 min-w-[160px] max-w-[200px]">
                  <div className="flex-1 rounded-2xl border border-primary/15 bg-white p-5 text-center shadow-[0_10px_40px_rgba(15,23,42,0.06)] transition-transform duration-200 hover:-translate-y-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/12 to-sky-100 text-primary border border-primary/20 shadow-sm mx-auto mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-foreground leading-tight mb-1">{step.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{step.desc}</p>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight className="w-5 h-5 text-primary/40 flex-shrink-0 mx-1" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile vertical flow */}
          <div className="md:hidden flex flex-col items-stretch gap-3">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary/12 to-sky-100 text-primary border border-primary/20 shadow-sm flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-tight">{step.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{step.desc}</p>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-primary/30 flex-shrink-0 -rotate-90" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}