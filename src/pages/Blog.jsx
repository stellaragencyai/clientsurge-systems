import { useEffect } from "react";
import { setPageMetadata } from "@/lib/seo";

/**
 * Blog.jsx — #22
 * 3 placeholder posts for organic SEO. Stubs only — no CMS needed yet.
 */
const POSTS = [
  { slug: "ai-automation-med-spas-phoenix", title: "How Phoenix Med Spas Are Filling Schedules with AI Automation", date: "May 2026", excerpt: "Med spas in Scottsdale and Phoenix are responding to every inquiry in under 60 seconds — without adding staff. Here's how.", tag: "Med Spa" },
  { slug: "missed-call-text-back-local-business", title: "The $0 Fix That Recovers 40% of Missed Calls for Local Businesses", date: "April 2026", excerpt: "Every unanswered call is a potential customer gone. Missed call text-back changes that instantly — and it takes 10 minutes to set up.", tag: "Lead Capture" },
  { slug: "ai-follow-up-dental-offices", title: "Dental Offices That Follow Up With AI Book 3x More New Patients", date: "April 2026", excerpt: "Most dental practices follow up with new patient leads once — then stop. AI follow-up sequences change the math completely.", tag: "Dental" },
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
    <div style={{ minHeight: "100vh", background: "#0A0F1E", padding: "60px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: "0 0 6px" }}>ClientSurge Blog</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: "0 0 36px" }}>AI automation insights for Phoenix & Scottsdale local businesses</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {POSTS.map(p => (
            <div key={p.slug} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "22px 24px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <span style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 9999, padding: "2px 10px", fontSize: 10, fontWeight: 700 }}>{p.tag}</span>
                <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, alignSelf: "center" }}>{p.date}</span>
              </div>
              <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.3 }}>{p.title}</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.7, margin: "0 0 14px" }}>{p.excerpt}</p>
              <span style={{ color: "#00D4FF", fontSize: 12, fontWeight: 600 }}>Read more → (coming soon)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
