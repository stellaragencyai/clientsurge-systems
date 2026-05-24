import { ArrowRight } from "lucide-react";

export default function TextLink({
  children,
  href,
  onClick,
  icon: Icon = null,
  external = false,
  className = "",
  ...props
}) {
  const isLink = href && !onClick;

  const Component = isLink ? "a" : "button";

  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "rgba(0,136,204,0.7)",
    textDecoration: "none",
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: "4px 0",
    transition: "color 0.2s ease",
  };

  const elementProps = isLink
    ? { href, ...(external ? { target: "_blank", rel: "noreferrer" } : {}) }
    : { onClick, type: "button" };

  return (
    <Component
      style={baseStyles}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "rgba(0,136,204,0.95)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "rgba(0,136,204,0.7)";
      }}
      {...elementProps}
      {...props}
    >
      {Icon && <Icon style={{ width: "12px", height: "12px" }} />}
      {children}
    </Component>
  );
}