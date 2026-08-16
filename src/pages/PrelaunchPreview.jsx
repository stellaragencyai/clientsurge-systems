import { useEffect } from "react";
import { setPageMetadata } from "@/lib/seo";
import PrelaunchHeader from "@/components/prelaunch/PrelaunchHeader";
import PrelaunchHero from "@/components/prelaunch/PrelaunchHero";
import PrelaunchCountdown from "@/components/prelaunch/PrelaunchCountdown";
import PrelaunchSystemOverview from "@/components/prelaunch/PrelaunchSystemOverview";
import PrelaunchFoundingOffer from "@/components/prelaunch/PrelaunchFoundingOffer";
import PrelaunchWaitlistForm from "@/components/prelaunch/PrelaunchWaitlistForm";
import PrelaunchFooter from "@/components/prelaunch/PrelaunchFooter";
import "@/styles/prelaunch-preview.css";

export default function PrelaunchPreview() {
  useEffect(() => {
    return setPageMetadata({
      title: "ClientSurge Systems | Founding Waitlist",
      description:
        "ClientSurge Systems turns website leads, missed calls, and inquiries into faster responses, automated follow-up, and booked appointments. Launching September 1, 2026.",
      canonicalPath: "/prelaunch-preview",
      robots: "noindex,nofollow",
    });
  }, []);

  return (
    <div className="prelaunch-page">
      <PrelaunchHeader />
      <main>
        <PrelaunchHero />
        <PrelaunchCountdown />
        <PrelaunchSystemOverview />
        <PrelaunchFoundingOffer />
        <PrelaunchWaitlistForm />
      </main>
      <PrelaunchFooter />
    </div>
  );
}