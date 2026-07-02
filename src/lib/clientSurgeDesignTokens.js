export const clientSurgeColors = {
  black: "#000000",
  white: "#FFFFFF",
  page: "#F7FBFE",
  electric: "#00AEEF",
  deepBlue: "#0088CC",
  navy: "#005691",
  softBlue: "#EEF9FF",
  borderBlue: "#C9E7FB",
  body: "#262626",
  muted: "#4B5563",
  footerBlue: "#DFF6FF",
};

export const clientSurgeStatusColors = {
  trusted: "#16A34A",
  warning: "#D97706",
  blocked: "#DC2626",
  unknown: "#6B7280",
  stale: "#F59E0B",
  pending: "#2563EB",
};

export const clientSurgeGradients = {
  primary: `linear-gradient(135deg, ${clientSurgeColors.deepBlue}, ${clientSurgeColors.navy})`,
  electric: `linear-gradient(135deg, ${clientSurgeColors.deepBlue}, ${clientSurgeColors.electric})`,
  hero: `linear-gradient(135deg, ${clientSurgeColors.navy} 0%, ${clientSurgeColors.deepBlue} 60%, ${clientSurgeColors.electric} 100%)`,
};

export const clientSurgeRadii = {
  control: "8px",
  card: "16px",
  shell: "20px",
  pill: "999px",
};

export const clientSurgeShadows = {
  premiumCard: "0 20px 58px rgba(0,136,204,0.16)",
  cta: "0 8px 24px rgba(0,121,193,0.36)",
  darkPanel: "0 12px 32px rgba(0,0,0,0.16)",
};

export const clientSurgeTypography = {
  heading: "Montserrat, Arial, sans-serif",
  body: "Inter, Arial, Helvetica, sans-serif",
  labelClass: "text-[11px] font-black uppercase tracking-[0.14em]",
};

export const clientSurgeCardClass = "rounded-2xl border bg-white shadow-sm";
export const clientSurgeMutedPanelClass = "rounded-2xl border bg-[#F7FBFE]";
