import { Linkedin, Facebook, Instagram, Youtube, Twitter } from "lucide-react";

const SOCIAL_LINKS = [
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/clientsurge" },
  { name: "Facebook", icon: Facebook, href: "https://facebook.com/clientsurge" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com/clientsurge" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com/@clientsurge" },
  { name: "X", icon: Twitter, href: "https://twitter.com/clientsurge" },
];

/**
 * SocialIcons — Reusable social media icon row with hover glow animation.
 *
 * Props:
 *   size      — 'sm' | 'md' (default 'md')
 *   variant   — 'light' | 'dark' (controls base color for dark/light backgrounds)
 *   className — string
 */
export default function SocialIcons({ size = "md", variant = "light", className = "" }) {
  const iconSize = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";
  const containerSize = size === "sm" ? "w-9 h-9" : "w-10 h-10";

  const baseColor =
    variant === "dark"
      ? "text-white/60 hover:text-white border-white/15 hover:border-[#00AEEF]"
      : "text-muted-foreground hover:text-[#00AEEF] border-border hover:border-[#00AEEF]";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {SOCIAL_LINKS.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            className={`${containerSize} flex items-center justify-center rounded-full border transition-all duration-300 hover:bg-[#00AEEF]/10 hover:shadow-[0_0_16px_rgba(0,174,239,0.35)] ${baseColor}`}
          >
            <Icon className={iconSize} />
          </a>
        );
      })}
    </div>
  );
}