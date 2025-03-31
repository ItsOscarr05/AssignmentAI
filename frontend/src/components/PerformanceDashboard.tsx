import styled from "@emotion/styled";
import React from "react";
import type { PerformanceMetrics } from "../utils/performance";
import { usePerformanceObserver } from "../utils/performance";

const DashboardContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  min-width: 200px;
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const MetricLabel = styled.span`
  color: #888;
`;

const MetricValue = styled.span<{ warning?: boolean }>`
  color: ${(props) => (props.warning ? "#ff6b6b" : "#4caf50")};
`;

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    pageLoadTime: 0,
    componentRenderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  usePerformanceObserver((newMetrics) => {
    setMetrics(newMetrics);
  });

  const formatTime = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  const formatMemory = (mb: number): string => {
    return `${mb.toFixed(2)}MB`;
  };

  const isWarning = (fps: number): boolean => {
    return fps < 30;
  };

  return (
    <DashboardContainer>
      <MetricRow>
        <MetricLabel>Page Load:</MetricLabel>
        <MetricValue>{formatTime(metrics.pageLoadTime)}</MetricValue>
      </MetricRow>
      <MetricRow>
        <MetricLabel>Render Time:</MetricLabel>
        <MetricValue>{formatTime(metrics.componentRenderTime)}</MetricValue>
      </MetricRow>
      <MetricRow>
        <MetricLabel>API Response:</MetricLabel>
        <MetricValue>{formatTime(metrics.apiResponseTime)}</MetricValue>
      </MetricRow>
      <MetricRow>
        <MetricLabel>Memory Usage:</MetricLabel>
        <MetricValue>{formatMemory(metrics.memoryUsage)}</MetricValue>
      </MetricRow>
      <MetricRow>
        <MetricLabel>FPS:</MetricLabel>
        <MetricValue warning={isWarning(metrics.fps)}>
          {metrics.fps}
        </MetricValue>
      </MetricRow>
    </DashboardContainer>
  );
};

export default PerformanceDashboard;
