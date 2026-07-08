import OnboardingCredentialsWizard from "@/components/onboarding/CredentialsWizard";
import { useOrderGuard } from "@/hooks/useOrderGuard";

export default function CredentialsWizard() {
  const { order, loading: orderLoading, error: orderError } = useOrderGuard();

  if (orderLoading) {
    return <div style={{ color: "#6b7280", padding: 40 }}>Verifying order...</div>;
  }

  if (orderError) {
    return <div style={{ color: "#dc2626", padding: 40 }}>{orderError}</div>;
  }

  if (!order) return null;

  return (
    <OnboardingCredentialsWizard
      order={order}
      onComplete={(payload) => {
        const target = payload?.redirect_to || `/setup/status/${order.id}`;
        window.location.assign(target);
      }}
    />
  );
}
