export const PUBLIC_PATHS = [
  "/",
  "/store",
  "/order-success",
  "/med-spa",
  "/dental",
  "/hvac",
  "/roofing",
  "/contractors",
  "/chiropractic",
  "/start",
  "/book",
  "/book-demo",
  "/industries",
  "/pricing",
  "/faq",
  "/our-system",
  "/testimonials",
  "/privacy-policy",
  "/terms",
  "/login",
  "/success",
  "/legal",
  "/contact",
  "/leads/capture",
  "/onboarding",
];

export const NOINDEX_PREFIXES = [
  "/admin",
  "/dashboard",
  "/client-portal",
  "/lead-intelligence",
  "/medspa-dashboard",
  "/sam",
  "/success",
];

export const ADMIN_REDIRECT_PATHS = [
  "/dashboard",
  "/admin-settings",
  "/lead-intelligence",
  "/sam",
  "/medspa-dashboard",
];

export function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
