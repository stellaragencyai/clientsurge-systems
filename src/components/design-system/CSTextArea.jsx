export default function CSTextArea({
  value,
  onChange,
  placeholder = "",
  rows = 4,
  error = false,
  disabled = false,
  helperText,
  className = "",
}) {
  return (
    <div className="space-y-2">
      <textarea
        value={value || ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
            : "border-slate-200 focus:border-[#00AEEF] focus:ring-cyan-100"
        } ${className}`}
      />
      {helperText && (
        <p className={`text-xs ${error ? "text-red-600" : "text-slate-500"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
}
