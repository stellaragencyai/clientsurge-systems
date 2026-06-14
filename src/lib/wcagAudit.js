// Task #50: WCAG Compliance audit utilities
export const WCAG_CONTRAST_RATIOS = {
  NORMAL_TEXT: { min: 4.5 }, // AA standard
  LARGE_TEXT: { min: 3 },
  GRAPHICS: { min: 3 },
  UI_COMPONENTS: { min: 3 },
};

// Calculate contrast ratio per WCAG formula
export function getContrastRatio(rgb1, rgb2) {
  const luminance1 = getRelativeLuminance(rgb1);
  const luminance2 = getRelativeLuminance(rgb2);
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(rgb) {
  const [r, g, b] = rgb.split(",").map((v) => {
    const num = parseInt(v, 10) / 255;
    return num <= 0.03928 ? num / 12.92 : Math.pow((num + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Verify button touch targets (min 44×44px)
export const TOUCH_TARGET_SIZE = 44; // pixels

// Colors that pass WCAG AA
export const ACCESSIBLE_COLORS = {
  primary: { hex: "#00AEEF", rgb: "0,174,239" },
  foreground: { hex: "#001B44", rgb: "0,27,68" },
  error: { hex: "#DC2626", rgb: "220,38,38" },
  success: { hex: "#16A34A", rgb: "22,163,74" },
  warning: { hex: "#EA8D0D", rgb: "234,141,13" },
};