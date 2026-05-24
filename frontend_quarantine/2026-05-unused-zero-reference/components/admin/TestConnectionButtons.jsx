/**
 * TestConnectionButtons — #172
 * "Test Connection" buttons for Twilio + Resend in AdminSettings.
 */
import { useState } from "react";

export function TestTwilioButton() {
  const [status, setStatus] = useState(null); // null | "testing" | "ok" | "fail"
  const [msg, setMsg] = useState("");

  const test = async () => {
    setStatus("testing"); setMsg("");
    try {
      const res = await fetch("/api/functions/testProviderConnections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "twilio" }),
      });
      const data = await res.json();
      setStatus(data.success ? "ok" : "fail");
      setMsg(data.message || data.error || "");
    } catch (e) {
      setStatus("fail"); setMsg(e.message);
    }
  };

  const color = status === "ok" ? "#00FFB3" : status === "fail" ? "#EF4444" : "#9CA3AF";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={test} disabled={status === "testing"} style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
        color: "#D1D5DB", borderRadius: 8, padding: "7px 14px", fontSize: 12,
        fontWeight: 600, cursor: status === "testing" ? "not-allowed" : "pointer",
      }}>
        {status === "testing" ? "Testing..." : "🔌 Test Twilio"}
      </button>
      {msg && <span style={{ color, fontSize: 12 }}>{status === "ok" ? "✅" : "❌"} {msg}</span>}
    </div>
  );
}

export function TestResendButton() {
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");

  const test = async () => {
    setStatus("testing"); setMsg("");
    try {
      const res = await fetch("/api/functions/testProviderConnections", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "resend" }),
      });
      const data = await res.json();
      setStatus(data.success ? "ok" : "fail");
      setMsg(data.message || data.error || "");
    } catch (e) {
      setStatus("fail"); setMsg(e.message);
    }
  };

  const color = status === "ok" ? "#00FFB3" : status === "fail" ? "#EF4444" : "#9CA3AF";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button onClick={test} disabled={status === "testing"} style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
        color: "#D1D5DB", borderRadius: 8, padding: "7px 14px", fontSize: 12,
        fontWeight: 600, cursor: status === "testing" ? "not-allowed" : "pointer",
      }}>
        {status === "testing" ? "Testing..." : "🔌 Test Resend"}
      </button>
      {msg && <span style={{ color, fontSize: 12 }}>{status === "ok" ? "✅" : "❌"} {msg}</span>}
    </div>
  );
}
