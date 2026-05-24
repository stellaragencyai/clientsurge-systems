export function getPublicBookingLink() {
  // Vite injects import.meta.env at build time.
  // @ts-ignore
  return import.meta.env.VITE_DEFAULT_BOOKING_LINK?.trim() || "";
}

export function getTawkToConfig() {
  // Tawk.to is intentionally env-gated so production only loads the
  // third-party widget after the property/widget IDs are approved.
  // @ts-ignore
  const propertyId = import.meta.env.VITE_TAWK_TO_PROPERTY_ID?.trim() || "";
  // @ts-ignore
  const widgetId = import.meta.env.VITE_TAWK_TO_WIDGET_ID?.trim() || "";
  return { propertyId, widgetId, enabled: Boolean(propertyId && widgetId) };
}
