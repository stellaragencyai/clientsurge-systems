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
        "Join the ClientSurge Systems founding waitlist. Launching September 1, 2027.",
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