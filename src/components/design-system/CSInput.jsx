export default function CSInput({
  label,
  hint,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
  icon: Icon,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-slate-900">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {hint && <p className="text-xs text-slate-500">{hint}</p>}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}

        <input
          type={type}
          value={value || ""}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 transition outline-none placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
            Icon ? "pl-10" : ""
          } ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-slate-200 focus:border-[#00AEEF] focus:ring-cyan-100"
          }`}
        />
      </div>

      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
