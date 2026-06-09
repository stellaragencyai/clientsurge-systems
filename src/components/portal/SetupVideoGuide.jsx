/**
 * SetupVideoGuide — contextual video guide sidebar for onboarding steps.
 * Reduces setup friction for non-technical business owners with visual walkthroughs.
 */
import { useState } from "react";
import { PlayCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const GUIDES = [
  {
    title: "How to Find Your Twilio SID & Auth Token",
    duration: "2 min",
    url: "https://help.twilio.com/articles/14726256820123-What-is-a-Twilio-Account-SID",
    icon: "📞",
    step: "sms",
  },
  {
    title: "How to Get Your Resend API Key",
    duration: "1 min",
    url: "https://resend.com/docs/dashboard/api-keys/introduction",
    icon: "📧",
    step: "email",
  },
  {
    title: "How to Find Your Calendly / Booking Link",
    duration: "1 min",
    url: "https://help.calendly.com/hc/en-us/articles/223195488-How-do-I-share-my-Calendly-link",
    icon: "📅",
    step: "booking",
  },
  {
    title: "How to Upload Your Business Logo",
    duration: "2 min",
    url: "/client-portal",
    icon: "🖼️",
    step: "setup",
  },
];

export default function SetupVideoGuide({ currentStep }) {
  const [expanded, setExpanded] = useState(false);
  const relevantGuides = currentStep
    ? GUIDES.filter((g) => g.step === currentStep || !currentStep)
    : GUIDES;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "rgba(0,174,239,0.18)", background: "#fff" }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,174,239,0.1)" }}
        >
          <PlayCircle className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">Setup Video Guides</p>
          <p className="text-xs text-muted-foreground">Quick walkthroughs for each step</p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {relevantGuides.map((guide) => (
            <a
              key={guide.title}
              href={guide.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
            >
              <span className="text-base flex-shrink-0">{guide.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {guide.title}
                </p>
                <p className="text-[10px] text-muted-foreground">{guide.duration} guide</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}