/**
 * CampaignBanner Component
 * Full-width campaign display with offers and leakage calculator
 */

import { isCampaignActive } from "@/lib/campaignConfig";
import { CAMPAIGN_CONFIG } from "@/lib/campaignConfig";
import RevenueLeakageCalculator from "@/components/campaign/RevenueLeakageCalculator";
import FounderOfferCard from "@/components/campaign/FounderOfferCard";
import { motion } from "framer-motion";

export default function CampaignBanner() {
  if (!isCampaignActive()) return null;

  return (
    <section
      style={{
        background: "linear-gradient(135deg, rgba(0,174,239,0.08) 0%, rgba(255,255,255,0.95) 50%, rgba(0,59,143,0.06) 100%)",
        borderBottom: "1px solid rgba(0,136,204,0.14)",
        padding: "60px 24px",
      }}
    >
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "48px" }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#00AEEF",
              margin: "0 0 12px",
            }}
          >
            🚀 Limited Time Offer
          </p>
          <h2
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: "900",
              lineHeight: 1.1,
              color: "#0A1628",
              margin: "0 0 8px",
            }}
          >
            {CAMPAIGN_CONFIG.name} — Founder Pricing Ends Soon
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "rgba(10,22,40,0.6)",
              lineHeight: 1.6,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Lock in heavily discounted rates as an early adopter. After {CAMPAIGN_CONFIG.endDate.toLocaleDateString()}, pricing returns to standard rates.
          </p>
        </motion.div>

        {/* Leakage Calculator */}
        <div style={{ marginBottom: "60px" }}>
          <RevenueLeakageCalculator />
        </div>

        {/* Founder Offers Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "28px",
          }}
        >
          {Object.entries(CAMPAIGN_CONFIG.offers).map(([tier, offer]) => (
            <FounderOfferCard key={tier} tier={tier} offer={offer} />
          ))}
        </div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            textAlign: "center",
            marginTop: "48px",
            padding: "28px",
            borderRadius: "18px",
            background: "rgba(0,136,204,0.06)",
            border: "1px solid rgba(0,136,204,0.14)",
          }}
        >
          <p style={{ fontSize: "14px", color: "rgba(10,22,40,0.7)", margin: "0 0 12px", lineHeight: 1.5 }}>
            Have questions? Our team is here to help you choose the right package for your business.
          </p>
          <a
            href="/book"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #0088CC, #00AEEF)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: "800",
              textDecoration: "none",
              boxShadow: "0 6px 16px rgba(0,174,239,0.3)",
            }}
          >
            Schedule a Call
          </a>
        </motion.div>
      </div>
    </section>
  );
}