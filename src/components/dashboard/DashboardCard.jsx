import React from "react";
import { Info } from "lucide-react";

/**
 * DashboardCard — matches the reference design:
 * White background, rounded corners (12px), subtle shadow, thin border.
 * Optional header with title, subtitle, and action button(s).
 */
export default function DashboardCard({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  noPadding = false,
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/80 shadow-sm ${className}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)" }}
    >
      {(title || actions) && (
        <div
          className={`flex items-center justify-between gap-4 px-6 pt-5 pb-3 ${headerClassName}`}
        >
          <div className="min-w-0">
            {title && (
              <h3 className="text-base font-bold text-gray-900 leading-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? bodyClassName : `px-6 pb-6 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
}