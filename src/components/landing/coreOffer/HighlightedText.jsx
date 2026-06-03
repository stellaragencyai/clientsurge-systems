// Critical phrases to highlight in step descriptions
const HIGHLIGHT_TERMS = [
  "interested leads",
  "booking path",
  "cleaner visibility",
  "conversation moving",
  "follows up",
  "reactivation",
  "stays warm",
  "ready leads",
  "organized",
  "tuning",
  "improvement",
];

export function highlightKeyTerms(text) {
  if (!text) return text;

  let result = text;
  const pattern = new RegExp(`(${HIGHLIGHT_TERMS.join("|")})`, "gi");

  const parts = text.split(pattern);
  return parts.map((part, idx) => {
    const isMatch = HIGHLIGHT_TERMS.some((term) => term.toLowerCase() === part.toLowerCase());
    if (!isMatch) return part;

    return `<span style="background: linear-gradient(135deg, rgba(0,174,239,0.14) 0%, rgba(0,136,204,0.08) 100%); padding: 2px 4px; border-radius: 3px; text-decoration: underline; text-decoration-color: rgba(0,174,239,0.35); text-underline-offset: 3px; text-decoration-thickness: 2px;">${part}</span>`;
  }).join("");
}

export default function HighlightedText({ children }) {
  return (
    <span
      dangerouslySetInnerHTML={{
        __html: typeof children === "string" ? highlightKeyTerms(children) : children,
      }}
    />
  );
}
