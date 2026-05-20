/**
 * HoneypotField.jsx — #357
 * Hidden honeypot field to block bots on LeadCaptureForm and ContactInquiry.
 * If website_url is filled, submission is rejected as bot.
 *
 * Usage:
 *   import HoneypotField, { isBot } from "@/components/HoneypotField";
 *   <HoneypotField />
 *   if (isBot(formData)) return; // reject silently
 */

export function isBot(formData) {
  return !!formData.website_url;
}

export default function HoneypotField() {
  return (
    <input
      type="text"
      name="website_url"
      autoComplete="off"
      tabIndex="-1"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        width: "1px",
        height: "1px",
        opacity: 0,
        pointerEvents: "none",
      }}
    />
  );
}
