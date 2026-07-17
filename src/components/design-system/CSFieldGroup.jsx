export default function CSFieldGroup({ title, description, children }) {
  return (
    <section className="space-y-4">
      {(title || description) && (
        <div>
          {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
