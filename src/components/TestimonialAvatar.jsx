/**
 * TestimonialAvatar — #35
 * Drop-in replacement for testimonial <img> tags.
 * Falls back to initials-based avatar if image 404s or is empty.
 */
import { useState } from "react";

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
}

const AVATAR_COLORS = ["#00AEEF", "#7C3AED", "#F97316", "#10B981", "#EF4444", "#F59E0B"];

function colorForName(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function TestimonialAvatar({ src, name, size = 56 }) {
  const [failed, setFailed] = useState(!src);
  const initials = getInitials(name);
  const bg = colorForName(name);

  if (failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `${bg}22`, border: `2px solid ${bg}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span style={{ color: bg, fontWeight: 800, fontSize: size * 0.35 }}>{initials || "?"}</span>
      </div>
    );
  }

  return (
    <img
      src={src} alt={name}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
    />
  );
}
