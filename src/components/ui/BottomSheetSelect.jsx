import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * BottomSheetSelect — iOS-style single-select picker that slides up from the bottom.
 * Drop-in replacement for <select> on touch devices while preserving web usability.
 *
 * Props:
 *   value: string (current selected value)
 *   onChange: (value: string) => void
 *   options: Array<{ value: string, label: string }>
 *   placeholder?: string
 *   label?: string
 *   className?: string (applied to the trigger button)
 *   disabled?: boolean
 */
export default function BottomSheetSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  label,
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = useCallback(
    (val) => {
      onChange(val);
      setOpen(false);
    },
    [onChange]
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
          {displayLabel}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
      </button>

      {open && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-end justify-center">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <div
              className="relative w-full max-w-lg bg-background rounded-t-3xl shadow-2xl"
              style={{
                animation: "bottomSheetSlideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
                paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                maxHeight: "70vh",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Grabber */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Header */}
              {label && (
                <div className="flex items-center justify-between px-5 pb-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Options */}
              <div className="overflow-y-auto flex-1" style={{ WebkitOverflowScrolling: "touch" }}>
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`flex items-center justify-between w-full px-5 py-3.5 text-left text-sm font-medium transition-colors ${
                        isSelected
                          ? "text-primary bg-primary/5"
                          : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}