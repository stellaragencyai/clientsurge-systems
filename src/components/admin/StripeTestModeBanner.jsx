/**
 * StripeTestModeBanner — #310
 * Shows red "TEST MODE ACTIVE" banner in admin when Stripe key is a test key.
 * Also injects scoped admin dashboard polish and a persistent sign-out control.
 */
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";

const LOGGED_OUT_REDIRECT = "/?logged_out=1";

function AdminDashboardPolish() {
  return (
    <style>{`
      img[src*="9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c"] {
        height: 72px !important;
        width: auto !important;
        max-width: 190px !important;
        object-fit: contain !important;
      }

      div[style*="#F7F8FA"],
      div[style*="rgb(247, 248, 250)"] {
        background:
          radial-gradient(circle at 18% 0%, rgba(0, 174, 239, 0.08), transparent 30%),
          linear-gradient(180deg, #f8fbff 0%, #f5f7fb 52%, #f8fafc 100%) !important;
      }

      button[style*="#3b4450"],
      button[style*="rgb(59, 68, 80)"] {
        background: linear-gradient(135deg, #111827 0%, #0079c1 100%) !important;
        box-shadow: 0 10px 24px rgba(0, 121, 193, 0.20) !important;
      }

      .max-w-7xl > .space-y-6 > div[class*="grid"] > div[class*="bg-white"],
      .max-w-7xl > .space-y-6 > div[class*="grid"] > button[class*="bg-white"] {
        border-color: rgba(0, 174, 239, 0.14) !important;
        box-shadow: 0 18px 48px rgba(15, 23, 42, 0.055), inset 0 1px 0 rgba(255, 255, 255, 0.92) !important;
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease !important;
      }

      .max-w-7xl > .space-y-6 > div[class*="grid"] > div[class*="bg-white"]:hover,
      .max-w-7xl > .space-y-6 > div[class*="grid"] > button[class*="bg-white"]:hover {
        transform: translateY(-2px);
        border-color: rgba(0, 174, 239, 0.28) !important;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(0, 174, 239, 0.06) !important;
      }

      .clientsurge-admin-logout {
        position: fixed;
        top: 14px;
        right: 76px;
        z-index: 80;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 36px;
        min-width: unset;
        padding: 8px 13px;
        border-radius: 999px;
        border: 1px solid rgba(15, 23, 42, 0.10);
        background: rgba(255, 255, 255, 0.92);
        color: #111827;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: -0.01em;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
      }

      .clientsurge-admin-logout:hover {
        transform: translateY(-1px);
        border-color: rgba(0, 174, 239, 0.28);
        box-shadow: 0 16px 38px rgba(15, 23, 42, 0.14), 0 0 0 3px rgba(0, 174, 239, 0.08);
      }

      .clientsurge-admin-logout:disabled {
        opacity: 0.7;
        cursor: wait;
        transform: none;
      }

      @media (max-width: 720px) {
        .clientsurge-admin-logout {
          right: 16px;
          top: 12px;
          padding: 9px 11px;
        }
        .clientsurge-admin-logout span {
          display: none;
        }
      }
    `}</style>
  );
}

function AdminLogoutButton() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    try {
      window.localStorage.removeItem("clientsurge_local_admin");
      window.localStorage.removeItem("clientsurge_local_super_admin");
      await Promise.resolve(base44.auth.logout(LOGGED_OUT_REDIRECT));

      window.setTimeout(() => {
        if (window.location.pathname !== "/" || !window.location.search.includes("logged_out=1")) {
          window.location.assign(LOGGED_OUT_REDIRECT);
        }
      }, 1200);
    } catch (error) {
      console.error("Admin logout failed; redirecting to logged-out home state.", error);
      window.location.assign(LOGGED_OUT_REDIRECT);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="clientsurge-admin-logout"
      aria-label="Sign out and return to the main website"
    >
      {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span>{loggingOut ? "Signing out" : "Sign out"}</span>
    </button>
  );
}

export default function StripeTestModeBanner() {
  const [isTest, setIsTest] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/functions/getStripeMode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        setIsTest(data?.mode === "test" || data?.livemode === false);
      } catch {
        setIsTest(false);
      }
    })();
  }, []);

  return (
    <>
      <AdminDashboardPolish />
      <AdminLogoutButton />
      {isTest && (
        <div
          style={{
            background: "#EF4444",
            color: "#fff",
            textAlign: "center",
            padding: "8px 20px",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: "0.08em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            position: "sticky",
            top: 0,
            zIndex: 9999,
          }}
        >
          <span style={{ fontSize: 16 }}>⚠️</span>
          TEST MODE ACTIVE — Stripe payments are not live. Switch to live keys before launch.
          <span style={{ fontSize: 16 }}>⚠️</span>
        </div>
      )}
    </>
  );
}
