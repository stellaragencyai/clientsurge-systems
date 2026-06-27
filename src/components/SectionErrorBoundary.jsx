import { Component } from "react";

/**
 * SectionErrorBoundary — wraps individual page sections so a crash in one
 * section (e.g., a lazy-loaded component failing to hydrate) doesn't take
 * down the entire page. Shows a minimal fallback with the section name.
 */
export default class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[SectionErrorBoundary:${this.props.sectionName || "unknown"}]`, error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          aria-label={this.props.sectionName}
          className="flex items-center justify-center"
          style={{ minHeight: "200px", padding: "3rem 1.5rem" }}
        >
          <p className="text-sm text-muted-foreground text-center">
            {this.props.fallbackMessage || "This section is temporarily unavailable."}
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}