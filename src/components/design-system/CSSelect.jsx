export default function CSSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  error = false,
  disabled = false,
}) {
  return (
    <select
      value={value || ""}
      onChange={(event) => onChange?.(event.target.value)}
      disabled={disabled}
      className={`w-full h-12 rounded-2xl border bg-white px-4 text-sm text-slate-900 transition-all focus:outline-none focus:ring-4 disabled:opacity-50 ${
        error
          ? "border-red-400 focus:border-red-400 focus:ring-red-100"
          : "border-slate-200 focus:border-[#00AEEF] focus:ring-cyan-100"
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const item = typeof option === "string" ? { label: option, value: option } : option;
        return (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        );
      })}
    </select>
  );
}
