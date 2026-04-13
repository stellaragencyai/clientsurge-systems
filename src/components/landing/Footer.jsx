export default function Footer() {
  const links = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Services", href: "#services" },
    { label: "Industries", href: "#industries" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <a href="#" className="font-display text-xl font-semibold tracking-tight text-foreground">
              Apex<span className="text-primary">Flow</span>
            </a>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              AI automation systems that help service businesses book more customers.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="text-center md:text-right">
            <a
              href="mailto:hello@apexflow.io"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              hello@apexflow.io
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ApexFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}