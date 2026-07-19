import { ArrowRight, Check, Sparkles } from "lucide-react";

const cx = (...values) => values.filter(Boolean).join(" ");

export function CSCommerceButton({ children, className, variant = "primary", ...props }) {
  return (
    <button className={cx("cs-commerce-button", `cs-commerce-button--${variant}`, className)} {...props}>
      <span>{children}</span>
      <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
}

export function CSPopularBadge({ children = "Most Popular", className }) {
  return (
    <span className={cx("cs-popular-badge", className)}>
      <Sparkles size={14} aria-hidden="true" />
      {children}
    </span>
  );
}

export function CSPricingCard({
  name,
  description,
  price,
  cadence = "/month",
  setupPrice,
  contractNote = "No long-term contracts. Cancel anytime.",
  summary,
  emphasis,
  features = [],
  operationalDetails = [],
  footerNote,
  popular = false,
  actionLabel = "Add to Cart",
  onAction,
  className,
}) {
  return (
    <article className={cx("cs-pricing-card", popular && "cs-pricing-card--popular", className)}>
      {popular ? <CSPopularBadge /> : null}
      <header className="cs-pricing-card__header">
        <h2>{name}</h2>
        {popular ? <p className="cs-pricing-card__popular-copy">Most Popular</p> : null}
        <p className="cs-pricing-card__description">{description}</p>
      </header>

      <div className="cs-pricing-card__price-block">
        <div className="cs-pricing-card__price-row">
          <strong>{price}</strong>
          <span>{cadence}</span>
        </div>
        {setupPrice ? <p className="cs-pricing-card__setup">{setupPrice}</p> : null}
        <p className="cs-pricing-card__contract">{contractNote}</p>
      </div>

      <div className="cs-pricing-card__section">
        {summary ? <p>{summary}</p> : null}
        {emphasis ? <p className="cs-pricing-card__emphasis">{emphasis}</p> : null}
        <ul className="cs-pricing-card__features">
          {features.map((feature) => (
            <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>
          ))}
        </ul>
      </div>

      {operationalDetails.length ? (
        <ul className="cs-pricing-card__operations">
          {operationalDetails.map((detail) => <li key={detail}>{detail}</li>)}
        </ul>
      ) : null}

      <footer className="cs-pricing-card__footer">
        {footerNote ? <p>{footerNote}</p> : null}
        <CSCommerceButton variant={popular ? "primary" : "outline"} onClick={onAction}>
          {actionLabel}
        </CSCommerceButton>
      </footer>
    </article>
  );
}

export function CSPricingGrid({ children, className }) {
  return <div className={cx("cs-pricing-grid", className)}>{children}</div>;
}