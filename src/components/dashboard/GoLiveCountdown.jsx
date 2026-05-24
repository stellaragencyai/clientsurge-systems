import { useMemo } from "react";

// Maximum business days from payment to go-live
const TOTAL_BUSINESS_DAYS = 7;

function addBusinessDays(startDate, days) {
  const date = new Date(startDate);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added++; // skip weekends
  }
  return date;
}

function businessDaysBetween(start, end) {
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0,0,0,0);
  const endD = new Date(end);
  endD.setHours(0,0,0,0);
  while (cur < endD) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

const STAGE_MESSAGE = {
  "Paid": "We\'re assigning your dedicated installer now.",
  "Ready for Install": "Your installer is ready — build starts soon.",
  "Configuring": "Your automation flows are being built right now.",
  "Testing": "Almost there — final end-to-end tests running.",
  "Live": "Your system is live and capturing leads 24/7.",
  "Error": "Our team has been notified and is resolving the issue.",
};

export default function GoLiveCountdown({ installStatus, createdDate }) {
  const { daysRemaining, targetDate, overdue } = useMemo(() => {
    if (!createdDate || installStatus === "Live" || installStatus === "Error") {
      return { daysRemaining: null, targetDate: null, overdue: false };
    }
    const start = new Date(createdDate);
    const target = addBusinessDays(start, TOTAL_BUSINESS_DAYS);
    const today = new Date();
    const remaining = businessDaysBetween(today, target);
    return {
      daysRemaining: Math.max(remaining, 0),
      targetDate: target,
      overdue: today > target,
    };
  }, [createdDate, installStatus]);

  if (installStatus === "Live") {
    return (
      <div style={{
        borderRadius: "14px",
        background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))",
        border: "1px solid rgba(34,197,94,0.2)",
        padding: "18px 20px", marginBottom: "20px",
        display: "flex", alignItems: "center", gap: "14px",
      }}>
        <div style={{ width:"44px",height:"44px",borderRadius:"12px",flexShrink:0,background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px" }}>🚀</div>
        <div>
          <p style={{ fontSize:"14px",fontWeight:"800",color:"#16a34a",margin:"0 0 3px" }}>Your System is Live!</p>
          <p style={{ fontSize:"12px",color:"rgba(10,22,40,0.55)",margin:0 }}>Your automation is running and responding to leads 24/7.</p>
        </div>
      </div>
    );
  }

  if (installStatus === "Error") {
    return (
      <div style={{
        borderRadius: "14px", background: "rgba(239,68,68,0.05)",
        border: "1px solid rgba(239,68,68,0.2)",
        padding: "18px 20px", marginBottom: "20px",
        display: "flex", alignItems: "center", gap: "14px",
      }}>
        <div style={{ width:"44px",height:"44px",borderRadius:"12px",flexShrink:0,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px" }}>⚠️</div>
        <div>
          <p style={{ fontSize:"14px",fontWeight:"800",color:"#dc2626",margin:"0 0 3px" }}>Action Needed</p>
          <p style={{ fontSize:"12px",color:"rgba(10,22,40,0.55)",margin:0 }}>Our team has been notified and is working on a fix. We\'ll update you shortly.</p>
        </div>
      </div>
    );
  }

  const message = STAGE_MESSAGE[installStatus] || "Your installation is in progress.";
  const friendlyTarget = targetDate
    ? targetDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : null;

  return (
    <div style={{
      borderRadius: "14px",
      background: overdue
        ? "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.03))"
        : "linear-gradient(135deg, rgba(0,136,204,0.07), rgba(0,174,239,0.04))",
      border: overdue ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(0,136,204,0.14)",
      padding: "18px 20px", marginBottom: "20px",
      display: "flex", alignItems: "center", gap: "14px",
    }}>
      <div style={{
        width:"44px",height:"44px",borderRadius:"12px",flexShrink:0,
        background: overdue ? "rgba(239,68,68,0.1)" : "rgba(0,136,204,0.1)",
        border: overdue ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(0,136,204,0.15)",
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",
      }}>
        {overdue ? "⏰" : "🔧"}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize:"14px",fontWeight:"800",color: overdue ? "#dc2626" : "#1b140d",margin:"0 0 3px" }}>
          {overdue
            ? "Checking in with your installer"
            : daysRemaining === 0
              ? "Going live today!"
              : `${daysRemaining} business day${daysRemaining === 1 ? "" : "s"} remaining`}
        </p>
        <p style={{ fontSize:"12px",color:"rgba(10,22,40,0.55)",margin:0 }}>
          {message}
          {friendlyTarget && !overdue && (
            <span style={{ color:"rgba(10,22,40,0.4)" }}> · Target: {friendlyTarget}</span>
          )}
        </p>
      </div>
    </div>
  );
}
