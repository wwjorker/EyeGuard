import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { installDiagnosticsHooks } from "./stores/diagnosticsStore";

installDiagnosticsHooks();

const params = new URLSearchParams(window.location.search);
const windowKind = params.get("window");

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

async function bootstrap() {
  if (windowKind === "notification") {
    const { NotificationApp } = await import("./windows/NotificationApp");
    root.render(
      <React.StrictMode>
        <ErrorBoundary label="notification">
          <NotificationApp />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    return;
  }
  if (windowKind === "break") {
    const { BreakWindow } = await import("./windows/BreakWindow");
    root.render(
      <React.StrictMode>
        <ErrorBoundary label="break">
          <BreakWindow />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    return;
  }
  const { default: App } = await import("./App");
  root.render(
    <React.StrictMode>
      <ErrorBoundary label="main">
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

void bootstrap();
