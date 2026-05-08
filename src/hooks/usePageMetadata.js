/**
 * usePageMetadata.js — #345
 * Sets <title> and <meta name="description"> for each industry page.
 * Call in MedSpa, Dental, Tanning, Chiro, HVAC, Roofing, Contractors pages.
 */
import { useEffect } from "react";

const INDUSTRY_META = {
  med_spa: {
    title: "AI Automation for Med Spas | ClientSurge Systems",
    description: "Turn every missed call and web inquiry into a booked appointment — automatically. AI systems built for med spas in Phoenix & Scottsdale.",
  },
  dental: {
    title: "AI Automation for Dental Practices | ClientSurge Systems",
    description: "Instant lead response, appointment reminders, and review requests — fully automated for dental offices in the Phoenix metro.",
  },
  tanning: {
    title: "AI Automation for Tanning Salons | ClientSurge Systems",
    description: "Auto-respond to every inquiry 24/7, fill your schedule, and collect 5-star reviews — built for tanning salons.",
  },
  chiropractic: {
    title: "AI Automation for Chiropractors | ClientSurge Systems",
    description: "Never miss a new patient inquiry. AI-powered lead capture and follow-up for chiropractic clinics in Arizona.",
  },
  hvac: {
    title: "AI Automation for HVAC Companies | ClientSurge Systems",
    description: "Respond to every service request instantly and book more jobs — AI systems built for HVAC contractors in Phoenix.",
  },
  roofing: {
    title: "AI Automation for Roofing Companies | ClientSurge Systems",
    description: "Capture every storm lead and follow up automatically. AI automation for roofing contractors in the Phoenix area.",
  },
  contractors: {
    title: "AI Automation for Contractors | ClientSurge Systems",
    description: "Turn website visitors and missed calls into booked jobs — AI-powered lead systems for general contractors.",
  },
};

export function usePageMetadata(industry) {
  useEffect(() => {
    const meta = INDUSTRY_META[industry];
    if (!meta) return;
    document.title = meta.title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute("content", meta.description);
    return () => { document.title = "ClientSurge Systems | AI Automation for Local Businesses"; };
  }, [industry]);
}

export { INDUSTRY_META };
