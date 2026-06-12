/**
 * GlobalAnnouncementWrapper Component
 * Wraps the entire app with the announcement banner
 * Should be placed at the root level after Navbar
 */

import LaunchAnnouncementBanner from "@/components/campaign/LaunchAnnouncementBanner";

export default function GlobalAnnouncementWrapper({ children }) {
  return (
    <>
      <LaunchAnnouncementBanner />
      {children}
    </>
  );
}