from typing import Dict, List, Optional, Union, Any
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
import json
import logging
from enum import Enum
import asyncio
import pandas as pd
from sklearn.metrics import precision_recall_fscore_support
from sklearn.model_selection import cross_val_score
import torch
import tensorflow as tf
from typing import NamedTuple
import aiohttp
import psutil
import statistics
from abc import ABC, abstractmethod
from collections import defaultdict

class MetricType(Enum):
    ACCURACY = "accuracy"
    LATENCY = "latency"
    MEMORY = "memory"
    THROUGHPUT = "throughput"
    COST = "cost"
    QUALITY = "quality"
    CPU_USAGE = "cpu_usage"
    GPU_USAGE = "gpu_usage"
    MEMORY_USAGE = "memory_usage"
    ERROR_RATE = "error_rate"

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class ExperimentType(Enum):
    A_B = "a_b"
    MULTI_VARIANT = "multi_variant"
    CANARY = "canary"
    SHADOW = "shadow"

@dataclass
class Alert:
    severity: AlertSeverity
    message: str
    metric_type: MetricType
    timestamp: datetime
    model_id: str
    threshold: float
    current_value: float
    context: Dict[str, Any]

@dataclass
class Experiment:
    id: str
    type: ExperimentType
    variants: Dict[str, Any]
    metrics: Dict[str, List[float]]
    start_time: datetime
    end_time: Optional[datetime]
    traffic_split: Dict[str, float]
    success_criteria: Dict[str, float]
    status: str
    results: Optional[Dict[str, Any]] = None

class AlertHandler(ABC):
    @abstractmethod
    async def handle_alert(self, alert: Alert):
        pass

class EmailAlertHandler(AlertHandler):
    async def handle_alert(self, alert: Alert):
        # Implement email alert logic
        pass

class SlackAlertHandler(AlertHandler):
    async def handle_alert(self, alert: Alert):
        # Implement Slack alert logic
        pass

class WebhookAlertHandler(AlertHandler):
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url
        
    async def handle_alert(self, alert: Alert):
        async with aiohttp.ClientSession() as session:
            await session.post(
                self.webhook_url,
                json={
                    "severity": alert.severity.value,
                    "message": alert.message,
                    "metric": alert.metric_type.value,
                    "timestamp": alert.timestamp.isoformat(),
                    "model_id": alert.model_id,
                    "threshold": alert.threshold,
                    "current_value": alert.current_value,
                    "context": alert.context
                }
            )

@dataclass
class PerformanceMetric:
    timestamp: datetime
    metric_type: MetricType
    value: float
    metadata: Dict[str, Any]

@dataclass
class ModelPerformance:
    model_id: str
    metrics: List[PerformanceMetric]
    baseline: Dict[str, float]
    improvement_rate: float
    stability_score: float
    optimization_suggestions: List[str]
    resource_usage: Dict[str, float]
    error_rate: float
    experiment_results: Optional[Dict[str, Any]] = None

