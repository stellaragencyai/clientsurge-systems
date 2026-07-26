import { Link } from "react-router-dom";

export default function PrelaunchFooter() {
  return (
    <footer className="prelaunch-footer">
      <div className="prelaunch-footer__inner">
        <nav className="prelaunch-footer__nav" aria-label="Footer">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Client Login</Link>
        </nav>
        <p className="prelaunch-footer__copy">&copy; 2026 ClientSurge Systems</p>
      </div>
    </footer>
  );
}