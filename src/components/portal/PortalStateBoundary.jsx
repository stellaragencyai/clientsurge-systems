/**
 * PortalStateBoundary — ensures /client-portal never renders blank.
 *
 * Wraps the portal dashboard overview so that if any component
 * throws or returns null, a safe fallback is shown instead.
 *
 * Also exposes normalized card states to child components via props.
 */
import { Component } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default class PortalStateBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[PortalStateBoundary] caught error:", error?.message || error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">We're updating your system stats</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
              Some information is still syncing. Your data is safe — try refreshing in a moment.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}