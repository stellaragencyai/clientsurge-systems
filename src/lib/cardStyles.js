// Unified card styling system - single source of truth for all card containers
// Used across landing pages, components, and UI elements
// Update here and it propagates everywhere

export const CARD = {
  // Primary surfaces
  SURFACE: {
    background: "linear-gradient(180deg, rgba(252,247,241,0.99) 0%, rgba(246,238,228,0.97) 100%)",
    border: "1.5px solid rgba(212, 184, 142, 0.42)",
    boxShadow: "0 16px 34px rgba(111,67,31,0.08), 0 2px 12px rgba(111,67,31,0.05)",
  },
  SURFACE_STRONG: {
    background: "linear-gradient(180deg, rgba(255,250,245,1) 0%, rgba(248,240,230,0.99) 100%)",
    border: "1.5px solid rgba(222, 194, 152, 0.72)",
    boxShadow: "0 22px 48px rgba(122,72,37,0.16), 0 8px 22px rgba(154,92,46,0.1)",
  },

  // Header sections
  HEADER_BROWN: {
    background: "linear-gradient(135deg, #7a4825 0%, #b1723b 42%, #8a542b 100%)",
    borderBottom: "1px solid rgba(0,0,0,0.15)",
  },
  HEADER_GLASS: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 100%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.84), inset 0 -1px 0 rgba(255,255,255,0.22)",
  },

  // Stat/metric cards
  STAT_CARD: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,248,244,0.96) 100%)",
    border: "1.5px solid rgba(212,184,142,0.38)",
    boxShadow: "0 8px 28px rgba(111,67,31,0.07), 0 2px 8px rgba(111,67,31,0.04)",
  },

  // Badge/chip styles
  CHIP_BROWN: {
    background: "rgba(154,92,46,0.08)",
    border: "1px solid rgba(154,92,46,0.18)",
    color: "#7a4825",
  },
  CHIP_OUTLINE: {
    background: "rgba(255,255,255,0.82)",
    border: "1.5px solid rgba(154,92,46,0.22)",
    boxShadow: "0 10px 24px rgba(44,31,16,0.06)",
  },

  // Rounded corner
  BORDER_RADIUS: "20px",
  BORDER_RADIUS_SM: "18px",
  BORDER_RADIUS_LG: "24px",

  // Dark mode variants
  DARK: {
    SURFACE: {
      background: "linear-gradient(180deg, rgba(28,20,10,0.99) 0%, rgba(20,14,8,0.97) 100%)",
      border: "1.5px solid rgba(200,150,92,0.22)",
      boxShadow: "0 16px 34px rgba(0,0,0,0.4), 0 2px 12px rgba(0,0,0,0.2)",
    },
    STAT_CARD: {
      background: "linear-gradient(180deg, rgba(30,22,12,0.98) 0%, rgba(25,18,10,0.96) 100%)",
      border: "1.5px solid rgba(200,150,92,0.18)",
      boxShadow: "0 8px 28px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)",
    },
  },
};

// Export as nested object for convenience
export const CARD_SURFACE = CARD.SURFACE;
export const CARD_SURFACE_STRONG = CARD.SURFACE_STRONG;
export const CARD_STAT = CARD.STAT_CARD;