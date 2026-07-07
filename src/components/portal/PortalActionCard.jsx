/**
 * PortalActionCard — Premium action/upsert card for the client portal sidebar.
 * Uses CSCard design system component with CSButton.
 *
 * Props:
 *   icon        — lucide-react icon component
 *   title       — string
 *   description — string
 *   buttonText  — string
 *   buttonColor — hex color (default #0088CC)
 *   onClick     — function
 */
import CSCard from "@/components/design-system/CSCard";
import CSButton from "@/components/design-system/CSButton";

export default function PortalActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonColor = "#0088CC",
  onClick,
}) {
  return (
    <CSCard className="!p-5" hover={false}>
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${buttonColor}12, ${buttonColor}06)`,
            border: `1px solid ${buttonColor}25`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: buttonColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 leading-tight">{title}</h3>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{description}</p>
      <CSButton
        variant="primary"
        size="sm"
        onClick={onClick}
        className="w-full !justify-center"
        style={{
          background: `linear-gradient(90deg, ${buttonColor} 0%, ${buttonColor}dd 100%)`,
        }}
      >
        {buttonText}
      </CSButton>
    </CSCard>
  );
}