import { motion } from "framer-motion";
import {
  BadgeCheck,
  CreditCard,
  FileCheck2,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

const trustItems = [
  {
    icon: LockKeyhole,
    title: "SSL Secure",
    body: "Your data is protected with bank-level SSL security protocols.",
  },
  {
    icon: CreditCard,
    title: "Stripe Secure Payment",
    body: "We use Stripe, a global leader in online payments, to keep transactions safe and secure.",
  },
  {
    icon: RotateCcw,
    title: "30-Day Money-Back Guarantee",
    body: "Not satisfied? Get a full refund within 30 days, no questions asked. Your investment is safe.",
  },
  {
    icon: BadgeCheck,
    title: "Verified & Trusted",
    body: "Our platform and automation systems are trusted by local service businesses that rely on fast follow-up.",
  },
  {
    icon: FileCheck2,
    title: "Privacy-First Data Handling",
    body: "We follow privacy-first data practices so your customer information is handled with care.",
  },
];

function TrustBadge({ item, index }) {
  const Icon = item.icon;

  return (
    <motion.article
      className="security-priority__item"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="security-priority__badge" aria-hidden="true">
        <span className="security-priority__badge-ring" />
        <Icon className="security-priority__icon" strokeWidth={1.9} />
        <span className="security-priority__badge-label">{item.title.split(" ")[0]}</span>
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
          <h2 id="security-priority-title">
            Your Trust & Security <span>Are Our Priority</span>
          </h2>
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
          background: #ffffff;
          color: #050b14;
          padding: clamp(72px, 9vw, 124px) 24px clamp(68px, 8vw, 112px);
          border-top: 1px solid rgba(0, 174, 239, 0.08);
          overflow: hidden;
        }

        .security-priority__inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .security-priority__header {
          max-width: 860px;
          margin: 0 auto clamp(54px, 7vw, 86px);
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
          color: #050b14;
          font-size: clamp(34px, 5vw, 58px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 1.06;
        }

        .security-priority h2 span {
          color: #00aeef;
          white-space: nowrap;
        }

        .security-priority__header p {
          max-width: 840px;
          margin: 22px auto 0;
          color: rgba(5, 11, 20, 0.72);
          font-size: clamp(18px, 2.2vw, 24px);
          line-height: 1.55;
        }

        .security-priority__grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: clamp(20px, 3vw, 34px);
          align-items: start;
        }

        .security-priority__item {
          min-width: 0;
          text-align: center;
        }

        .security-priority__badge {
          position: relative;
          width: clamp(92px, 9vw, 124px);
          aspect-ratio: 1;
          margin: 0 auto 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 28px;
          background:
            radial-gradient(circle at 32% 20%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 38%),
            linear-gradient(145deg, rgba(0, 174, 239, 0.14), rgba(0, 59, 143, 0.08));
          border: 1px solid rgba(0, 136, 204, 0.2);
          box-shadow: 0 22px 52px rgba(0, 59, 143, 0.14), inset 0 1px 0 rgba(255,255,255,0.9);
        }

        .security-priority__badge-ring {
          position: absolute;
          inset: 12%;
          border-radius: 24px;
          border: 2px solid rgba(0, 174, 239, 0.22);
        }

        .security-priority__icon {
          position: relative;
          z-index: 1;
          width: 44%;
          height: 44%;
          color: #003b8f;
          filter: drop-shadow(0 6px 14px rgba(0, 174, 239, 0.22));
        }

        .security-priority__badge-label {
          position: absolute;
          left: 50%;
          bottom: 14%;
          transform: translateX(-50%);
          color: #006bb0;
          font-size: clamp(8px, 0.8vw, 10px);
          font-weight: 900;
          letter-spacing: 0.1em;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .security-priority__item h3 {
          margin: 0 auto 18px;
          color: #050b14;
          font-size: clamp(20px, 2.1vw, 28px);
          font-weight: 900;
          letter-spacing: 0;
          line-height: 1.25;
          text-wrap: balance;
        }

        .security-priority__item p {
          max-width: 260px;
          margin: 0 auto;
          color: rgba(5, 11, 20, 0.7);
          font-size: clamp(15px, 1.6vw, 20px);
          line-height: 1.6;
        }

        @media (max-width: 1024px) {
          .security-priority__grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            row-gap: 48px;
          }

          .security-priority__item:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 640px) {
          .security-priority {
            padding-inline: 20px;
          }

          .security-priority h2 span {
            display: block;
            white-space: normal;
          }

          .security-priority__grid {
            grid-template-columns: 1fr;
            gap: 44px;
          }

          .security-priority__item:last-child {
            grid-column: auto;
          }
        }
      `}</style>
    </section>
  );
}
