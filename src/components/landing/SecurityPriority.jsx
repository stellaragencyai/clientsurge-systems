import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const trustItems = [
  {
    icon: "ssl",
    title: "SSL Secure",
    body: "Your data is protected with bank-level SSL security protocols.",
  },
  {
    icon: "stripe",
    title: "Stripe Secure Payment",
    body: "We use Stripe, a global leader in online payments, to keep transactions safe and secure.",
  },
  {
    icon: "guarantee",
    title: "30-Day Money-Back Guarantee",
    body: "Not satisfied? Get a full refund within 30 days, no questions asked. Your investment is safe.",
  },
  {
    icon: "verified",
    title: "Verified & Trusted",
    body: "Our platform and automation systems are trusted by local service businesses that rely on fast follow-up.",
  },
  {
    icon: "gdpr",
    title: "GDPR Compliant",
    body: "We follow privacy-first data practices so your customer information is handled with care.",
  },
];

function BadgeArtwork({ type }) {
  if (type === "ssl") {
    return (
      <svg className="security-priority__art security-priority__art--ssl" viewBox="0 0 160 160" role="img" aria-label="SSL secure shield">
        <defs>
          <linearGradient id="sslGold" x1="24" x2="136" y1="20" y2="142" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fff3a7" />
            <stop offset="0.27" stopColor="#f7bb35" />
            <stop offset="0.62" stopColor="#9b6414" />
            <stop offset="1" stopColor="#ffd76a" />
          </linearGradient>
          <linearGradient id="sslDark" x1="40" x2="120" y1="36" y2="122" gradientUnits="userSpaceOnUse">
            <stop stopColor="#111827" />
            <stop offset="1" stopColor="#05070c" />
          </linearGradient>
        </defs>
        <path fill="url(#sslGold)" d="M80 12c17 14 37 17 57 15v44c0 38-24 61-57 77-33-16-57-39-57-77V27c20 2 40-1 57-15Z" />
        <path fill="url(#sslDark)" d="M80 25c14 11 31 13 47 12v34c0 30-18 49-47 64-29-15-47-34-47-64V37c16 1 33-1 47-12Z" />
        <path fill="#f8cf5a" d="M42 45c14 1 27-2 38-11 11 9 24 12 38 11v8c-14 1-27-2-38-10-11 8-24 11-38 10v-8Z" />
        <path fill="#f8cf5a" d="M45 104c9 11 21 20 35 28 14-8 26-17 35-28-10 7-21 11-35 16-14-5-25-9-35-16Z" opacity=".9" />
        <path fill="#f8cf5a" d="M64 72h32a7 7 0 0 1 7 7v27a7 7 0 0 1-7 7H64a7 7 0 0 1-7-7V79a7 7 0 0 1 7-7Zm6 0V61a10 10 0 0 1 20 0v11h-8V61a2 2 0 0 0-4 0v11h-8Z" />
        <circle cx="80" cy="91" r="5" fill="#0b111e" />
        <path fill="#0b111e" d="M78 94h4l2 12h-8l2-12Z" />
        <text x="80" y="53" textAnchor="middle" className="security-priority__art-text security-priority__art-text--ssl">SECURE</text>
        <text x="80" y="124" textAnchor="middle" className="security-priority__art-text security-priority__art-text--ssl-small">SSL ENCRYPTION</text>
      </svg>
    );
  }

  if (type === "stripe") {
    return (
      <svg className="security-priority__art security-priority__art--stripe" viewBox="0 0 170 150" role="img" aria-label="Stripe secure payment">
        <text x="18" y="46" className="security-priority__stripe-word">stripe</text>
        <rect x="18" y="58" width="88" height="62" rx="10" fill="#3b3b3b" />
        <rect x="25" y="68" width="75" height="12" rx="2" fill="#101318" />
        <circle cx="42" cy="101" r="9" fill="none" stroke="#6b7280" strokeWidth="4" />
        <circle cx="52" cy="101" r="9" fill="none" stroke="#4b5563" strokeWidth="4" />
        <path fill="#f59f33" d="M113 84h29a6 6 0 0 1 6 6v31a6 6 0 0 1-6 6h-29a6 6 0 0 1-6-6V90a6 6 0 0 1 6-6Zm6 0V73a10 10 0 0 1 20 0v11h-7V73a3 3 0 0 0-6 0v11h-7Z" />
        <circle cx="128" cy="105" r="4" fill="#263241" />
        <path fill="#263241" d="M126 108h4l2 9h-8l2-9Z" />
        <text x="78" y="140" textAnchor="middle" className="security-priority__stripe-payment">Payment</text>
      </svg>
    );
  }

  if (type === "guarantee") {
    const points = Array.from({ length: 40 }, (_, index) => {
      const angle = (index / 40) * Math.PI * 2 - Math.PI / 2;
      const radius = index % 2 === 0 ? 69 : 59;
      return `${80 + Math.cos(angle) * radius},${80 + Math.sin(angle) * radius}`;
    }).join(" ");

    return (
      <svg className="security-priority__art security-priority__art--guarantee" viewBox="0 0 160 160" role="img" aria-label="30 days money back guarantee">
        <defs>
          <radialGradient id="guaranteeGold" cx="45%" cy="35%" r="62%">
            <stop stopColor="#fff6ad" />
            <stop offset="0.43" stopColor="#d59b21" />
            <stop offset="0.76" stopColor="#875414" />
            <stop offset="1" stopColor="#f5ce57" />
          </radialGradient>
        </defs>
        <polygon points={points} fill="url(#guaranteeGold)" />
        <circle cx="80" cy="80" r="51" fill="#332615" stroke="#f6d76d" strokeWidth="4" />
        <circle cx="80" cy="80" r="42" fill="#503916" stroke="#bd8420" strokeWidth="2" />
        <text x="80" y="40" textAnchor="middle" className="security-priority__seal-arc">SATISFACTION GUARANTEE</text>
        <text x="80" y="82" textAnchor="middle" className="security-priority__thirty">30</text>
        <text x="80" y="103" textAnchor="middle" className="security-priority__days">DAYS</text>
        <rect x="42" y="109" width="76" height="20" rx="2" fill="#f0c04b" />
        <text x="80" y="123" textAnchor="middle" className="security-priority__money">MONEY BACK</text>
      </svg>
    );
  }

  if (type === "verified") {
    const points = Array.from({ length: 32 }, (_, index) => {
      const angle = (index / 32) * Math.PI * 2 - Math.PI / 2;
      const radius = index % 2 === 0 ? 68 : 58;
      return `${80 + Math.cos(angle) * radius},${80 + Math.sin(angle) * radius}`;
    }).join(" ");

    return (
      <svg className="security-priority__art security-priority__art--verified" viewBox="0 0 160 160" role="img" aria-label="Verified seal">
        <polygon points={points} fill="#15964a" />
        <circle cx="80" cy="80" r="56" fill="#eaffee" stroke="#14904b" strokeWidth="6" />
        <circle cx="80" cy="80" r="45" fill="#ffffff" stroke="#2dae5a" strokeWidth="3" />
        <path fill="#14904b" d="M28 64h104a11 11 0 0 1 11 11v10a11 11 0 0 1-11 11H28a11 11 0 0 1-11-11V75a11 11 0 0 1 11-11Z" />
        <text x="80" y="88" textAnchor="middle" className="security-priority__verified-word">VERIFIED</text>
        <text x="80" y="36" textAnchor="middle" className="security-priority__verified-ring">VERIFIED</text>
        <text x="80" y="128" textAnchor="middle" className="security-priority__verified-ring">VERIFIED</text>
      </svg>
    );
  }

  return (
    <svg className="security-priority__art security-priority__art--gdpr" viewBox="0 0 160 160" role="img" aria-label="GDPR compliant badge">
      <defs>
        <radialGradient id="gdprCenter" cx="48%" cy="42%" r="64%">
          <stop stopColor="#1f5fff" />
          <stop offset="1" stopColor="#002b89" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="67" fill="#d7dbe2" />
      <circle cx="80" cy="80" r="55" fill="#ffffff" />
      <circle cx="80" cy="80" r="43" fill="url(#gdprCenter)" />
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
        return <circle key={index} cx={80 + Math.cos(angle) * 30} cy={80 + Math.sin(angle) * 30} r="2.4" fill="#ffe24f" />;
      })}
      <circle cx="80" cy="80" r="18" fill="#ffffff" />
      <path fill="none" stroke="#0c4ee8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="7" d="m68 80 8 8 17-19" />
      <text x="80" y="23" textAnchor="middle" className="security-priority__gdpr-ring">General Data Protection Regulation</text>
      <text x="80" y="141" textAnchor="middle" className="security-priority__gdpr-word">GDPR COMPLIANT</text>
    </svg>
  );
}

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
        <BadgeArtwork type={item.icon} />
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
          width: clamp(100px, 9vw, 132px);
          aspect-ratio: 1;
          margin: 0 auto 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .security-priority__art {
          width: 100%;
          height: 100%;
          overflow: visible;
          filter: drop-shadow(0 20px 28px rgba(15, 23, 42, 0.12));
        }

        .security-priority__art-text,
        .security-priority__art-text--ssl-small,
        .security-priority__seal-arc,
        .security-priority__days,
        .security-priority__money,
        .security-priority__verified-word,
        .security-priority__verified-ring,
        .security-priority__gdpr-ring,
        .security-priority__gdpr-word {
          font-family: Arial, Helvetica, sans-serif;
          font-weight: 900;
          letter-spacing: 0.04em;
        }

        .security-priority__art-text {
          fill: #f8cf5a;
          font-size: 11px;
        }

        .security-priority__art-text--ssl-small {
          fill: #f8cf5a;
          font-size: 6px;
        }

        .security-priority__stripe-word {
          fill: #6f8dff;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 44px;
          font-weight: 900;
          letter-spacing: -0.06em;
        }

        .security-priority__stripe-payment {
          fill: #4b5563;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 18px;
          font-weight: 700;
        }

        .security-priority__seal-arc {
          fill: #f3cf62;
          font-size: 6px;
        }

        .security-priority__thirty {
          fill: #f8d569;
          font-family: Georgia, "Times New Roman", serif;
          font-size: 48px;
          font-weight: 900;
        }

        .security-priority__days {
          fill: #f8d569;
          font-size: 14px;
        }

        .security-priority__money {
          fill: #2b1d08;
          font-size: 9px;
        }

        .security-priority__verified-word {
          fill: #ffffff;
          font-size: 23px;
        }

        .security-priority__verified-ring {
          fill: #15803d;
          font-size: 8px;
          letter-spacing: 0.22em;
        }

        .security-priority__gdpr-ring {
          fill: #303844;
          font-size: 7px;
        }

        .security-priority__gdpr-word {
          fill: #111827;
          font-size: 10px;
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
