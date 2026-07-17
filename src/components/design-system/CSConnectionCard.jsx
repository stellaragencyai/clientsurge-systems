export default function CSConnectionCard({
  name,
  description,
  status = "pending",
  action,
}) {
  const styles = {
    connected: "border-emerald-200 bg-emerald-50",
    pending: "border-slate-200 bg-white",
    error: "border-red-200 bg-red-50",
  };

  return (
    <div className={`rounded-2xl border p-5 ${styles[status] || styles.pending}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{name}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-bold capitalize">
          {status}
        </span>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
