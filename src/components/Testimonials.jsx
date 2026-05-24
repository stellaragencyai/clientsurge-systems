/**
 * Testimonials.jsx — #351
 * Replaced Unsplash stock photos with branded initial avatars.
 * No external photo dependencies.
 */
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Maria R.",
    business: "Sculpt Med Spa — Scottsdale, AZ",
    rating: 5,
    text: "Within 3 days of going live, we booked 4 new consultations from leads that would have just bounced. The missed call text-back alone paid for the first month.",
    initials: "MR",
    color: "#00D4FF",
  },
  {
    name: "James T.",
    business: "Desert Dental Group — Phoenix, AZ",
    rating: 5,
    text: "We were losing new patient leads because nobody answered the phone after 5pm. Now the AI responds in seconds and books them directly into our calendar. Game changer.",
    initials: "JT",
    color: "#00FFB3",
  },
  {
    name: "Kayla M.",
    business: "Golden Hour Tanning — Tempe, AZ",
    rating: 5,
    text: "Our DMs and website inquiries used to just pile up. Now every single one gets a reply in under a minute, 24/7. I'm booking more appointments than ever without doing anything differently.",
    initials: "KM",
    color: "#A78BFA",
  },
];

function Avatar({ initials, color }) {
  return (
    <div style={{
      width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `2px solid ${color}60`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16, fontWeight: 800, color,
    }}>
      {initials}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section style={{ padding: "80px 20px", maxWidth: 1080, margin: "0 auto" }}>
      <p style={{ textAlign: "center", color: "rgba(0,212,255,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>Client Results</p>
      <h2 style={{ textAlign: "center", color: "#fff", fontSize: "clamp(22px,4vw,36px)", fontWeight: 900, margin: "0 0 48px" }}>
        Real businesses. Real results.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        {TESTIMONIALS.map((t, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{
              background: "linear-gradient(160deg, rgba(13,27,46,0.95), rgba(6,13,24,0.98))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 18, padding: "24px 22px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} style={{ width: 13, height: 13, fill: "#00AEEF", color: "#00AEEF" }} />
              ))}
            </div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.7, margin: "0 0 18px" }}>
              "{t.text}"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar initials={t.initials} color={t.color} />
              <div>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0 }}>{t.name}</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{t.business}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
