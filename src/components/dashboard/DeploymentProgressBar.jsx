import { Loader2, CheckCircle2 } from "lucide-react";

export default function DeploymentProgressBar({ pipelineStatus, installStatus }) {
  const stages = [
    { key: "Paid", label: "Payment Confirmed", icon: "✓" },
    { key: "Configuring", label: "AI Configuring System", icon: "⚙" },
    { key: "Testing", label: "Running Tests", icon: "🧪" },
    { key: "Live", label: "System Live", icon: "🚀" },
  ];

  const currentIndex = stages.findIndex((s) => s.key === installStatus);
  const isComplete = installStatus === "Live";
  const isError = installStatus === "Error";
  const isActive = currentIndex >= 0 && currentIndex < stages.length;

  return (
    <div className="w-full bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/15 rounded-lg p-6 mb-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">System Deployment Progress</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isComplete
                ? "Your system is fully live and operational"
                : isError
                ? "Setup paused — please check your credentials"
                : "AI is provisioning your system in real-time"}
            </p>
          </div>
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : !isError ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : null}
        </div>

        {/* Progress Stages */}
        <div className="relative">
          <div className="flex items-center justify-between">
            {stages.map((stage, idx) => {
              const isActive = idx === currentIndex;
              const isCompleted = idx < currentIndex;
              const isUpcoming = idx > currentIndex;

              return (
                <div key={stage.key} className="flex-1">
                  {/* Stage Dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isCompleted
                          ? "bg-green-600 text-white"
                          : isActive
                          ? "bg-primary text-white ring-2 ring-primary ring-offset-2"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? "✓" : stage.icon}
                    </div>
                    {/* Label */}
                    <p
                      className={`text-xs mt-2 text-center font-medium ${
                        isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>

                  {/* Connector Line (if not last) */}
                  {idx < stages.length - 1 && (
                    <div
                      className={`absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-1 transition-all ${
                        isCompleted ? "bg-green-600" : isActive ? "bg-primary" : "bg-muted"
                      }`}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Invisible connectors at correct z-index */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {stages.map((_, idx) => {
              if (idx >= stages.length - 1) return null;
              const isCompleted = idx < currentIndex;
              const isActive = idx === currentIndex;
              return (
                <div
                  key={`connector-${idx}`}
                  className={`absolute top-5 h-1 transition-all ${
                    isCompleted ? "bg-green-600" : isActive ? "bg-primary" : "bg-muted"
                  }`}
                  style={{
                    left: `calc(${((idx + 1) / stages.length) * 100}% - 20px)`,
                    width: `calc(${(100 / stages.length)}% - 40px)`,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Status Message */}
        {isError && (
          <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-xs text-destructive font-medium">
              ⚠ Setup paused due to missing credentials. Add your Twilio and email settings to resume.
            </p>
          </div>
        )}

        {isActive && !isComplete && (
          <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-xs text-primary font-medium">
              Your system is being configured. This typically takes 2–5 minutes. Keep this window open.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}