import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PortalLoginModal from "@/components/forms/PortalLoginModal";
import CSAuthSurface from "@/components/design-system/CSAuthSurface";
import { CSAlert } from "@/components/design-system/CSProductPrimitives";
import { setPageMetadata } from "@/lib/seo";

export default function Login() {
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    return setPageMetadata({
      title: "Client Portal Login | ClientSurge Systems",
      description:
        "Sign in to the ClientSurge Systems client portal to view activation, AI service activity, billing, reports, and required actions.",
      canonicalPath: "/login",
      ogTitle: "Client Portal Login | ClientSurge Systems",
      ogDescription:
        "Secure access to your ClientSurge system, activation progress, performance, billing, and support.",
      robots: "noindex,nofollow",
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from_url")) setShowLogin(true);
  }, []);

  return (
    <>
      <CSAuthSurface
        title="Welcome back to your ClientSurge system."
        description="See what is active, what ClientSurge handled, what results were created, and what needs your attention."
        onPrimaryAction={() => setShowLogin(true)}
        primaryLabel="Open secure sign in"
        secondaryAction={
          <Link to="/contact" className="cs-button cs-button--secondary cs-button--lg">
            Get account help
          </Link>
        }
      >
        <CSAlert tone="info" title="First time signing in?">
          Use the email connected to your order. Your activation and account access remain linked to the same customer record.
        </CSAlert>
      </CSAuthSurface>

      {showLogin ? <PortalLoginModal onClose={() => setShowLogin(false)} /> : null}
    </>
  );
}
