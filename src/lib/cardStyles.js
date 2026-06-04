// Unified card styling system - single source of truth for all card containers
// Used across landing pages, components, and UI elements
// Update here and it propagates everywhere

export const CARD = {
  // Primary surfaces
  SURFACE: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(241,248,255,0.96) 100%)",
    border: "1.5px solid rgba(0, 174, 239, 0.18)",
    boxShadow: "0 16px 34px rgba(0,59,143,0.08), 0 2px 12px rgba(0,174,239,0.05)",
  },
  SURFACE_STRONG: {
    background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(232,246,255,0.98) 100%)",
    border: "1.5px solid rgba(0, 174, 239, 0.32)",
    boxShadow: "0 22px 48px rgba(0,59,143,0.14), 0 8px 22px rgba(0,174,239,0.1)",
  },

  // Header sections
  HEADER_BROWN: {
    background: "linear-gradient(135deg, #003B8F 0%, #0088CC 48%, #00AEEF 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.16)",
  },
  HEADER_GLASS: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.84), inset 0 -1px 0 rgba(255,255,255,0.22)",
  },

  // Stat/metric cards
  STAT_CARD: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,250,255,0.96) 100%)",
    border: "1.5px solid rgba(0,174,239,0.18)",
    boxShadow: "0 8px 28px rgba(0,59,143,0.07), 0 2px 8px rgba(0,174,239,0.04)",
  },

  // Badge/chip styles
  CHIP_BROWN: {
    background: "rgba(0,174,239,0.08)",
    border: "1px solid rgba(0,174,239,0.18)",
    color: "#006AA3",
  },
  CHIP_OUTLINE: {
    background: "rgba(255,255,255,0.86)",
    border: "1.5px solid rgba(0,174,239,0.2)",
    boxShadow: "0 10px 24px rgba(0,59,143,0.06)",
  },

  // Rounded corner
  BORDER_RADIUS: "8px",
  BORDER_RADIUS_SM: "8px",
  BORDER_RADIUS_LG: "12px",

  // Dark mode variants
  DARK: {
    SURFACE: {
      background: "linear-gradient(180deg, rgba(7,20,38,0.99) 0%, rgba(5,13,27,0.97) 100%)",
      border: "1.5px solid rgba(0,174,239,0.22)",
      boxShadow: "0 16px 34px rgba(0,0,0,0.4), 0 2px 12px rgba(0,0,0,0.2)",
    },
    STAT_CARD: {
      background: "linear-gradient(180deg, rgba(8,24,45,0.98) 0%, rgba(6,18,34,0.96) 100%)",
      border: "1.5px solid rgba(0,174,239,0.18)",
      boxShadow: "0 8px 28px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)",
    },
  },
};

// Export as nested object for convenience
export const CARD_SURFACE = CARD.SURFACE;
export const CARD_SURFACE_STRONG = CARD.SURFACE_STRONG;
export const CARD_STAT = CARD.STAT_CARD;
