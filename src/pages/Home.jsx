import { useEffect, useMemo } from "react";
import LaunchWaitlistPage from "@/components/landing/LaunchWaitlistPage";
import {
  getOrganizationSchema,
  getWebsiteSchema,
} from "../components/SEO/SchemaMarkup";
import { setJsonLd, setPageMetadata } from "@/lib/seo";
import "../styles/launch-waitlist.css";

function isEditorSandbox() {
  try {
    const hostname = window.location.hostname;
    return hostname.includes("preview-sandbox") || hostname.includes("base44");
  } catch {
    return true;
  }
}

export default function Home() {
  const schemas = useMemo(() => ({
    organization: getOrganizationSchema(),
    website: getWebsiteSchema(),
  }), []);

  useEffect(() => {
    if (isEditorSandbox()) return () => {};
    if (typeof document === "undefined" || !document.head) return () => {};

    const cleanups = [];

    try {
      cleanups.push(setPageMetadata({
        title: "ClientSurge Systems Launches September 1, 2026 | Founding Waitlist",
        description: "Join the ClientSurge Systems founding waitlist before September 1, 2026 for the first 1,000 signup offer: 50% off for life and no setup fee.",
        canonicalPath: "/",
        ogTitle: "ClientSurge Systems Launches September 1, 2026",
        ogDescription: "Get on the ClientSurge Systems founding waitlist for the September 1, 2026 launch offer.",
      }));
    } catch (_error) {}

    try { cleanups.push(setJsonLd("organization", schemas.organization)); } catch (_error) {}
    try { cleanups.push(setJsonLd("website", schemas.website)); } catch (_error) {}

    return () => {
      cleanups.forEach((cleanup) => {
        try { cleanup(); } catch (_error) {}
      });
    };
  }, [schemas]);

  return <LaunchWaitlistPage />;
}
