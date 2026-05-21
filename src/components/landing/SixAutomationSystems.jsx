import { ArrowRight, CalendarCheck, Inbox, MessageSquare, PhoneCall, RefreshCw, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { SIX_AUTOMATIONS } from "@/lib/sixAutomations";

const ICONS = {
  inbox: Inbox,
  phone: PhoneCall,
  message: MessageSquare,
  calendar: CalendarCheck,
  star: Star,
  refresh: RefreshCw,
};

export default function SixAutomationSystems() {
  return (
    <section id="six-automations" className="px-4 py-16 md:px-6 md:py-24" style={{ background: "#ffffff" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#0088CC" }}>
            The core offer
          </p>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            The 6 ClientSurge Automation Systems
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            ClientSurge Systems packages the essential revenue automations local service businesses need to capture,
            follow up, book, review, and reactivate customers without adding staff.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SIX_AUTOMATIONS.map((automation, index) => {
            const Icon = ICONS[automation.icon] || MessageSquare;

            return (
              <Link
                key={automation.slug}
                to={automation.routePath}
                className="group block rounded-lg border bg-white p-5 no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ borderColor: "rgba(0,174,239,0.16)" }}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,174,239,0.12), rgba(0,59,143,0.08))",
                      border: "1px solid rgba(0,174,239,0.18)",
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#0088CC" }} />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">0{index + 1}</span>
                </div>

                <h3 className="mb-3 text-xl font-bold leading-tight text-foreground">{automation.title}</h3>
                <p className="mb-5 text-sm leading-6 text-muted-foreground">{automation.summary}</p>

                <ul className="mb-5 space-y-2">
                  {automation.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: "#0088CC" }} />
                      {bullet}
                    </li>
                  ))}
                </ul>

                <div className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: "#0088CC" }}>
                  See how it works
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
