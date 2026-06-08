/**
 * Task 19: Visual Refinement Checklist
 * Shows the remaining site polish tasks as an interactive checklist in admin.
 */
import { useState } from "react";
import { CheckCircle2, Circle, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";

const REFINEMENT_ITEMS = [
  // Critical
  { id: "c1", category: "Critical", label: "Switch Stripe to Live Mode — verify sk_live_ key is active", done: true, priority: "critical" },
  { id: "c2", category: "Critical", label: "Test full purchase flow end-to-end with real card on live domain", done: false, priority: "critical" },
  { id: "c3", category: "Critical", label: "Configure Twilio Webhook for inbound SMS replies in Twilio console", done: false, priority: "critical" },
  { id: "c4", category: "Critical", label: "Configure Twilio Webhook for inbound calls in Twilio console", done: false, priority: "critical" },
  { id: "c5", category: "Critical", label: "Validate Resend email delivery and bounce webhook in prod", done: false, priority: "critical" },
  // High
  { id: "h1", category: "High", label: "Merge duplicate 'Audit Log' sidebar nav items in AdminDashboard", done: false, priority: "high" },
  { id: "h2", category: "High", label: "Move <SessionTimeoutModal> to root AdminShell (not Overview-only)", done: false, priority: "high" },
  { id: "h3", category: "High", label: "Fix Store SocialProofTicker position — renders below footer", done: false, priority: "high" },
  { id: "h4", category: "High", label: "Fix Store sticky cart div — replace with semantic <button> for keyboard accessibility", done: false, priority: "high" },
  { id: "h5", category: "High", label: "Fix Navbar Pricing link to scroll to #pricing from non-home pages", done: false, priority: "high" },
  { id: "h6", category: "High", label: "Fix FinalCTA duplicate CTAs — differentiate copy between both buttons", done: false, priority: "high" },
  { id: "h7", category: "High", label: "Remove ProofBeforeLaunch internal dev copy visible to public", done: false, priority: "high" },
  { id: "h8", category: "High", label: "Remove 'Tanning Salons' broken link from Footer", done: false, priority: "high" },
  // Medium
  { id: "m1", category: "Medium", label: "Fix FAQ leading space in h2 ('Frequently Asked Questions')", done: true, priority: "medium" },
  { id: "m2", category: "Medium", label: "Fix FAQ AccordionItem double focus ring — consolidated", done: true, priority: "medium" },
  { id: "m3", category: "Medium", label: "Add lazy loading to Automations page poster images", done: false, priority: "medium" },
  { id: "m4", category: "Medium", label: "Fix ClientPortal tab bar bg-white → bg-background", done: false, priority: "medium" },
  { id: "m5", category: "Medium", label: "ClientDashboard outer wrapper bg-white → bg-background", done: false, priority: "medium" },
  { id: "m6", category: "Medium", label: "Remove Pricing badge icon fields rendering as plain text strings", done: false, priority: "medium" },
  { id: "m7", category: "Medium", label: "Audit and clean up all orphaned landing components", done: false, priority: "medium" },
  { id: "m8", category: "Medium", label: "Fix Contact page double privacy disclaimer paragraphs", done: false, priority: "medium" },
  { id: "m9", category: "Medium", label: "Add loading=lazy to all below-fold images (Automations posters)", done: false, priority: "medium" },
  { id: "m10", category: "Medium", label: "Fix Store product count '12 AI Services' — set to actual active count", done: false, priority: "medium" },
  // Low
  { id: "l1", category: "Low", label: "SixAutomationSystems eyebrow 'THE CORE OFFER' uppercase", done: true, priority: "low" },
  { id: "l2", category: "Low", label: "SixAutomationSystems bg-background (not hardcoded #ffffff)", done: true, priority: "low" },
  { id: "l3", category: "Low", label: "AdminDashboard stat cards use design tokens not bg-blue-50", done: true, priority: "low" },
  { id: "l4", category: "Low", label: "Pricing card 3D rotation → safe translate-y/scale hover", done: true, priority: "low" },
  { id: "l5", category: "Low", label: "TrustBar border-primary/8 → /10 opacity fix", done: true, priority: "low" },
  { id: "l6", category: "Low", label: "About page hero gradient uses theme tokens not warm brown", done: true, priority: "low" },
  { id: "l7", category: "Low", label: "FAQ word-wrap invalid class → break-words", done: true, priority: "low" },
];

const PRIORITY_COLORS = {
  critical: "text-red-600",
  high: "text-amber-600",
  medium: "text-primary",
  low: "text-muted-foreground",
};

const PRIORITY_BG = {
  critical: "bg-red-50 border-red-100",
  high: "bg-amber-50 border-amber-100",
  medium: "bg-primary/5 border-primary/15",
  low: "bg-muted/40 border-border",
};

export default function SiteRefinementChecklist() {
  const [items, setItems] = useState(REFINEMENT_ITEMS);
  const [showDone, setShowDone] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({ Critical: true, High: true, Medium: false, Low: false });

  const toggleItem = (id) => {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  };

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const visible = showDone ? items : items.filter((i) => !i.done);
  const categories = ["Critical", "High", "Medium", "Low"];
  const totalDone = items.filter((i) => i.done).length;
  const totalPercent = Math.round((totalDone / items.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Site Refinement Checklist</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track remaining polish tasks to reach a fully optimized launch state.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDone(!showDone)}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors border border-primary/20 rounded-lg px-3 py-1.5"
          >
            {showDone ? "Hide completed" : "Show all"}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">Overall Progress</span>
          <span className="text-sm font-bold text-primary">{totalDone}/{items.length} ({totalPercent}%)</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${totalPercent}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            const catDone = catItems.filter((i) => i.done).length;
            return (
              <div key={cat} className="text-xs">
                <p className={`font-bold ${PRIORITY_COLORS[cat.toLowerCase()]}`}>{catDone}/{catItems.length}</p>
                <p className="text-muted-foreground">{cat}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Items by category */}
      {categories.map((cat) => {
        const catItems = visible.filter((i) => i.category === cat);
        if (catItems.length === 0) return null;
        const isExpanded = expandedCategories[cat];
        return (
          <div key={cat} className={`rounded-xl border p-4 ${PRIORITY_BG[cat.toLowerCase()]}`}>
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center justify-between gap-3 mb-0"
            >
              <div className="flex items-center gap-2">
                {cat === "Critical" ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Info className="w-4 h-4 text-primary" />}
                <span className={`text-sm font-bold uppercase tracking-wide ${PRIORITY_COLORS[cat.toLowerCase()]}`}>
                  {cat}
                </span>
                <span className="text-xs text-muted-foreground">({catItems.length} remaining)</span>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-2">
                {catItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 cursor-pointer group"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="mt-0.5 flex-shrink-0"
                      aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                    >
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </button>
                    <span className={`text-sm leading-relaxed ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}