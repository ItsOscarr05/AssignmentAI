import dataclasses
import yaml
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Set
from pathlib import Path
import logging
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import sqlite3
import csv
import xlsxwriter
from jinja2 import Template
import pdfkit
import webbrowser
import os
import time
import threading
import queue
from collections import defaultdict

logger = logging.getLogger(__name__)

class AnalyticsError(Exception):
    """Base exception for analytics-related errors."""
    pass

class MetricError(AnalyticsError):
    """Exception raised for metric-related errors."""
    pass

class ReportError(AnalyticsError):
    """Exception raised for report generation errors."""
    pass

class AlertError(AnalyticsError):
    """Exception raised for alert-related errors."""
    pass

@dataclass
class AnalyticsConfig:
    """Configuration for analytics and reporting."""
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    settings: Dict[str, Any]
    metrics: Dict[str, Any]
    reports: Dict[str, Any]
    alerts: Dict[str, Any]
    dashboards: Dict[str, Any]

class AnalyticsManager:
    """Manages analytics and reporting configurations."""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.config_dir = base_dir / "analytics"
        self.data_dir = base_dir / "data"
        self.reports_dir = base_dir / "reports"
        self.dashboards_dir = base_dir / "dashboards"
        
        # Create directories
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.dashboards_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize database
        self.db_path = self.data_dir / "analytics.db"
        self._init_database()
        
        # Initialize data structures
        self.metrics_data = defaultdict(list)
        self.report_templates = {}
        self.dashboard_configs = {}
        self.alert_rules = {}
        
        # Setup logging
        self.logger = logging.getLogger("analytics")
        self.logger.setLevel(logging.INFO)
        
        # Load existing configurations
        self.configs = self._load_configs()
    
    def _init_database(self):
        """Initialize SQLite database for analytics data."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create metrics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                value REAL NOT NULL,
                timestamp DATETIME NOT NULL,
                labels TEXT,
                metadata TEXT
            )
        """)
        
        # Create events table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                description TEXT,
                timestamp DATETIME NOT NULL,
                metadata TEXT
            )
        """)
        
        # Create alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                rule_name TEXT NOT NULL,
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                status TEXT NOT NULL,
                metadata TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    def _load_configs(self) -> Dict[str, AnalyticsConfig]:
        """Load all analytics configurations."""
        configs = {}
        for config_file in self.config_dir.glob("*.yaml"):
            try:
                with open(config_file, "r") as f:
                    data = yaml.safe_load(f)
                    configs[data["name"]] = AnalyticsConfig(**data)
            except Exception as e:
                self.logger.error(f"Error loading config {config_file}: {e}")
        return configs
    
    def create_analytics_config(self, name: str, description: str, settings: Dict[str, Any]) -> AnalyticsConfig:
        """
        Create a new analytics configuration.

        Args:
            name: Name of the analytics configuration
            description: Description of the analytics configuration
            settings: Dictionary of analytics settings

        Returns:
            AnalyticsConfig object

        Raises:
            AnalyticsError: If analytics configuration creation fails
        """
        try:
            config = AnalyticsConfig(
                name=name,
                description=description,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                settings=settings,
                metrics=settings.get("metrics", {}),
                reports=settings.get("reports", {}),
                alerts=settings.get("alerts", {}),
                dashboards=settings.get("dashboards", {})
            )
            self._save_config(config)
            return config
        except Exception as e:
            self.logger.error(f"Error creating analytics config: {e}")
            raise AnalyticsError(f"Failed to create analytics config: {e}")
    
    def get_analytics_config(self, name: str) -> Optional[AnalyticsConfig]:
        """Get an analytics configuration by name."""
        return self.configs.get(name)
    
    def update_analytics_config(self, name: str, settings: Dict[str, Any]) -> Optional[AnalyticsConfig]:
        """Update an analytics configuration."""
        if name not in self.configs:
            return None
        
        config = self.configs[name]
        config.settings.update(settings)
        config.metrics.update(settings.get("metrics", {}))
        config.reports.update(settings.get("reports", {}))
        config.dashboards.update(settings.get("dashboards", {}))
        config.alerts.update(settings.get("alerts", {}))
        config.updated_at = datetime.now()
        
        # Save updated configuration
        config_file = self.config_dir / f"{name}.yaml"
        with open(config_file, "w") as f:
            yaml.dump(dataclasses.asdict(config), f)
        
        return config
    
    def delete_analytics_config(self, name: str) -> bool:
        """Delete an analytics configuration."""
        if name not in self.configs:
            return False
        
        config_file = self.config_dir / f"{name}.yaml"
        if config_file.exists():
            config_file.unlink()
        
        del self.configs[name]
        return True
    
    # Metrics Collection and Analysis
    def record_metric(self, name: str, value: float, labels: Dict[str, str] = None, metadata: Dict[str, Any] = None) -> None:
        """
        Record a metric value.

        Args:
            name: Name of the metric
            value: Value to record
            labels: Optional dictionary of tags
            metadata: Optional dictionary of additional metadata

        Raises:
            MetricError: If metric recording fails
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO metrics (name, value, timestamp, labels, metadata)
                VALUES (?, ?, ?, ?, ?)
            """, (
                name,
                value,
                datetime.now().isoformat(),
                json.dumps(labels) if labels else None,
                json.dumps(metadata) if metadata else None
            ))
            conn.commit()
        except Exception as e:
            self.logger.error(f"Error recording metric: {e}")
            raise MetricError(f"Failed to record metric: {e}")
        finally:
            conn.close()
    
    def record_event(self, event_type: str, description: str, metadata: Dict[str, Any] = None) -> None:
        """Record an event in the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO events (type, description, timestamp, metadata)
                VALUES (?, ?, ?, ?)
            """, (
                event_type,
                description,
                datetime.now().isoformat(),
                json.dumps(metadata) if metadata else None
            ))
            conn.commit()
        except Exception as e:
            self.logger.error(f"Error recording event: {e}")
        finally:
            conn.close()
    
    def get_metrics(self, name: str, start_time: datetime = None, end_time: datetime = None) -> pd.DataFrame:
        """Retrieve metrics data as a pandas DataFrame."""
        conn = sqlite3.connect(self.db_path)
        
        query = "SELECT * FROM metrics WHERE name = ?"
        params = [name]
        
        if start_time:
            query += " AND timestamp >= ?"
            params.append(start_time.isoformat())
        if end_time:
            query += " AND timestamp <= ?"
            params.append(end_time.isoformat())
        
        try:
            df = pd.read_sql_query(query, conn, params=params)
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df["labels"] = df["labels"].apply(lambda x: json.loads(x) if x else {})
            df["metadata"] = df["metadata"].apply(lambda x: json.loads(x) if x else {})
            return df
        except Exception as e:
            self.logger.error(f"Error retrieving metrics: {e}")
            return pd.DataFrame()
        finally:
            conn.close()
    
    def get_events(self, event_type: str = None, start_time: datetime = None, end_time: datetime = None) -> pd.DataFrame:
        """Retrieve events data as a pandas DataFrame."""
        conn = sqlite3.connect(self.db_path)
        
        query = "SELECT * FROM events"
        params = []
        
        if event_type:
            query += " WHERE type = ?"
            params.append(event_type)
        
        if start_time:
            query += " AND timestamp >= ?" if event_type else " WHERE timestamp >= ?"
            params.append(start_time.isoformat())
        if end_time:
            query += " AND timestamp <= ?"
            params.append(end_time.isoformat())
        
        try:
            df = pd.read_sql_query(query, conn, params=params)
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df["metadata"] = df["metadata"].apply(lambda x: json.loads(x) if x else {})
            return df
        except Exception as e:
            self.logger.error(f"Error retrieving events: {e}")
            return pd.DataFrame()
        finally:
            conn.close()
    
    def calculate_statistics(self, name: str, start_time: datetime = None, end_time: datetime = None) -> Dict[str, float]:
        """Calculate statistical measures for a metric."""
        df = self.get_metrics(name, start_time, end_time)
        
        if df.empty:
            return {}
        
        return {
            "count": len(df),
            "mean": df["value"].mean(),
            "median": df["value"].median(),
            "std": df["value"].std(),
            "min": df["value"].min(),
            "max": df["value"].max(),
            "q1": df["value"].quantile(0.25),
            "q3": df["value"].quantile(0.75)
        }
    
    def detect_anomalies(self, name: str, threshold: float = 2.0, start_time: datetime = None, end_time: datetime = None) -> pd.DataFrame:
        """Detect anomalies in metric data using z-score method."""
        df = self.get_metrics(name, start_time, end_time)
        
        if df.empty:
            return pd.DataFrame()
        
        z_scores = np.abs(stats.zscore(df["value"]))
        anomalies = df[z_scores > threshold].copy()
        anomalies["z_score"] = z_scores[z_scores > threshold]
        
        return anomalies
    
    # Report Generation
    def create_report_template(self, name: str, template: str) -> None:
        """Create a new report template."""
        self.report_templates[name] = Template(template)
    
    def generate_report(self, template_name: str, data: Dict[str, Any], format: str = "pdf") -> Optional[str]:
        """
        Generate an analytics report.

        Args:
            template_name: Name of the report template
            data: Dictionary of data to pass to the template
            format: Format of the report (pdf or html)

        Returns:
            Path to the generated report or None if generation fails

        Raises:
            ReportError: If report generation fails
        """
        try:
            if template_name not in self.report_templates:
                return None
            
            # Render template
            html_content = self.report_templates[template_name].render(**data)
            
            # Save HTML
            html_path = self.reports_dir / f"{template_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            with open(html_path, "w") as f:
                f.write(html_content)
            
            # Convert to PDF if requested
            if format == "pdf":
                pdf_path = html_path.with_suffix(".pdf")
                pdfkit.from_file(str(html_path), str(pdf_path))
                return str(pdf_path)
            
            return str(html_path)
        except Exception as e:
            self.logger.error(f"Error generating report: {e}")
            raise ReportError(f"Failed to generate report: {e}")
    
    def export_data(self, format: str = "csv", metrics: List[str] = None, start_time: datetime = None, end_time: datetime = None) -> Optional[str]:
        """Export analytics data in various formats."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            if format == "csv":
                file_path = self.reports_dir / f"analytics_{timestamp}.csv"
                with open(file_path, "w", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow(["name", "value", "timestamp", "labels", "metadata"])
                    
                    for metric in metrics or self.metrics_data.keys():
                        df = self.get_metrics(metric, start_time, end_time)
                        for _, row in df.iterrows():
                            writer.writerow([
                                metric,
                                row["value"],
                                row["timestamp"],
                                json.dumps(row["labels"]),
                                json.dumps(row["metadata"])
                            ])
            
            elif format == "excel":
                file_path = self.reports_dir / f"analytics_{timestamp}.xlsx"
                with pd.ExcelWriter(file_path, engine="xlsxwriter") as writer:
                    for metric in metrics or self.metrics_data.keys():
                        df = self.get_metrics(metric, start_time, end_time)
                        df.to_excel(writer, sheet_name=metric, index=False)
            
            return str(file_path)
        except Exception as e:
            self.logger.error(f"Error exporting data: {e}")
            return None
    
    # Dashboard Creation
    def create_dashboard(self, name: str, layout: Dict[str, Any]) -> None:
        """Create a new dashboard configuration."""
        self.dashboard_configs[name] = layout
    
    def generate_dashboard(self, name: str) -> Optional[str]:
        """Generate an interactive dashboard using Dash."""
        if name not in self.dashboard_configs:
            return None
        
        try:
            app = dash.Dash(__name__)
            layout = self.dashboard_configs[name]
            
            # Create dashboard layout
            app.layout = html.Div([
                html.H1(f"Analytics Dashboard: {name}"),
                dcc.Graph(id="main-graph"),
                dcc.Interval(
                    id="interval-component",
                    interval=5 * 60 * 1000,  # 5 minutes
                    n_intervals=0
                )
            ])
            
            @app.callback(
                Output("main-graph", "figure"),
                Input("interval-component", "n_intervals")
            )
            def update_graph(n):
                # Generate plotly figure based on layout configuration
                fig = go.Figure()
                
                for plot in layout.get("plots", []):
                    df = self.get_metrics(
                        plot["metric"],
                        start_time=datetime.now() - timedelta(hours=plot.get("hours", 24))
                    )
                    
                    fig.add_trace(go.Scatter(
                        x=df["timestamp"],
                        y=df["value"],
                        name=plot["metric"],
                        mode=plot.get("mode", "lines")
                    ))
                
                fig.update_layout(
                    title=layout.get("title", "Analytics Dashboard"),
                    xaxis_title="Time",
                    yaxis_title="Value",
                    showlegend=True
                )
                
                return fig
            
            # Save dashboard
            dashboard_path = self.dashboards_dir / f"{name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
            app.run_server(debug=False, port=8050)
            
            return str(dashboard_path)
        except Exception as e:
            self.logger.error(f"Error generating dashboard: {e}")
            return None
    
    # Alert Management
    def create_alert_rule(self, name: str, rule: Dict[str, Any]) -> None:
        """Create a new alert rule."""
        self.alert_rules[name] = rule
    
    def check_alerts(self) -> List[Dict[str, Any]]:
        """Check all alert rules and generate alerts if conditions are met."""
        alerts = []
        
        for name, rule in self.alert_rules.items():
            try:
                df = self.get_metrics(
                    rule["metric"],
                    start_time=datetime.now() - timedelta(hours=rule.get("window_hours", 24))
                )
                
                if df.empty:
                    continue
                
                # Check conditions
                if rule["condition"] == "threshold":
                    if rule["operator"] == ">":
                        triggered = df["value"].iloc[-1] > rule["threshold"]
                    elif rule["operator"] == "<":
                        triggered = df["value"].iloc[-1] < rule["threshold"]
                    elif rule["operator"] == "==":
                        triggered = df["value"].iloc[-1] == rule["threshold"]
                
                elif rule["condition"] == "anomaly":
                    anomalies = self.detect_anomalies(rule["metric"], rule.get("threshold", 2.0))
                    triggered = not anomalies.empty
                
                if triggered:
                    alert = {
                        "rule_name": name,
                        "severity": rule["severity"],
                        "message": rule["message"],
                        "timestamp": datetime.now(),
                        "status": "active",
                        "metadata": {
                            "metric": rule["metric"],
                            "value": df["value"].iloc[-1],
                            "threshold": rule.get("threshold")
                        }
                    }
                    
                    # Record alert
                    conn = sqlite3.connect(self.db_path)
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO alerts (rule_name, severity, message, timestamp, status, metadata)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        alert["rule_name"],
                        alert["severity"],
                        alert["message"],
                        alert["timestamp"].isoformat(),
                        alert["status"],
                        json.dumps(alert["metadata"])
                    ))
                    conn.commit()
                    conn.close()
                    
                    alerts.append(alert)
            
            except Exception as e:
                self.logger.error(f"Error checking alert rule {name}: {e}")
        
        return alerts
    
    def get_alerts(self, status: str = None, severity: str = None, start_time: datetime = None, end_time: datetime = None) -> pd.DataFrame:
        """Retrieve alerts from the database."""
        conn = sqlite3.connect(self.db_path)
        
        query = "SELECT * FROM alerts"
        params = []
        conditions = []
        
        if status:
            conditions.append("status = ?")
            params.append(status)
        if severity:
            conditions.append("severity = ?")
            params.append(severity)
        if start_time:
            conditions.append("timestamp >= ?")
            params.append(start_time.isoformat())
        if end_time:
            conditions.append("timestamp <= ?")
            params.append(end_time.isoformat())
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        try:
            df = pd.read_sql_query(query, conn, params=params)
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df["metadata"] = df["metadata"].apply(lambda x: json.loads(x) if x else {})
            return df
        except Exception as e:
            self.logger.error(f"Error retrieving alerts: {e}")
            return pd.DataFrame()
        finally:
            conn.close()
    
    def update_alert_status(self, alert_id: int, status: str) -> bool:
        """Update the status of an alert."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                UPDATE alerts
                SET status = ?
                WHERE id = ?
            """, (status, alert_id))
            conn.commit()
            return True
        except Exception as e:
            self.logger.error(f"Error updating alert status: {e}")
            return False
        finally:
            conn.close()
    
    def export_analytics_config(self, name: str, format: str = "yaml") -> Optional[str]:
        """Export an analytics configuration."""
        if name not in self.configs:
            return None
        
        config = self.configs[name]
        data = dataclasses.asdict(config)
        
        if format == "yaml":
            return yaml.dump(data)
        elif format == "json":
            return json.dumps(data, indent=2)
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    def import_analytics_config(self, name: str, data: str, format: str = "yaml") -> Optional[AnalyticsConfig]:
        """Import an analytics configuration."""
        try:
            if format == "yaml":
                config_data = yaml.safe_load(data)
            elif format == "json":
                config_data = json.loads(data)
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            config = AnalyticsConfig(**config_data)
            
            # Save configuration
            config_file = self.config_dir / f"{name}.yaml"
            with open(config_file, "w") as f:
                yaml.dump(dataclasses.asdict(config), f)
            
            self.configs[name] = config
            return config
        except Exception as e:
            self.logger.error(f"Error importing config: {e}")
            return None

    def _save_config(self, config: AnalyticsConfig) -> None:
        """
        Save analytics configuration to file.

        Args:
            config: AnalyticsConfig object to save

        Raises:
            AnalyticsError: If configuration save fails
        """
        try:
            # Implementation
            pass
        except Exception as e:
            self.logger.error(f"Error saving analytics config: {e}")
            raise AnalyticsError(f"Failed to save analytics config: {e}") 