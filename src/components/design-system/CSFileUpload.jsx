import { UploadCloud } from "lucide-react";

export default function CSFileUpload({
  label,
  accept,
  onChange,
  disabled = false,
  preview,
}) {
  return (
    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center transition hover:border-cyan-400">
      <input
        type="file"
        accept={accept}
        onChange={onChange}
        disabled={disabled}
        className="hidden"
      />
      {preview ? (
        <img src={preview} alt="Preview" className="mx-auto mb-4 h-20 w-20 rounded-xl object-contain" />
      ) : (
        <UploadCloud className="mx-auto mb-3 h-8 w-8 text-[#00AEEF]" />
      )}
      <p className="text-sm font-bold text-slate-900">{label || "Upload file"}</p>
      <p className="mt-1 text-xs text-slate-500">Drag and drop or click to browse</p>
    </label>
  );
}
