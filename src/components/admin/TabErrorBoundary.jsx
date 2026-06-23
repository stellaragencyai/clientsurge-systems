import { Component } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Tab-level error boundary for admin dashboard panels.
 * Prevents a single tab crash from taking down the entire admin dashboard.
 * Shows a controlled, admin-friendly error message with a retry button.
 */
export default class TabErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[TabErrorBoundary] Panel crashed:", this.props.tabName, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            This panel failed to load
          </h3>
          <p className="text-sm text-muted-foreground mb-1 max-w-md mx-auto">
            An error occurred while rendering this tab. Other tabs are unaffected.
          </p>
          {this.state.error?.message && (
            <p className="text-xs text-red-600 font-mono mb-4 max-w-md mx-auto break-all">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #0088CC, #00AEEF)" }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}