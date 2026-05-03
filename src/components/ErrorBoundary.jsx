import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6 text-center bg-background">
          <div className="max-w-md">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
            >
              <span className="text-white text-2xl">⚠️</span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              An unexpected error occurred. Please refresh the page or contact support if the problem persists.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
              >
                Refresh Page
              </button>
              <a
                href="/"
                className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}