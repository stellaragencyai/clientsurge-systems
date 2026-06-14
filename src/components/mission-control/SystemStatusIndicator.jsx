import { useEffect, useState } from "react";

export default function SystemStatusIndicator() {
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health", { method: "GET" });
        setStatus(response.ok ? "live" : "degraded");
      } catch {
        setStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    live: { color: "bg-green-500", text: "System Live", pulse: true },
    degraded: { color: "bg-yellow-500", text: "Degraded", pulse: false },
    offline: { color: "bg-red-500", text: "Offline", pulse: false },
    connecting: { color: "bg-blue-500", text: "Connecting...", pulse: true },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs font-medium">
      <span className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? "animate-pulse" : ""}`} />
      <span className="text-muted-foreground">{config.text}</span>
    </div>
  );
}