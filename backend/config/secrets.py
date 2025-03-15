import boto3
import json
from typing import Dict, Optional
from botocore.exceptions import ClientError
import logging
from .settings import settings

logger = logging.getLogger(__name__)

class SecretsManager:
    def __init__(self, region_name: Optional[str] = None):
        """Initialize AWS Secrets Manager client"""
        self.client = boto3.client(
            'secretsmanager',
            region_name=region_name or settings.aws_region
        )
        self.secret_name = f"{settings.environment}/assignmentai/secrets"
    
    def get_secret(self) -> Dict[str, str]:
        """Retrieve secrets from AWS Secrets Manager"""
        try:
            get_secret_value_response = self.client.get_secret_value(
                SecretId=self.secret_name
            )
        except ClientError as e:
            logger.error(f"Failed to retrieve secrets: {str(e)}")
            raise
        else:
            if 'SecretString' in get_secret_value_response:
                secret = json.loads(get_secret_value_response['SecretString'])
                return secret
            else:
                raise ValueError("No secret string found in response")
    
    def update_secret(self, secret_dict: Dict[str, str]) -> bool:
        """Update secrets in AWS Secrets Manager"""
        try:
            self.client.update_secret(
                SecretId=self.secret_name,
                SecretString=json.dumps(secret_dict)
            )
            return True
        except ClientError as e:
            logger.error(f"Failed to update secrets: {str(e)}")
            return False
    
    def create_secret(self, secret_dict: Dict[str, str]) -> bool:
        """Create new secret in AWS Secrets Manager"""
        try:
            self.client.create_secret(
                Name=self.secret_name,
                SecretString=json.dumps(secret_dict),
                Description=f"Secrets for AssignmentAI {settings.environment} environment",
                Tags=[
                    {
                        'Key': 'Environment',
                        'Value': settings.environment
                    },
                    {
                        'Key': 'Application',
                        'Value': 'AssignmentAI'
                    }
                ]
            )
            return True
        except ClientError as e:
            logger.error(f"Failed to create secrets: {str(e)}")
            return False
    
    def delete_secret(self) -> bool:
        """Delete secret from AWS Secrets Manager"""
        try:
            self.client.delete_secret(
                SecretId=self.secret_name,
                ForceDeleteWithoutRecovery=True
            )
            return True
        except ClientError as e:
            logger.error(f"Failed to delete secrets: {str(e)}")
            return False
    
    def rotate_secret(self) -> bool:
        """Rotate secret values"""
        try:
            # Get current secrets
            current_secrets = self.get_secret()
            
            # Generate new values for sensitive data
            new_secrets = {
                key: self._generate_new_value(value)
                for key, value in current_secrets.items()
                if self._is_sensitive_key(key)
            }
            
            # Update with new values
            updated_secrets = {**current_secrets, **new_secrets}
            return self.update_secret(updated_secrets)
            
        except Exception as e:
            logger.error(f"Failed to rotate secrets: {str(e)}")
            return False
    
    def _is_sensitive_key(self, key: str) -> bool:
        """Check if a key contains sensitive data"""
        sensitive_keywords = {
            'password', 'secret', 'key', 'token', 'credential',
            'api_key', 'access_key', 'private_key'
        }
        return any(keyword in key.lower() for keyword in sensitive_keywords)
    
    def _generate_new_value(self, current_value: str) -> str:
        """Generate a new value for sensitive data"""
        # Implementation depends on the type of secret
        # This is a placeholder - implement proper generation based on requirements
        import secrets
        return secrets.token_urlsafe(32)

# Initialize secrets manager
secrets_manager = SecretsManager() 