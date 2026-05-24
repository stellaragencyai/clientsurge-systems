import { useEffect } from "react";
import { getTawkToConfig } from "@/lib/publicEnv";

const SCRIPT_ID = "clientsurge-tawk-live-chat";

export default function TawkLiveChat() {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const { propertyId, widgetId, enabled } = getTawkToConfig();
    if (!enabled) return undefined;
    if (document.getElementById(SCRIPT_ID)) return undefined;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = window.Tawk_LoadStart || new Date();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
