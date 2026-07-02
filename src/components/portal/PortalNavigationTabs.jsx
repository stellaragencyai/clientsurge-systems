import { CLIENT_PORTAL_NAV_GROUPS, CLIENT_PORTAL_TABS } from "@/lib/portalNavigationConfig";

export default function PortalNavigationTabs({ activeTab, onChange }) {
  return (
    <div className="border-b border-border bg-background px-4 md:px-6 overflow-x-auto relative" role="tablist" aria-label="Portal sections">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-background to-transparent z-10" aria-hidden="true" />
      <div className="max-w-4xl mx-auto flex gap-6 min-w-max">
        {CLIENT_PORTAL_NAV_GROUPS.map((group) => (
          <div key={group.id} className="flex items-end gap-0.5 py-0">
            <div className="hidden md:flex h-full items-center pr-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/70">
              {group.label}
            </div>
            {group.tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => onChange(tab.id)}
                className={`px-3 md:px-4 py-3.5 text-xs md:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap min-h-[44px] ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function getPortalNavigationIds() {
  return CLIENT_PORTAL_TABS.map((tab) => tab.id);
}
