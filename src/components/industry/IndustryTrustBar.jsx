import { Shield, Clock, CheckCircle2, Award, Lock, Star } from "lucide-react";

const TRUST_CONFIGS = {
  hvac: [
    { icon: Shield, label: "TCPA Compliant SMS" },
    { icon: Clock, label: "24/7 Emergency Response" },
    { icon: CheckCircle2, label: "ServiceTitan Compatible" },
    { icon: Award, label: "Licensed AZ Contractors" },
    { icon: Lock, label: "Encrypted Data" },
    { icon: Star, label: "A+ BBB Rated" },
  ],
  roofing: [
    { icon: Shield, label: "TCPA Compliant" },
    { icon: Award, label: "HAAG Certified Ready" },
    { icon: CheckCircle2, label: "ROC Licensed Protection" },
    { icon: Star, label: "A+ BBB Rated" },
    { icon: Lock, label: "SSL Encrypted" },
    { icon: Clock, label: "Storm Surge Ready 24/7" },
  ],
  contractors: [
    { icon: Shield, label: "TCPA Compliant" },
    { icon: Award, label: "AZ ROC Licensed" },
    { icon: CheckCircle2, label: "Buildertrend Compatible" },
    { icon: Star, label: "A+ BBB Rated" },
    { icon: Lock, label: "Encrypted Data" },
    { icon: Clock, label: "24/7 Bid Response" },
  ],
  "med-spa": [
    { icon: Lock, label: "HIPAA Compliant Data" },
    { icon: Shield, label: "TCPA Consent Protected" },
    { icon: CheckCircle2, label: "Zenoti Compatible" },
    { icon: Award, label: "Medical Director Supervised" },
    { icon: Star, label: "Secure Stripe Checkout" },
    { icon: Clock, label: "24/7 Consult Response" },
  ],
  dental: [
    { icon: Lock, label: "HIPAA Compliant" },
    { icon: Shield, label: "TCPA Protected" },
    { icon: CheckCircle2, label: "Dentrix Compatible" },
    { icon: Award, label: "ADA Best Practices" },
    { icon: Star, label: "A+ BBB Rated" },
    { icon: Clock, label: "24/7 Emergency Response" },
  ],
  chiropractic: [
    { icon: Lock, label: "HIPAA Compliant" },
    { icon: Shield, label: "TCPA Protected" },
    { icon: CheckCircle2, label: "ChiroTouch Compatible" },
    { icon: Award, label: "ACA Best Practices" },
    { icon: Star, label: "Secure Booking" },
    { icon: Clock, label: "24/7 Patient Intake" },
  ],
};

export default function IndustryTrustBar({ industry }) {
  const badges = TRUST_CONFIGS[industry] || TRUST_CONFIGS.hvac;

  return (
    <div
      className="px-4 py-6 md:px-6"
      style={{ background: "#f7fbff", borderTop: "1px solid rgba(0,136,204,0.1)", borderBottom: "1px solid rgba(0,136,204,0.1)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {badges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <div key={i} className="flex items-center gap-2">
                <Icon style={{ width: "15px", height: "15px", color: "#0088CC", flexShrink: 0 }} />
                <span className="text-xs font-semibold" style={{ color: "rgba(5,19,46,0.72)", whiteSpace: "nowrap" }}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}