class PerformanceTracker:
    def __init__(self):
        self.metrics_history: Dict[str, List[PerformanceMetric]] = {}
        self.model_performances: Dict[str, ModelPerformance] = {}
        self.baselines: Dict[str, Dict[str, float]] = {}
        self.improvement_targets: Dict[str, Dict[str, float]] = {}
        self.alert_thresholds: Dict[str, Dict[str, float]] = {}
        self.optimization_history: List[Dict] = []
        self.experiments: Dict[str, Experiment] = {}
        self.alert_handlers: List[AlertHandler] = []
        self.resource_monitor = ResourceMonitor()
        
    def add_alert_handler(self, handler: AlertHandler):
        """Add an alert handler"""
        self.alert_handlers.append(handler)
        
    async def track_metric(
        self,
        model_id: str,
        metric_type: MetricType,
        value: float,
        metadata: Optional[Dict] = None,
        experiment_id: Optional[str] = None
    ):
        """Track a new performance metric"""
        metric = PerformanceMetric(
            timestamp=datetime.now(),
            metric_type=metric_type,
            value=value,
            metadata=metadata or {}
        )
        
        if model_id not in self.metrics_history:
            self.metrics_history[model_id] = []
        self.metrics_history[model_id].append(metric)
        
        # Update model performance
        await self._update_model_performance(model_id)
        
        # Update experiment if applicable
        if experiment_id and experiment_id in self.experiments:
            await self._update_experiment(experiment_id, model_id, metric)
        
        # Check for alerts
        await self._check_alerts(model_id, metric)
        
        # Track resource usage
        await self._track_resource_usage(model_id)
        
    async def create_experiment(
        self,
        experiment_type: ExperimentType,
        variants: Dict[str, Any],
        traffic_split: Dict[str, float],
        success_criteria: Dict[str, float],
        duration: timedelta
    ) -> str:
        """Create a new experiment"""
        experiment_id = f"exp_{len(self.experiments) + 1}"
        
        experiment = Experiment(
            id=experiment_id,
            type=experiment_type,
            variants=variants,
            metrics={},
            start_time=datetime.now(),
            end_time=datetime.now() + duration,
            traffic_split=traffic_split,
            success_criteria=success_criteria,
            status="running"
        )
        
        self.experiments[experiment_id] = experiment
        
        # Schedule experiment completion
        asyncio.create_task(self._complete_experiment(experiment_id, duration))
        
        return experiment_id
        
    async def _update_experiment(
        self,
        experiment_id: str,
        model_id: str,
        metric: PerformanceMetric
    ):
        """Update experiment metrics"""
        experiment = self.experiments[experiment_id]
        
        if model_id not in experiment.metrics:
            experiment.metrics[model_id] = []
            
        experiment.metrics[model_id].append(metric.value)
        
        # Check if experiment should be analyzed
        if (
            datetime.now() >= experiment.end_time
            and experiment.status == "running"
        ):
            await self._analyze_experiment(experiment_id)
            
    async def _analyze_experiment(self, experiment_id: str):
        """Analyze experiment results"""
        experiment = self.experiments[experiment_id]
        
        results = {
            "metrics": {},
            "statistical_significance": {},
            "winner": None
        }
        
        # Calculate metrics for each variant
        for variant_id, metrics in experiment.metrics.items():
            results["metrics"][variant_id] = {
                "mean": statistics.mean(metrics),
                "std": statistics.stdev(metrics) if len(metrics) > 1 else 0,
                "sample_size": len(metrics)
            }
            
        # Determine statistical significance
        control_metrics = experiment.metrics.get("control", [])
        for variant_id, metrics in experiment.metrics.items():
            if variant_id != "control":
                p_value = self._calculate_p_value(control_metrics, metrics)
                results["statistical_significance"][variant_id] = p_value
                
        # Determine winner
        results["winner"] = self._determine_winner(
            results["metrics"],
            experiment.success_criteria
        )
        
        # Update experiment
        experiment.status = "completed"
        experiment.results = results
        
        # Send alert about experiment completion
        await self._send_alert(
            Alert(
                severity=AlertSeverity.INFO,
                message=f"Experiment {experiment_id} completed",
                metric_type=MetricType.ACCURACY,
                timestamp=datetime.now(),
                model_id="experiment",
                threshold=0.0,
                current_value=0.0,
                context={"experiment_results": results}
            )
        )
        
    def _calculate_p_value(
        self,
        control_metrics: List[float],
        variant_metrics: List[float]
    ) -> float:
        """Calculate p-value for statistical significance"""
        # Implement statistical test (e.g., t-test)
        return 0.05
        
    def _determine_winner(
        self,
        metrics: Dict[str, Dict[str, float]],
        success_criteria: Dict[str, float]
    ) -> Optional[str]:
        """Determine the winning variant"""
        best_variant = None
        best_score = float('-inf')
        
        for variant_id, variant_metrics in metrics.items():
            score = 0
            for metric, target in success_criteria.items():
                if metric in variant_metrics:
                    score += (variant_metrics[metric]["mean"] - target)
                    
            if score > best_score:
                best_score = score
                best_variant = variant_id
                
        return best_variant
        
    async def _complete_experiment(
        self,
        experiment_id: str,
        duration: timedelta
    ):
        """Complete experiment after duration"""
        await asyncio.sleep(duration.total_seconds())
        await self._analyze_experiment(experiment_id)
        
    async def _track_resource_usage(self, model_id: str):
        """Track system resource usage"""
        usage = await self.resource_monitor.get_usage()
        
        for metric_type, value in usage.items():
            await self.track_metric(
                model_id=model_id,
                metric_type=metric_type,
                value=value,
                metadata={"source": "resource_monitor"}
            )
            
    async def _send_alert(self, alert: Alert):
        """Send alert through all handlers"""
        for handler in self.alert_handlers:
            try:
                await handler.handle_alert(alert)
            except Exception as e:
                logging.error(f"Alert handler failed: {str(e)}")
                
    async def _check_alerts(self, model_id: str, metric: PerformanceMetric):
        """Check if metric should trigger alerts"""
        if model_id not in self.alert_thresholds:
            return
            
        thresholds = self.alert_thresholds[model_id]
        if metric.metric_type.value in thresholds:
            threshold = thresholds[metric.metric_type.value]
            if metric.value < threshold:
                await self._send_alert(
                    Alert(
                        severity=AlertSeverity.WARNING,
                        message=f"{metric.metric_type.value} below threshold",
                        metric_type=metric.metric_type,
                        timestamp=metric.timestamp,
                        model_id=model_id,
                        threshold=threshold,
                        current_value=metric.value,
                        context=metric.metadata
                    )
                )

