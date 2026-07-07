/**
 * Logout page — confirms session ended, provides re-entry paths.
 * Route: /logout
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LogIn, Home, LifeBuoy, CheckCircle2 } from "lucide-react";

export default function Logout() {
  useEffect(() => {
    try {
      sessionStorage.removeItem("cs_utm_session");
    } catch {}
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: "linear-gradient(135deg, #f7fbff 0%, #ffffff 45%, #eef8ff 100%)",
      }}
    >
      <div className="max-w-md text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "linear-gradient(135deg, #003B8F, #00AEEF)",
            boxShadow: "0 8px 32px rgba(0,174,239,0.25)",
          }}
        >
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h1
          className="mb-3 text-3xl font-black text-foreground"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          You've been logged out
        </h1>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-sm mx-auto">
          Your session has been ended. You can log back in at any time to return to your
          client portal.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/login"
            className="cs-btn-primary inline-flex items-center gap-2 text-sm"
            style={{ minHeight: "48px" }}
          >
            <LogIn className="w-4 h-4" /> Log Back In
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
            style={{ minHeight: "48px" }}
          >
            <Home className="w-4 h-4" /> Return Home
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
            style={{ minHeight: "48px" }}
          >
            <LifeBuoy className="w-4 h-4" /> Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}