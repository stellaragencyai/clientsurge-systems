import { CheckCircle2, Sparkles } from "lucide-react";

const BENEFITS = [
  "50% off their selected eligible subscription",
  "No setup fee",
  "Their founding discount retained while the account remains active and eligible",
];

export default function PrelaunchFoundingOffer() {
  return (
    <section className="prelaunch-offer" aria-labelledby="prelaunch-offer-heading">
      <div className="prelaunch-offer__inner">
        <div className="prelaunch-offer__card">
          <span className="prelaunch-offer__badge">
            <Sparkles size={14} aria-hidden="true" /> Founding Access
          </span>
          <h2 id="prelaunch-offer-heading" className="prelaunch-offer__heading">
            Founding Access
          </h2>
          <p className="prelaunch-offer__intro">
            The first 1,000 eligible verified businesses will receive:
          </p>
          <ul className="prelaunch-offer__list">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="prelaunch-offer__item">
                <CheckCircle2 size={18} aria-hidden="true" className="prelaunch-offer__check" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <p className="prelaunch-offer__qualification">
            Limited to the first 1,000 eligible verified businesses. Package features vary by plan.
          </p>
        </div>
      </div>
    </section>
  );
}