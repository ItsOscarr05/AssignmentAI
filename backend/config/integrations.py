import dataclasses
import yaml
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any, Set
from pathlib import Path
import logging
import requests
import json
import subprocess
import os
import time
import threading
import queue
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import slack
import telegram
import webhook
import prometheus_client
import grafana_api
import jenkins
import git
import docker
import kubernetes
import aws
import azure
import gcp

logger = logging.getLogger(__name__)

class IntegrationError(Exception):
    """Base exception for integration-related errors."""
    pass

class CICDError(IntegrationError):
    """Exception raised for CI/CD integration errors."""
    pass

class VCSError(IntegrationError):
    """Exception raised for version control integration errors."""
    pass

class MonitoringError(IntegrationError):
    """Exception raised for monitoring integration errors."""
    pass

@dataclass
class IntegrationConfig:
    """Configuration for external service integrations."""
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    settings: Dict[str, Any]
    ci_cd: Dict[str, Any]
    version_control: Dict[str, Any]
    monitoring: Dict[str, Any]
    notifications: Dict[str, Any]
    cloud_providers: Dict[str, Any]

class IntegrationManager:
    """Manages external service integrations."""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.config_dir = base_dir / "integrations"
        self.logs_dir = base_dir / "logs"
        
        # Create directories
        self.config_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize clients
        self.jenkins_client = None
        self.git_client = None
        self.docker_client = None
        self.k8s_client = None
        self.aws_client = None
        self.azure_client = None
        self.gcp_client = None
        self.slack_client = None
        self.telegram_client = None
        self.prometheus_client = None
        self.grafana_client = None
        
        # Setup logging
        self.logger = logging.getLogger("integrations")
        self.logger.setLevel(logging.INFO)
        
        # Load existing configurations
        self.configs = self._load_configs()
    
    def _load_configs(self) -> Dict[str, IntegrationConfig]:
        """Load all integration configurations."""
        configs = {}
        for config_file in self.config_dir.glob("*.yaml"):
            try:
                with open(config_file, "r") as f:
                    data = yaml.safe_load(f)
                    configs[data["name"]] = IntegrationConfig(**data)
            except Exception as e:
                self.logger.error(f"Error loading config {config_file}: {e}")
        return configs
    
    def create_integration_config(self, name: str, description: str, settings: Dict[str, Any]) -> IntegrationConfig:
        """Create a new integration configuration."""
        try:
            config = IntegrationConfig(
                name=name,
                description=description,
                created_at=datetime.now(),
                updated_at=datetime.now(),
                settings=settings,
                ci_cd=settings.get("ci_cd", {}),
                version_control=settings.get("version_control", {}),
                monitoring=settings.get("monitoring", {}),
                notifications=settings.get("notifications", {}),
                cloud_providers=settings.get("cloud_providers", {})
            )
            
            # Save configuration
            config_file = self.config_dir / f"{name}.yaml"
            with open(config_file, "w") as f:
                yaml.dump(dataclasses.asdict(config), f)
            
            self.configs[name] = config
            return config
        except Exception as e:
            self.logger.error(f"Error creating integration: {e}")
            raise IntegrationError(f"Failed to create integration: {e}")
    
    def get_integration_config(self, name: str) -> Optional[IntegrationConfig]:
        """Get an integration configuration by name."""
        return self.configs.get(name)
    
    def update_integration_config(self, name: str, settings: Dict[str, Any]) -> Optional[IntegrationConfig]:
        """Update an integration configuration."""
        if name not in self.configs:
            return None
        
        config = self.configs[name]
        config.settings.update(settings)
        config.ci_cd.update(settings.get("ci_cd", {}))
        config.version_control.update(settings.get("version_control", {}))
        config.monitoring.update(settings.get("monitoring", {}))
        config.notifications.update(settings.get("notifications", {}))
        config.cloud_providers.update(settings.get("cloud_providers", {}))
        config.updated_at = datetime.now()
        
        # Save updated configuration
        config_file = self.config_dir / f"{name}.yaml"
        with open(config_file, "w") as f:
            yaml.dump(dataclasses.asdict(config), f)
        
        return config
    
    def delete_integration_config(self, name: str) -> bool:
        """Delete an integration configuration."""
        if name not in self.configs:
            return False
        
        config_file = self.config_dir / f"{name}.yaml"
        if config_file.exists():
            config_file.unlink()
        
        del self.configs[name]
        return True
    
    # CI/CD Integration Methods
    def setup_jenkins(self, config: IntegrationConfig) -> bool:
        """Setup Jenkins CI/CD integration."""
        try:
            jenkins_url = config.ci_cd.get("jenkins_url")
            username = config.ci_cd.get("jenkins_username")
            password = config.ci_cd.get("jenkins_password")
            
            self.jenkins_client = jenkins.Jenkins(
                jenkins_url,
                username=username,
                password=password
            )
            
            # Test connection
            self.jenkins_client.get_whoami()
            return True
        except Exception as e:
            self.logger.error(f"Error setting up Jenkins: {e}")
            raise CICDError(f"Failed to set up Jenkins: {e}")
    
    def trigger_jenkins_build(self, job_name: str, parameters: Dict[str, Any] = None) -> Optional[str]:
        """Trigger a Jenkins build job."""
        if not self.jenkins_client:
            return None
        
        try:
            queue_item = self.jenkins_client.build_job(job_name, parameters or {})
            return queue_item
        except Exception as e:
            self.logger.error(f"Error triggering Jenkins build: {e}")
            return None
    
    def get_jenkins_build_status(self, job_name: str, build_number: int) -> Optional[Dict[str, Any]]:
        """Get status of a Jenkins build."""
        if not self.jenkins_client:
            return None
        
        try:
            build_info = self.jenkins_client.get_build_info(job_name, build_number)
            return {
                "number": build_info["number"],
                "result": build_info["result"],
                "duration": build_info["duration"],
                "url": build_info["url"],
                "timestamp": datetime.fromtimestamp(build_info["timestamp"] / 1000).isoformat()
            }
        except Exception as e:
            self.logger.error(f"Error getting Jenkins build status: {e}")
            return None
    
    # Version Control Integration Methods
    def setup_git(self, config: IntegrationConfig) -> bool:
        """Setup Git version control integration."""
        try:
            repo_url = config.version_control.get("repo_url")
            branch = config.version_control.get("branch", "main")
            credentials = config.version_control.get("credentials", {})
            
            self.git_client = git.Repo.clone_from(
                repo_url,
                self.base_dir / "repo",
                branch=branch,
                **credentials
            )
            return True
        except Exception as e:
            self.logger.error(f"Error setting up Git: {e}")
            raise VCSError(f"Failed to set up Git: {e}")
    
    def commit_changes(self, message: str, files: List[str] = None) -> bool:
        """Commit changes to Git repository."""
        if not self.git_client:
            return False
        
        try:
            if files:
                self.git_client.index.add(files)
            else:
                self.git_client.index.add("*")
            
            self.git_client.index.commit(message)
            return True
        except Exception as e:
            self.logger.error(f"Error committing changes: {e}")
            return False
    
    def push_changes(self) -> bool:
        """Push changes to remote Git repository."""
        if not self.git_client:
            return False
        
        try:
            self.git_client.remote().push()
            return True
        except Exception as e:
            self.logger.error(f"Error pushing changes: {e}")
            return False
    
    # Monitoring Integration Methods
    def setup_prometheus(self, config: IntegrationConfig) -> bool:
        """Setup Prometheus monitoring integration."""
        try:
            prometheus_url = config.monitoring.get("prometheus_url")
            self.prometheus_client = prometheus_client.PrometheusClient(prometheus_url)
            return True
        except Exception as e:
            self.logger.error(f"Error setting up Prometheus: {e}")
            raise MonitoringError(f"Failed to set up Prometheus: {e}")
    
    def setup_grafana(self, config: IntegrationConfig) -> bool:
        """Setup Grafana monitoring integration."""
        try:
            grafana_url = config.monitoring.get("grafana_url")
            api_key = config.monitoring.get("grafana_api_key")
            self.grafana_client = grafana_api.GrafanaAPI(grafana_url, api_key)
            return True
        except Exception as e:
            self.logger.error(f"Error setting up Grafana: {e}")
            return False
    
    def record_metric(self, name: str, value: float, labels: Dict[str, str] = None) -> None:
        """Record a metric in Prometheus."""
        if not self.prometheus_client:
            return
        
        try:
            self.prometheus_client.gauge(name, labels or {}).set(value)
        except Exception as e:
            self.logger.error(f"Error recording metric: {e}")
    
    def create_grafana_dashboard(self, dashboard: Dict[str, Any]) -> Optional[str]:
        """Create a Grafana dashboard."""
        if not self.grafana_client:
            return None
        
        try:
            response = self.grafana_client.dashboard.create_dashboard(dashboard)
            return response["uid"]
        except Exception as e:
            self.logger.error(f"Error creating Grafana dashboard: {e}")
            return None
    
    # Notification Integration Methods
    def setup_slack(self, config: IntegrationConfig) -> bool:
        """Setup Slack notification integration."""
        try:
            token = config.notifications.get("slack_token")
            channel = config.notifications.get("slack_channel")
            self.slack_client = slack.WebClient(token=token)
            self.slack_channel = channel
            return True
        except Exception as e:
            self.logger.error(f"Error setting up Slack: {e}")
            return False
    
    def setup_telegram(self, config: IntegrationConfig) -> bool:
        """Setup Telegram notification integration."""
        try:
            token = config.notifications.get("telegram_token")
            chat_id = config.notifications.get("telegram_chat_id")
            self.telegram_client = telegram.Bot(token=token)
            self.telegram_chat_id = chat_id
            return True
        except Exception as e:
            self.logger.error(f"Error setting up Telegram: {e}")
            return False
    
    def send_slack_message(self, message: str) -> bool:
        """Send a message to Slack."""
        if not self.slack_client or not self.slack_channel:
            return False
        
        try:
            self.slack_client.chat_postMessage(
                channel=self.slack_channel,
                text=message
            )
            return True
        except Exception as e:
            self.logger.error(f"Error sending Slack message: {e}")
            return False
    
    def send_telegram_message(self, message: str) -> bool:
        """Send a message to Telegram."""
        if not self.telegram_client or not self.telegram_chat_id:
            return False
        
        try:
            self.telegram_client.send_message(
                chat_id=self.telegram_chat_id,
                text=message
            )
            return True
        except Exception as e:
            self.logger.error(f"Error sending Telegram message: {e}")
            return False
    
    def send_email(self, config: IntegrationConfig, to: str, subject: str, body: str) -> bool:
        """Send an email notification."""
        try:
            smtp_server = config.notifications.get("smtp_server")
            smtp_port = config.notifications.get("smtp_port", 587)
            username = config.notifications.get("smtp_username")
            password = config.notifications.get("smtp_password")
            
            msg = MIMEMultipart()
            msg["From"] = username
            msg["To"] = to
            msg["Subject"] = subject
            
            msg.attach(MIMEText(body, "plain"))
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(username, password)
                server.send_message(msg)
            
            return True
        except Exception as e:
            self.logger.error(f"Error sending email: {e}")
            return False
    
    # Cloud Provider Integration Methods
    def setup_aws(self, config: IntegrationConfig) -> bool:
        """Setup AWS cloud provider integration."""
        try:
            access_key = config.cloud_providers.get("aws_access_key")
            secret_key = config.cloud_providers.get("aws_secret_key")
            region = config.cloud_providers.get("aws_region")
            
            self.aws_client = aws.Session(
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name=region
            )
            return True
        except Exception as e:
            self.logger.error(f"Error setting up AWS: {e}")
            return False
    
    def setup_azure(self, config: IntegrationConfig) -> bool:
        """Setup Azure cloud provider integration."""
        try:
            subscription_id = config.cloud_providers.get("azure_subscription_id")
            tenant_id = config.cloud_providers.get("azure_tenant_id")
            client_id = config.cloud_providers.get("azure_client_id")
            client_secret = config.cloud_providers.get("azure_client_secret")
            
            self.azure_client = azure.Client(
                subscription_id=subscription_id,
                tenant_id=tenant_id,
                client_id=client_id,
                client_secret=client_secret
            )
            return True
        except Exception as e:
            self.logger.error(f"Error setting up Azure: {e}")
            return False
    
    def setup_gcp(self, config: IntegrationConfig) -> bool:
        """Setup Google Cloud Platform integration."""
        try:
            project_id = config.cloud_providers.get("gcp_project_id")
            credentials = config.cloud_providers.get("gcp_credentials")
            
            self.gcp_client = gcp.Client(
                project=project_id,
                credentials=credentials
            )
            return True
        except Exception as e:
            self.logger.error(f"Error setting up GCP: {e}")
            return False
    
    def deploy_to_aws(self, service_name: str, config: Dict[str, Any]) -> bool:
        """Deploy a service to AWS."""
        if not self.aws_client:
            return False
        
        try:
            # Implementation depends on the specific AWS service
            # This is a placeholder for ECS deployment
            ecs = self.aws_client.client("ecs")
            ecs.create_service(
                cluster=config.get("cluster"),
                serviceName=service_name,
                taskDefinition=config.get("task_definition"),
                desiredCount=config.get("desired_count", 1)
            )
            return True
        except Exception as e:
            self.logger.error(f"Error deploying to AWS: {e}")
            return False
    
    def deploy_to_azure(self, service_name: str, config: Dict[str, Any]) -> bool:
        """Deploy a service to Azure."""
        if not self.azure_client:
            return False
        
        try:
            # Implementation depends on the specific Azure service
            # This is a placeholder for App Service deployment
            web_app = self.azure_client.web_apps
            web_app.create_or_update(
                resource_group_name=config.get("resource_group"),
                name=service_name,
                site_config=config.get("site_config")
            )
            return True
        except Exception as e:
            self.logger.error(f"Error deploying to Azure: {e}")
            return False
    
    def deploy_to_gcp(self, service_name: str, config: Dict[str, Any]) -> bool:
        """Deploy a service to Google Cloud Platform."""
        if not self.gcp_client:
            return False
        
        try:
            # Implementation depends on the specific GCP service
            # This is a placeholder for Cloud Run deployment
            cloud_run = self.gcp_client.cloud_run
            cloud_run.services.create(
                parent=f"projects/{self.gcp_client.project}/locations/{config.get('region')}",
                serviceId=service_name,
                service=config.get("service_config")
            )
            return True
        except Exception as e:
            self.logger.error(f"Error deploying to GCP: {e}")
            return False
    
    def export_integration_config(self, name: str, format: str = "yaml") -> Optional[str]:
        """Export an integration configuration."""
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
    
    def import_integration_config(self, name: str, data: str, format: str = "yaml") -> Optional[IntegrationConfig]:
        """Import an integration configuration."""
        try:
            if format == "yaml":
                config_data = yaml.safe_load(data)
            elif format == "json":
                config_data = json.loads(data)
            else:
                raise ValueError(f"Unsupported format: {format}")
            
            config = IntegrationConfig(**config_data)
            
            # Save configuration
            config_file = self.config_dir / f"{name}.yaml"
            with open(config_file, "w") as f:
                yaml.dump(dataclasses.asdict(config), f)
            
            self.configs[name] = config
            return config
        except Exception as e:
            self.logger.error(f"Error importing config: {e}")
            return None 