class ResourceMonitor:
    async def get_usage(self) -> Dict[MetricType, float]:
        """Get current system resource usage"""
        usage = {}
        
        # CPU usage
        usage[MetricType.CPU_USAGE] = psutil.cpu_percent()
        
        # Memory usage
        memory = psutil.virtual_memory()
        usage[MetricType.MEMORY_USAGE] = memory.percent
        
        # GPU usage if available
        try:
            if torch.cuda.is_available():
                usage[MetricType.GPU_USAGE] = torch.cuda.memory_allocated() / torch.cuda.max_memory_allocated()
        except:
            pass
            
        return usage

    async def _update_model_performance(self, model_id: str):
        """Update overall model performance metrics"""
        metrics = self.metrics_history[model_id]
        if not metrics:
            return
            
        # Calculate improvement rate
        improvement_rate = self._calculate_improvement_rate(metrics)
        
        # Calculate stability score
        stability_score = self._calculate_stability_score(metrics)
        
        # Generate optimization suggestions
        suggestions = await self._generate_optimization_suggestions(
            model_id,
            metrics
        )
        
        # Update performance record
        self.model_performances[model_id] = ModelPerformance(
            model_id=model_id,
            metrics=metrics,
            baseline=self.baselines.get(model_id, {}),
            improvement_rate=improvement_rate,
            stability_score=stability_score,
            optimization_suggestions=suggestions,
            resource_usage=self.resource_monitor.get_usage(),
            error_rate=0.0
        )
        
    def _calculate_improvement_rate(
        self,
        metrics: List[PerformanceMetric]
    ) -> float:
        """Calculate rate of improvement over time"""
        if len(metrics) < 2:
            return 0.0
            
        # Group metrics by type
        metrics_by_type = {}
        for metric in metrics:
            if metric.metric_type not in metrics_by_type:
                metrics_by_type[metric.metric_type] = []
            metrics_by_type[metric.metric_type].append(metric)
            
        improvement_rates = []
        for metric_type, type_metrics in metrics_by_type.items():
            if len(type_metrics) < 2:
                continue
                
            # Calculate improvement rate for each metric type
            values = [m.value for m in type_metrics]
            times = [(m.timestamp - type_metrics[0].timestamp).total_seconds()
                    for m in type_metrics]
            
            # Use linear regression to find improvement rate
            try:
                slope = np.polyfit(times, values, 1)[0]
                normalized_rate = slope / (values[0] if values[0] != 0 else 1)
                improvement_rates.append(normalized_rate)
            except:
                continue
                
        return np.mean(improvement_rates) if improvement_rates else 0.0
        
    def _calculate_stability_score(
        self,
        metrics: List[PerformanceMetric]
    ) -> float:
        """Calculate stability score based on metric variance"""
        if len(metrics) < 2:
            return 1.0
            
        stability_scores = []
        metrics_by_type = {}
        for metric in metrics:
            if metric.metric_type not in metrics_by_type:
                metrics_by_type[metric.metric_type] = []
            metrics_by_type[metric.metric_type].append(metric)
            
        for metric_type, type_metrics in metrics_by_type.items():
            if len(type_metrics) < 2:
                continue
                
            values = [m.value for m in type_metrics]
            
            # Calculate coefficient of variation
            mean = np.mean(values)
            std = np.std(values)
            cv = std / mean if mean != 0 else float('inf')
            
            # Convert to stability score (1 is most stable)
            stability = 1 / (1 + cv)
            stability_scores.append(stability)
            
        return np.mean(stability_scores) if stability_scores else 1.0
        
    async def _generate_optimization_suggestions(
        self,
        model_id: str,
        metrics: List[PerformanceMetric]
    ) -> List[str]:
        """Generate optimization suggestions based on metrics"""
        suggestions = []
        
        # Analyze performance patterns
        performance_issues = await self._analyze_performance_patterns(metrics)
        
        # Generate specific suggestions
        for issue in performance_issues:
            if issue["type"] == "latency":
                suggestions.extend([
                    "Implement request batching for better throughput",
                    "Optimize model architecture for inference speed",
                    "Consider model quantization or pruning"
                ])
            elif issue["type"] == "memory":
                suggestions.extend([
                    "Implement gradient checkpointing",
                    "Reduce model size through distillation",
                    "Optimize input pipeline memory usage"
                ])
            elif issue["type"] == "accuracy":
                suggestions.extend([
                    "Increase model capacity in underperforming areas",
                    "Implement ensemble methods for better accuracy",
                    "Review and clean training data"
                ])
                
        return list(set(suggestions))  # Remove duplicates
        
    async def _analyze_performance_patterns(
        self,
        metrics: List[PerformanceMetric]
    ) -> List[Dict]:
        """Analyze patterns in performance metrics"""
        issues = []
        
        # Group metrics by type
        metrics_by_type = {}
        for metric in metrics:
            if metric.metric_type not in metrics_by_type:
                metrics_by_type[metric.metric_type] = []
            metrics_by_type[metric.metric_type].append(metric)
            
        # Analyze each metric type
        for metric_type, type_metrics in metrics_by_type.items():
            if len(type_metrics) < 10:  # Need enough data points
                continue
                
            values = [m.value for m in type_metrics]
            times = [m.timestamp for m in type_metrics]
            
            # Check for trends
            trend = self._analyze_trend(values)
            
            # Check for anomalies
            anomalies = self._detect_anomalies(values)
            
            # Check for patterns
            patterns = self._detect_patterns(values, times)
            
            if trend["direction"] == "degrading":
                issues.append({
                    "type": metric_type.value,
                    "severity": "high",
                    "description": f"Performance degradation detected in {metric_type.value}"
                })
                
            if anomalies:
                issues.append({
                    "type": metric_type.value,
                    "severity": "medium",
                    "description": f"Anomalies detected in {metric_type.value}"
                })
                
            if patterns:
                issues.append({
                    "type": metric_type.value,
                    "severity": "low",
                    "description": f"Performance patterns detected in {metric_type.value}"
                })
                
        return issues
        
    def _analyze_trend(self, values: List[float]) -> Dict:
        """Analyze trend in values"""
        if len(values) < 2:
            return {"direction": "stable", "magnitude": 0.0}
            
        # Calculate trend using linear regression
        x = np.arange(len(values))
        slope = np.polyfit(x, values, 1)[0]
        
        # Determine direction and magnitude
        if abs(slope) < 0.01:
            direction = "stable"
        elif slope > 0:
            direction = "improving"
        else:
            direction = "degrading"
            
        return {
            "direction": direction,
            "magnitude": abs(slope)
        }
        
    def _detect_anomalies(self, values: List[float]) -> List[int]:
        """Detect anomalies in values using Z-score"""
        if len(values) < 3:
            return []
            
        mean = np.mean(values)
        std = np.std(values)
        z_scores = [(x - mean) / std for x in values]
        
        return [i for i, z in enumerate(z_scores) if abs(z) > 3]
        
    def _detect_patterns(
        self,
        values: List[float],
        timestamps: List[datetime]
    ) -> List[Dict]:
        """Detect patterns in performance metrics"""
        patterns = []
        
        # Check for daily patterns
        daily_pattern = self._check_daily_pattern(values, timestamps)
        if daily_pattern:
            patterns.append({
                "type": "daily",
                "confidence": daily_pattern["confidence"],
                "description": "Daily performance pattern detected"
            })
            
        # Check for weekly patterns
        weekly_pattern = self._check_weekly_pattern(values, timestamps)
        if weekly_pattern:
            patterns.append({
                "type": "weekly",
                "confidence": weekly_pattern["confidence"],
                "description": "Weekly performance pattern detected"
            })
            
        return patterns
        
    def _check_daily_pattern(
        self,
        values: List[float],
        timestamps: List[datetime]
    ) -> Optional[Dict]:
        """Check for daily patterns in data"""
        if len(values) < 24:
            return None
            
        # Group by hour
        hourly_values = {}
        for value, timestamp in zip(values, timestamps):
            hour = timestamp.hour
            if hour not in hourly_values:
                hourly_values[hour] = []
            hourly_values[hour].append(value)
            
        # Calculate hourly means
        hourly_means = {
            hour: np.mean(vals)
            for hour, vals in hourly_values.items()
        }
        
        # Calculate variation
        overall_mean = np.mean(values)
        hourly_variation = np.std(list(hourly_means.values())) / overall_mean
        
        if hourly_variation > 0.1:  # Significant variation
            return {
                "confidence": min(1.0, hourly_variation * 5),
                "pattern": hourly_means
            }
            
        return None
        
    def _check_weekly_pattern(
        self,
        values: List[float],
        timestamps: List[datetime]
    ) -> Optional[Dict]:
        """Check for weekly patterns in data"""
        if len(values) < 7 * 24:  # Need at least a week of data
            return None
            
        # Group by day of week
        daily_values = {}
        for value, timestamp in zip(values, timestamps):
            day = timestamp.weekday()
            if day not in daily_values:
                daily_values[day] = []
            daily_values[day].append(value)
            
        # Calculate daily means
        daily_means = {
            day: np.mean(vals)
            for day, vals in daily_values.items()
        }
        
        # Calculate variation
        overall_mean = np.mean(values)
        daily_variation = np.std(list(daily_means.values())) / overall_mean
        
        if daily_variation > 0.1:  # Significant variation
            return {
                "confidence": min(1.0, daily_variation * 5),
                "pattern": daily_means
            }
            
        return None
        
    async def _should_optimize(self, model_id: str) -> bool:
        """Determine if optimization is needed"""
        if model_id not in self.model_performances:
            return False
            
        performance = self.model_performances[model_id]
        
        # Check if performance is below target
        if model_id in self.improvement_targets:
            targets = self.improvement_targets[model_id]
            current_metrics = {
                metric.metric_type: metric.value
                for metric in performance.metrics[-10:]  # Last 10 metrics
            }
            
            for metric_type, target in targets.items():
                if metric_type in current_metrics:
                    if current_metrics[metric_type] < target:
                        return True
                        
        # Check stability
        if performance.stability_score < 0.7:
            return True
            
        # Check improvement rate
        if performance.improvement_rate < 0.01:
            return True
            
        return False
        
    async def _trigger_optimization(self, model_id: str):
        """Trigger model optimization"""
        try:
            # Record optimization attempt
            self.optimization_history.append({
                "model_id": model_id,
                "timestamp": datetime.now(),
                "metrics": self.model_performances[model_id].metrics[-10:],
                "suggestions": self.model_performances[model_id].optimization_suggestions
            })
            
            # Implement optimization logic here
            pass
            
        except Exception as e:
            logging.error(f"Optimization failed for model {model_id}: {str(e)}")
            
    def get_performance_report(self, model_id: str) -> Dict:
        """Generate comprehensive performance report"""
        if model_id not in self.model_performances:
            return {"error": "No performance data available"}
            
        performance = self.model_performances[model_id]
        
        # Calculate metrics
        metrics_summary = self._calculate_metrics_summary(performance.metrics)
        
        # Generate visualizations
        visualizations = self._generate_visualizations(performance.metrics)
        
        # Analyze trends
        trends = self._analyze_trends(performance.metrics)
        
        return {
            "model_id": model_id,
            "summary": metrics_summary,
            "visualizations": visualizations,
            "trends": trends,
            "improvement_rate": performance.improvement_rate,
            "stability_score": performance.stability_score,
            "optimization_suggestions": performance.optimization_suggestions,
            "optimization_history": [
                opt for opt in self.optimization_history
                if opt["model_id"] == model_id
            ]
        }
        
    def _calculate_metrics_summary(
        self,
        metrics: List[PerformanceMetric]
    ) -> Dict:
        """Calculate summary statistics for metrics"""
        summary = {}
        metrics_by_type = {}
        
        for metric in metrics:
            if metric.metric_type not in metrics_by_type:
                metrics_by_type[metric.metric_type] = []
            metrics_by_type[metric.metric_type].append(metric.value)
            
        for metric_type, values in metrics_by_type.items():
            summary[metric_type.value] = {
                "mean": np.mean(values),
                "std": np.std(values),
                "min": np.min(values),
                "max": np.max(values),
                "latest": values[-1],
                "trend": self._analyze_trend(values)
            }
            
        return summary
        
    def _generate_visualizations(
        self,
        metrics: List[PerformanceMetric]
    ) -> Dict:
        """Generate visualization data"""
        visualizations = {}
        metrics_by_type = {}
        
        for metric in metrics:
            if metric.metric_type not in metrics_by_type:
                metrics_by_type[metric.metric_type] = []
            metrics_by_type[metric.metric_type].append({
                "timestamp": metric.timestamp.isoformat(),
                "value": metric.value
            })
            
        for metric_type, values in metrics_by_type.items():
            visualizations[metric_type.value] = {
                "type": "time_series",
                "data": values
            }
            
        return visualizations
        
    def _analyze_trends(
        self,
        metrics: List[PerformanceMetric]
    ) -> Dict:
        """Analyze performance trends"""
        trends = {}
        metrics_by_type = {}
        
        for metric in metrics:
            if metric.metric_type not in metrics_by_type:
                metrics_by_type[metric.metric_type] = []
            metrics_by_type[metric.metric_type].append(metric)
            
        for metric_type, type_metrics in metrics_by_type.items():
            values = [m.value for m in type_metrics]
            timestamps = [m.timestamp for m in type_metrics]
            
            trends[metric_type.value] = {
                "overall": self._analyze_trend(values),
                "patterns": self._detect_patterns(values, timestamps),
                "anomalies": self._detect_anomalies(values)
            }
            
        return trends 