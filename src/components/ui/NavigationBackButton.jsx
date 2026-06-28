import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * NavigationBackButton — visible Back button for child/detail routes.
 * Uses browser history when available, falls back to a parent path.
 *
 * Props:
 *   fallbackPath: string  (where to go if there's no history, default "/admin")
 *   label?: string        (custom label, defaults to "Back")
 *   className?: string
 */
export default function NavigationBackButton({
  fallbackPath = "/admin",
  label = "Back",
  className = "",
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // If there's meaningful history, go back
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50 ${className}`}
      aria-label={`Go back to ${fallbackPath}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}