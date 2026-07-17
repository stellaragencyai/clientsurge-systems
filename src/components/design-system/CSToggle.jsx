export default function CSToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 disabled:opacity-50"
    >
      <div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      <span
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-[#00AEEF]" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}
