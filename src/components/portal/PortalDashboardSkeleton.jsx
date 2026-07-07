/**
 * PortalDashboardSkeleton — Enhancement #10
 * Layout-specific skeleton that matches the actual dashboard layout:
 * header bar, next-action card, KPI row, welcome banner, and main grid.
 */
export default function PortalDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] animate-pulse">
      {/* Sidebar skeleton (hidden on mobile) */}
      <div className="flex">
        <div className="hidden lg:block w-[260px] h-screen bg-white border-r border-gray-100 flex-shrink-0">
          <div className="h-16 border-b border-gray-100 flex items-center px-5 gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gray-100" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-gray-100" />
              <div className="h-2 w-14 rounded bg-gray-50" />
            </div>
          </div>
          <div className="px-4 py-3 space-y-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-gray-50" style={{ opacity: 1 - i * 0.08 }} />
            ))}
            <div className="h-9 rounded-lg bg-gray-50 mt-3" />
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Top bar skeleton */}
          <div className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="space-y-1.5">
                <div className="h-2 w-24 rounded bg-gray-100" />
                <div className="h-2.5 w-32 rounded bg-gray-50" />
              </div>
              <div className="h-4 w-32 rounded bg-gray-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100" />
              <div className="w-9 h-9 rounded-full bg-gray-100" />
            </div>
          </div>

          {/* Content area skeleton */}
          <div className="px-6 py-6 space-y-6">
            {/* Next best action card */}
            <div className="rounded-2xl bg-white border border-gray-100 p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2 w-28 rounded bg-gray-100" />
                <div className="h-4 w-48 rounded bg-gray-100" />
                <div className="h-3 w-full rounded bg-gray-50" />
                <div className="h-3 w-3/4 rounded bg-gray-50" />
                <div className="h-8 w-28 rounded-lg bg-gray-100 mt-2" />
              </div>
            </div>

            {/* Welcome banner skeleton */}
            <div className="rounded-2xl p-6 flex items-center justify-between" style={{ background: "rgba(0,174,239,0.04)", border: "1px solid rgba(0,174,239,0.08)" }}>
              <div className="flex items-center gap-4">
                <div className="h-6 w-20 rounded-full bg-gray-100" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 rounded bg-gray-100" />
                  <div className="h-2.5 w-28 rounded bg-gray-50" />
                </div>
              </div>
              <div className="h-9 w-32 rounded-lg bg-gray-100" />
            </div>

            {/* KPI row skeleton (3 cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100" />
                    <div className="h-2 w-16 rounded bg-gray-50" />
                  </div>
                  <div className="h-6 w-20 rounded bg-gray-100 mb-1" />
                  <div className="h-2 w-24 rounded bg-gray-50" />
                </div>
              ))}
            </div>

            {/* Main grid skeleton (70/30) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl bg-white border border-gray-100 p-5 space-y-4">
                  <div className="h-5 w-32 rounded bg-gray-100" />
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded bg-gray-100" style={{ width: `${80 - i * 10}%` }} />
                        <div className="h-2 w-2/3 rounded bg-gray-50" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-white border border-gray-100 p-5 h-48" />
              </div>

              {/* Right column (1/3) */}
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 mb-3" />
                    <div className="h-3 w-32 rounded bg-gray-100 mb-2" />
                    <div className="h-2 w-full rounded bg-gray-50 mb-1" />
                    <div className="h-2 w-3/4 rounded bg-gray-50 mb-3" />
                    <div className="h-7 w-24 rounded-lg bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}