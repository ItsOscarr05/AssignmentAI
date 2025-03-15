import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { initSentry } from "./lib/sentry";

// Initialize Sentry
initSentry();

const container = document.getElementById("root");
const root = createRoot(container);

// Add performance marks
performance.mark("app-start");

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Measure initial render
performance.measure("initial-render", "app-start");

// Register service worker
if (process.env.NODE_ENV === "production") {
  serviceWorker.register({
    onSuccess: () => console.log("Service Worker registered successfully"),
    onUpdate: (registration) => {
      // Notify user of update
      const shouldUpdate = window.confirm(
        "New version available! Click OK to update."
      );
      if (shouldUpdate && registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      }
    },
  });
} else {
  serviceWorker.unregister();
}
