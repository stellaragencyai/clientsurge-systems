export default function CSSectionCard({ title, description, icon: Icon, actions, children }) {
  return (
    <section className="rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}
