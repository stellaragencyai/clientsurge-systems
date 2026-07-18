export default function CSBrandSurface({
  as: Component = "section",
  className = "",
  children,
  showTopLine = true,
  ...props
}) {
  return (
    <Component
      className={`cs-brand-shell ${className}`.trim()}
      {...props}
    >
      {showTopLine && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-[#42D7F5] to-transparent opacity-90"
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </Component>
  );
}
