/**
 * Global UI Constants — #93
 * Centralized text, styles, and settings for UI consistency.
 * For CoreOffer section config (headline, subheadline, system steps), use lib/systemConfig.js.
 * For pricing/product catalog, use lib/salesCatalog.js.
 */

export const BUTTON_TEXT = {
  BOOK_DEMO: "Get Your Free Audit",
  BOOK_DEMO_SHORT: "Book Free Audit",
  GET_STARTED: "Get Started",
  VIEW_PRICING: "View Pricing",
  SCHEDULE_DEMO: "Get Your Free Audit",
  WATCH_DEMO: "See How It Works",
  SEE_IN_ACTION: "See this in action",
};

export const BUTTON_STYLES = {
  PRIMARY_GRADIENT: {
    background: "linear-gradient(135deg, #003B8F 0%, #0088CC 54%, #00AEEF 100%)",
    borderRadius: "8px",
    boxShadow: "0 12px 28px rgba(0,88,160,0.22)",
  },
  PRIMARY_GRADIENT_HOVER: {
    boxShadow: "0 16px 40px rgba(0,174,239,0.28), 0 6px 18px rgba(0,59,143,0.18)",
  },
};

export const CARD_STYLES = {
  SHADOW_SM: "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
  SHADOW_MD: "0 6px 22px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
  SHADOW_LG: "0 12px 40px rgba(0,88,160,0.16), inset 0 1px 0 rgba(255,255,255,0.8)",
  SHADOW_XL: "0 24px 64px rgba(0,59,143,0.24), inset 0 1px 0 rgba(255,255,255,0.9)",
  BLUR_SM: "blur(14px)",
  BLUR_MD: "blur(18px)",
  BLUR_LG: "blur(20px)",
};

export const GRADIENT_TEXT = {
  BROWN_GOLD: "linear-gradient(135deg, #003B8F 0%, #0088CC 52%, #00AEEF 100%)",
  BROWN_GOLD_DARK: "linear-gradient(135deg, #B9ECFF 0%, #66D9FF 52%, #00AEEF 100%)",
};
