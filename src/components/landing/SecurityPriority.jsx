import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const trustItems = [
  {
    image: "/trust-security/satisfaction-guarantee.webp",
    title: "30-Day Money-Back Guarantee",
    body: "Not satisfied? Get a full refund within 30 days, no questions asked. Your investment is safe.",
    alt: "30-day money-back satisfaction guarantee seal",
  },
  {
    image: "/trust-security/secure-ssl-encryption.webp",
    title: "SSL Secure",
    body: "Your data is protected with bank-level SSL security protocols.",
    alt: "Secure SSL encryption shield",
  },
  {
    image: "/trust-security/stripe-secure-payment.webp",
    title: "Stripe Secure Payment",
    body: "We use Stripe, a global leader in online payments, to keep transactions safe and secure.",
    alt: "Stripe secure payment badge",
  },
  {
    image: "/trust-security/verified-seal.webp",
    title: "Implementation Reviewed",
    body: "Every launch should be reviewed against approved workflows, provider setup, and customer-data handling before traffic is scaled.",
    alt: "Implementation review seal",
  },
  {
    image: "/trust-security/gdpr-compliant.webp",
    title: "GDPR Compliant",
    body: "We follow privacy-first data practices so your customer information is handled with care.",
    alt: "GDPR compliant data protection seal",
  },
];

function TrustBadge({ item, index }) {
  return (
    <motion.article
      className="security-priority__item"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="security-priority__badge">
        <img src={item.image} alt={item.alt} width="512" height="512" loading="lazy" decoding="async" />
      </div>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </motion.article>
  );
}

export default function SecurityPriority() {
  return (
    <section className="security-priority" aria-labelledby="security-priority-title">
      <div className="security-priority__inner">
        <motion.div
          className="security-priority__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="security-priority__kicker">
            <ShieldCheck aria-hidden="true" />
            Trust & Security
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ background: "#00AEEF", minHeight: "42px", boxShadow: "0 0 14px rgba(0,174,239,0.5)" }} />
            <h2 id="security-priority-title">
              Your Trust & Security <span>Are Our Priority</span>
            </h2>
          </div>
          <p>
            We are committed to providing a secure and reliable platform. Your success and safety are
            the cornerstones of ClientSurge Systems.
          </p>
        </motion.div>

        <div className="security-priority__grid">
          {trustItems.map((item, index) => (
            <TrustBadge key={item.title} item={item} index={index} />
          ))}
        </div>
      </div>

      <style>{`
        .security-priority {
          background:
            radial-gradient(circle at 50% 16%, rgba(0, 174, 239, 0.08), transparent 34%),
            linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          color: #050b14;
          padding: clamp(72px, 9vw, 124px) 24px clamp(68px, 8vw, 112px);
          border-top: 1px solid rgba(0, 174, 239, 0.08);
          overflow: hidden;
        }

        .security-priority__inner {
          max-width: 1220px;
          margin: 0 auto;
        }

        .security-priority__header {
          max-width: 860px;
          margin: 0 auto clamp(46px, 6vw, 74px);
          text-align: center;
        }

        .security-priority__kicker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 18px;
          color: #006bb0;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.22em;
          line-height: 1;
          text-transform: uppercase;
        }

        .security-priority__kicker svg {
          width: 16px;
          height: 16px;
        }

        .security-priority h2 {
          margin: 0;
          color: #001B44;
          font-family: 'Montserrat', sans-serif;
          font-size: clamp(26px, 3.5vw, 40px);
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .security-priority h2 span {
          color: #00aeef;
          white-space: nowrap;
        }

        .security-priority__header p {
          max-width: 840px;
          margin: 18px auto 0;
          color: rgba(5, 11, 20, 0.72);
          font-size: clamp(15px, 1.6vw, 20px);
          line-height: 1.55;
        }

        .security-priority__grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: clamp(18px, 2.2vw, 26px);
          align-items: stretch;
        }

        .security-priority__item {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: clamp(18px, 2.2vw, 26px) 14px 0;
        }

        .security-priority__badge {
          width: clamp(84px, 7.5vw, 104px);
          aspect-ratio: 1;
          margin: 0 auto clamp(16px, 1.8vw, 22px);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .security-priority__badge img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 14px 20px rgba(15, 23, 42, 0.12));
        }

        .security-priority__item h3 {
          width: min(100%, 230px);
          min-height: 2.5em;
          margin: 0 auto 10px;
          color: #050b14;
          font-size: clamp(14px, 1.3vw, 18px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 1.28;
          text-wrap: balance;
        }

        .security-priority__item p {
          max-width: 245px;
          margin: 0 auto;
          color: rgba(5, 11, 20, 0.7);
          font-size: clamp(12px, 1vw, 14px);
          line-height: 1.55;
        }

        @media (max-width: 1120px) {
          .security-priority__grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
            row-gap: 44px;
          }

          .security-priority__item {
            grid-column: span 2;
          }

          .security-priority__item:nth-child(4) {
            grid-column: 2 / span 2;
          }

          .security-priority__item:nth-child(5) {
            grid-column: 4 / span 2;
          }
        }

        @media (max-width: 760px) {
          .security-priority {
            padding-inline: 20px;
          }

          .security-priority h2 span {
            display: block;
            white-space: normal;
          }

          .security-priority__grid {
            grid-template-columns: 1fr;
            gap: 42px;
          }

          .security-priority__item,
          .security-priority__item:nth-child(4),
          .security-priority__item:nth-child(5) {
            grid-column: auto;
          }

          .security-priority__item h3 {
            min-height: 0;
          }
        }
      `}</style>
    </section>
  );
}