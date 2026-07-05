/**
 * Admin Data Export Button
 * Fixes Audit Issue #52: No data export from admin dashboard
 *
 * Usage:
 * <AdminDataExportButton
 *   functionName="exportLeadsCSV"
 *   label="Export Leads (CSV)"
 *   filename="leads-export.csv"
 * />
 */

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AdminDataExportButton({
  functionName,
  label = "Export",
  filename = "export.csv",
  className = "",
  params = {},
}) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const response = await base44.functions.invoke(functionName, params);
      const data = response?.data;

      if (!data) {
        throw new Error("No data returned from export function");
      }

      // Handle CSV string or JSON data
      let blob;
      if (typeof data === "string") {
        blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
      } else if (data instanceof Blob) {
        blob = data;
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8;" });
        filename = filename.replace(".csv", ".json");
      }

      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      setError(err?.message || "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        disabled={exporting}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground font-medium text-xs hover:bg-muted transition-colors disabled:opacity-50 ${className}`}
      >
        {exporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {exporting ? "Exporting..." : label}
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}