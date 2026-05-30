import { useEffect } from "react";
import { setPageMetadata } from "@/lib/seo";

/**
 * Blog.jsx — #22
 * 3 placeholder posts for organic SEO. Stubs only — no CMS needed yet.
 */
const POSTS = [
  { slug: "ai-automation-med-spas", title: "AI Automation for Med Spas", date: "May 2026", excerpt: "How med spas can respond faster, nurture every inquiry, and book more treatments without hiring another front-desk rep.", tag: "Med Spa" },
  { slug: "missed-call-text-back-guide", title: "Missed Call Text-Back Guide", date: "May 2026", excerpt: "A practical guide to turning missed calls into booked conversations with fast automated follow-up.", tag: "Lead Capture" },
  { slug: "how-ai-books-appointments", title: "How AI Books Appointments", date: "May 2026", excerpt: "A simple breakdown of the lead-response, follow-up, and scheduling automations that move prospects to booked appointments.", tag: "Automation" },
];

export default function Blog() {
  useEffect(() => {
    return setPageMetadata({
      title: "ClientSurge Blog | AI Automation for Local Service Businesses",
      description:
        "AI automation guides for local service businesses covering missed-call text-back, lead follow-up, appointment booking, and industry-specific growth.",
      canonicalPath: "/blog",
      ogTitle: "ClientSurge Blog | AI Automation for Local Service Businesses",
      ogDescription:
        "Practical AI automation guides for service businesses that need faster lead response, better follow-up, and more booked appointments.",
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", padding: "60px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ color: "#0A1628", fontSize: 28, fontWeight: 900, margin: "0 0 6px" }}>ClientSurge Blog</h1>
        <p style={{ color: "rgba(10,22,40,0.62)", fontSize: 14, margin: "0 0 18px" }}>
          Practical guides on missed-call recovery, AI lead follow-up, AI voice agents, local service business automation, conversion systems, and booking automation.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 36px" }} aria-label="Blog topics">
          {["Missed-call recovery", "AI lead follow-up", "AI voice agents", "Booking automation", "Conversion systems"].map((topic) => (
            <span key={topic} style={{ color: "rgba(10,22,40,0.68)", border: "1px solid rgba(10,22,40,0.12)", borderRadius: 9999, padding: "4px 10px", fontSize: 11 }}>
              {topic}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {POSTS.map(p => (
            <div key={p.slug} style={{ background: "#f8fbff", border: "1px solid rgba(10,22,40,0.1)", borderRadius: 14, padding: "22px 24px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <span style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 9999, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>{p.tag}</span>
                <span style={{ color: "rgba(10,22,40,0.38)", fontSize: 11, alignSelf: "center" }}>{p.date}</span>
              </div>
              <h2 style={{ color: "#0A1628", fontSize: 17, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 }}>{p.title}</h2>
              <p style={{ color: "rgba(10,22,40,0.64)", fontSize: 13, lineHeight: 1.7, margin: "0 0 14px" }}>{p.excerpt}</p>
              <span style={{ color: "#00D4FF", fontSize: 12, fontWeight: 600 }}>Read more → (coming soon)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
