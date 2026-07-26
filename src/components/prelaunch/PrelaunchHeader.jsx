import { Link } from "react-router-dom";

const BRAND_LOGO =
  "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png";

export default function PrelaunchHeader() {
  return (
    <header className="prelaunch-header">
      <div className="prelaunch-header__inner">
        <div className="prelaunch-header__logo" aria-label="ClientSurge Systems">
          <img
            src={BRAND_LOGO}
            alt="ClientSurge Systems"
            width="220"
            height="55"
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="prelaunch-header__meta">
          <span className="prelaunch-header__launch-tag">Launching September 1, 2026</span>
          <Link to="/login" className="prelaunch-header__login">
            Client Login
          </Link>
        </div>
      </div>
    </header>
  );
}