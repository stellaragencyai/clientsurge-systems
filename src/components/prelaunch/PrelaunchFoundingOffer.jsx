import { CheckCircle2, Sparkles } from "lucide-react";

const BENEFITS = [
  "50% off the selected eligible subscription",
  "No setup fee",
  "The founding discount remains while the account stays active and eligible",
];

export default function PrelaunchFoundingOffer() {
  return (
    <section className="prelaunch-offer" aria-labelledby="prelaunch-offer-heading">
      <div className="prelaunch-offer__inner">
        <div className="prelaunch-offer__card">
          <span className="prelaunch-offer__badge">
            <Sparkles size={14} aria-hidden="true" /> First 1,000 businesses
          </span>
          <h2 id="prelaunch-offer-heading" className="prelaunch-offer__heading">
            Founding Access
          </h2>
          <p className="prelaunch-offer__intro">
            Join before the founding allocation closes and receive:
          </p>
          <ul className="prelaunch-offer__list">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="prelaunch-offer__item">
                <CheckCircle2 size={19} aria-hidden="true" className="prelaunch-offer__check" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
          <p className="prelaunch-offer__qualification">
            Limited to the first 1,000 eligible businesses. Package features and eligibility vary by
            plan. Full offer terms will be provided before purchase.
          </p>
        </div>
      </div>
    </section>
  );
}
