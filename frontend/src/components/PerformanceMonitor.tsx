import { useEffect } from "react";
import type { Metric } from "web-vitals";
import { onCLS, onFID, onLCP, onFCP, onTTFB } from "web-vitals";
import * as Sentry from "@sentry/react";

interface ReportedMetric extends Metric {
  id: string;
  name: "CLS" | "FCP" | "FID" | "LCP" | "TTFB";
  value: number;
  delta: number;
}

const reportWebVitals = (metric: Metric) => {
  // Send to Sentry
  Sentry.captureMessage(`Web Vital: ${metric.name}`, {
    level: "info",
    extra: {
      metric: {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
      },
    },
  });

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(metric);
  }
};

const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getLCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
  }, []);

  return null;
};

export default PerformanceMonitor;
function getCLS(reportWebVitals: (metric: Metric) => void) {
  throw new Error("Function not implemented.");
}

function getFID(reportWebVitals: (metric: Metric) => void) {
  throw new Error("Function not implemented.");
}

function getLCP(reportWebVitals: (metric: Metric) => void) {
  throw new Error("Function not implemented.");
}

function getTTFB(reportWebVitals: (metric: Metric) => void) {
  throw new Error("Function not implemented.");
}
