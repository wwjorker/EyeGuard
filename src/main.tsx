import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";

const params = new URLSearchParams(window.location.search);
const isNotification = params.get("window") === "notification";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

async function bootstrap() {
  if (isNotification) {
    const { NotificationApp } = await import("./windows/NotificationApp");
    root.render(
      <React.StrictMode>
        <NotificationApp />
      </React.StrictMode>,
    );
  } else {
    const { default: App } = await import("./App");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

void bootstrap();
