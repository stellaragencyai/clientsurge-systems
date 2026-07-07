/**
 * AutomationsOverview — Phase 4.3 Premium UI + Phase 3 Client-Safe Language
 * Uses PortalAutomationCard with design system components.
 * Never exposes internal terms (active, paused, error, pending) directly.
 * Phase A.5: Automation statuses gated behind PortalStateEngine proof.
 * Phase 3 Part 5: Client-safe status translations via clientModuleLanguage.
 * Phase 3 Part 6: Package tier upgrade path for blocked modules.
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import { translateCard } from "@/lib/clientStatusLanguage";
import { MODULE_INFO, translateModuleStatus, TIER_LABELS } from "@/lib/clientModuleLanguage";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";
import PortalAutomationCard from "@/components/portal/PortalAutomationCard";
import CSCard from "@/components/design-system/CSCard";
import { ArrowUpCircle, Zap, PhoneMissed, Mail, CalendarCheck, FileText, Star } from "lucide-react";

const MODULE_ICONS = {
  instant_lead_response: Zap,
  missed_call_text_back: PhoneMissed,
  lead_nurture: Mail,
  ai_booking_agent: CalendarCheck,
  daily_digest: FileText,
  review_reactivation: Star,
};

// Maps raw automation status from getAutomationsOverview to module installation status
const RAW_STATUS_TO_INSTALL = {
  active: "verified",
  paused: "needs_setup",
  error: "failed",
  pending: "not_started",
  running: "test_mode",
  completed: "verified",
  failed: "failed",
};

export default function AutomationsOverview({ order_id, portalState }) {
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order_id) return;
    (async () => {
      try {
        const res = await base44.functions.invoke("getAutomationsOverview", { order_id });
        setAutomations(res?.automations || []);
      } catch {
        setAutomations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [order_id]);

  const readinessCard = getCardState(portalState, "automation_health");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const isAdmin = portalState?.meta?.is_admin_preview || false;
  const translated = translateCard(readinessCard);

  // Derive current package tier and activated modules from portal state
  const currentTier = portalState?.deployment?.package_tier_key || portalState?.order?.package_tier_key || "starter";
  const activatedModules = portalState?.deployment?.activated_modules || [];

  // Build the full module list — include all known modules, not just those returned by the API
  const allModuleKeys = Object.keys(MODULE_INFO);
  const automationMap = {};
  automations.forEach((a) => {
    // Try to match by name or module_key
    const matchedKey = allModuleKeys.find((k) => MODULE_INFO[k].name === a.name || k === a.module_key);
    if (matchedKey) automationMap[matchedKey] = a;
  });

  const moduleCards = allModuleKeys.map((moduleKey) => {
    const moduleInfo = MODULE_INFO[moduleKey];
    const a = automationMap[moduleKey];
    const isActivated = activatedModules.includes(moduleKey);
    const installStatus = a ? (RAW_STATUS_TO_INSTALL[a.status] || "not_started") : (isActivated ? "needs_setup" : "not_started");
    const isAuthorized = isActivated || (a && a.status !== "pending");

    const statusInfo = translateModuleStatus(moduleKey, installStatus, isAuthorized, currentTier);
    const Icon = MODULE_ICONS[moduleKey] || Zap;

    return {
      moduleKey,
      name: moduleInfo.name,
      description: statusInfo.description,
      icon: Icon,
      statusLabel: statusInfo.label,
      statusColor: statusInfo.color,
      lastRun: a?.last_run,
      showUpgrade: statusInfo.showUpgrade,
      upgradeContext: statusInfo.showUpgrade ? {
        moduleName: statusInfo.moduleName,
        requiredTier: statusInfo.requiredTier,
        currentTier: statusInfo.currentTier,
        moduleKey,
      } : null,
    };
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!isProofLive) {
    return (
      <div className="space-y-4">
        <CSCard className="!p-4" hover={false}>
          <p className="text-sm font-semibold text-[#0088CC] mb-1">{translated.friendlyStatus}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{translated.explanation}</p>
        </CSCard>
        {moduleCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {moduleCards.map((mc) => (
              <div key={mc.moduleKey}>
                <PortalAutomationCard
                  name={mc.name}
                  description={mc.description}
                  icon={mc.icon}
                  statusLabel={mc.statusLabel}
                  statusColor={mc.statusColor}
                  lastRun={mc.lastRun}
                />
                {mc.showUpgrade && <UpgradePrompt context={mc.upgradeContext} />}
              </div>
            ))}
          </div>
        )}
        {moduleCards.length === 0 && (
          <CSCard className="!p-8 text-center" hover={false}>
            <p className="text-sm text-gray-400">No automations configured for your account yet.</p>
          </CSCard>
        )}
        <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
      </div>
    );
  }

  if (!automations.length && moduleCards.length === 0) {
    return (
      <CSCard className="!p-8 text-center" hover={false}>
        <p className="text-sm text-gray-400">No automations found for your account.</p>
      </CSCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Package tier banner */}
      <CSCard className="!p-4 !bg-blue-50/40" hover={false}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Your Package</p>
            <p className="text-sm font-bold text-gray-800">{TIER_LABELS[currentTier] || currentTier}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Active Modules</p>
            <p className="text-sm font-bold text-gray-800">{moduleCards.filter((mc) => mc.statusLabel === "Active").length} of {moduleCards.length}</p>
          </div>
        </div>
      </CSCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {moduleCards.map((mc) => (
          <div key={mc.moduleKey}>
            <PortalAutomationCard
              name={mc.name}
              description={mc.description}
              icon={mc.icon}
              statusLabel={mc.statusLabel}
              statusColor={mc.statusColor}
              lastRun={mc.lastRun}
            />
            {mc.showUpgrade && <UpgradePrompt context={mc.upgradeContext} />}
          </div>
        ))}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}

function UpgradePrompt({ context }) {
  if (!context) return null;
  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
      <div className="flex items-start gap-2">
        <ArrowUpCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-amber-700">
            Upgrade to {context.requiredTier === "pro" ? "Pro System" : context.requiredTier === "growth" ? "Growth System" : "a higher plan"}
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            {context.moduleName} is included in the {context.requiredTier === "pro" ? "Pro" : context.requiredTier === "growth" ? "Growth" : "higher"} plan.
            You're currently on the {context.currentTier === "starter" ? "Starter" : context.currentTier === "growth" ? "Growth" : context.currentTier} plan.
          </p>
          <a
            href="/client-portal/billing?tab=plan"
            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-amber-700 hover:text-amber-800"
          >
            <ArrowUpCircle className="w-3 h-3" /> Upgrade Now
          </a>
        </div>
      </div>
    </div>
  );
}