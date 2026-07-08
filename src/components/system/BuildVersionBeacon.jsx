import { useMemo } from "react";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";
const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT || import.meta.env.VITE_COMMIT_SHA || "unpublished";
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME || "local-build";

const VISIBLE_PATH_PREFIXES = ["/admin", "/setup", "/client-portal"];

export default function BuildVersionBeacon() {
  const visible = useMemo(() => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname.toLowerCase();
    return VISIBLE_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  }, []);

  if (!visible) return null;

  const shortCommit = GIT_COMMIT === "unpublished" ? GIT_COMMIT : GIT_COMMIT.slice(0, 8);

  return (
    <div
      className="fixed bottom-3 left-3 z-[90] hidden rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 shadow-sm backdrop-blur md:block"
      title={`Version ${APP_VERSION} • Commit ${GIT_COMMIT} • Built ${BUILD_TIME}`}
    >
      v{APP_VERSION} · {shortCommit}
    </div>
  );
}
