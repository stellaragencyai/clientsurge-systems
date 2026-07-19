import { BarChart3, Bell, Home, Settings, Sparkles } from "lucide-react";
import {
  CSAppShell,
  CSAuthLoadingState,
  CSSessionExpiredState,
  CSUnauthorizedState,
} from "@/components/design-system";
import CSDesignSystemGallery from "@/components/design-system/CSDesignSystemGallery";

const NAVIGATION = [
  { id: "command-center", label: "Command Center", icon: Home, badge: "2" },
  { id: "activation", label: "Activation", icon: Sparkles },
  { id: "opportunities", label: "Opportunities", icon: Bell, badge: "!" },
  { id: "reporting", label: "Reporting", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function PhaseAFoundationReview() {
  return (
    <CSAppShell
      brand={<strong>ClientSurge OS</strong>}
      navigation={NAVIGATION}
      activeItem="command-center"
      topbar={<span>Phase A foundation review harness</span>}
      footer={<small>Development-only review surface. Not mounted in production navigation.</small>}
    >
      <div className="cs-design-gallery__stack">
        <CSDesignSystemGallery />

        <section className="cs-design-gallery__stack" aria-label="Authentication state fixtures">
          <CSAuthLoadingState />
          <CSUnauthorizedState actionLabel="Back to home" />
          <CSSessionExpiredState />
        </section>
      </div>
    </CSAppShell>
  );
}
