import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RefreshCw, RotateCcw } from "lucide-react";
import { useDiagnosticsStore } from "../stores/diagnosticsStore";

interface State {
  error: Error | null;
  info: ErrorInfo | null;
  showDetails: boolean;
}

interface Props {
  children: ReactNode;
  /** Optional label shown in the heading so different windows can identify
   *  themselves on the recovery screen. */
  label?: string;
}

/**
 * Catches render-time exceptions in any descendant React tree and
 * shows a recoverable fallback UI instead of a white screen. Each
 * window mounts its own boundary at the root so a crash in the
 * notification window doesn't take the main app down with it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null, showDetails: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    try {
      useDiagnosticsStore
        .getState()
        .log("error", `[boundary] ${error.message}\n${info.componentStack ?? ""}`);
    } catch {
      /* ignore */
    }
  }

  reload = () => {
    window.location.reload();
  };

  hardReset = () => {
    if (window.confirm("Reset all settings and reload?")) {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("eyeguard."))
          .forEach((k) => localStorage.removeItem(k));
      } catch {
        /* ignore */
      }
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="boundary-root">
        <div className="boundary-card">
          <div className="boundary-icon">
            <AlertOctagon size={20} strokeWidth={1.75} />
          </div>
          <h2 className="boundary-title">Something went wrong</h2>
          <p className="boundary-tagline">
            {this.props.label ? `${this.props.label} hit an error. ` : ""}
            You can usually recover by reloading the window.
          </p>

          <div className="boundary-msg">{this.state.error.message || "Unknown error"}</div>

          <div className="boundary-actions">
            <button className="btn-primary boundary-btn" onClick={this.reload}>
              <RefreshCw size={13} />
              <span>Reload</span>
            </button>
            <button className="btn-ghost boundary-btn" onClick={this.hardReset}>
              <RotateCcw size={13} />
              <span>Reset settings</span>
            </button>
          </div>

          <button
            className="boundary-toggle"
            onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
          >
            {this.state.showDetails ? "Hide details" : "Show details"}
          </button>

          {this.state.showDetails && (
            <pre className="boundary-stack">
              {this.state.error.stack}
              {this.state.info?.componentStack ?? ""}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
