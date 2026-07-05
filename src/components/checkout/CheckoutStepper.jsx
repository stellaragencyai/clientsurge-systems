import { CheckCircle2 } from "lucide-react";

export default function CheckoutStepper({ currentStep = 1 }) {
  const steps = [
    { num: 1, label: "Create Your Account" },
    { num: 2, label: "Billing Information" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-center">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.num;
          const isActive = currentStep === step.num;
          return (
            <div key={step.num} className="flex items-center">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: isCompleted ? "#059669" : isActive ? "#005691" : "#e5e7eb",
                    color: isCompleted || isActive ? "#ffffff" : "#9ca3af",
                  }}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.num}
                </div>
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{ color: isActive ? "#005691" : "#9ca3af" }}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className="w-12 sm:w-20 h-0.5 mx-3 sm:mx-5"
                  style={{ background: currentStep > step.num ? "#059669" : "#e5e7eb" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}