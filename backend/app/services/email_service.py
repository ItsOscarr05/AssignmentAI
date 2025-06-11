from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from typing import List, Optional
import logging
from app.core.config import settings
from app.services.security_service import security_service
import ssl
import os
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        # Configure SSL for email
        ssl_context = None
        if settings.SMTP_SSL_ENABLED:
            ssl_context = ssl.create_default_context()
            if settings.SMTP_SSL_CERTFILE:
                ssl_context.load_cert_chain(settings.SMTP_SSL_CERTFILE, settings.SMTP_SSL_KEYFILE)
            ssl_context.check_hostname = True
            ssl_context.verify_mode = ssl.CERT_REQUIRED

        # Configure email settings
        self.conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USER,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.SMTP_FROM,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_SERVER,
            MAIL_FROM_NAME=settings.SMTP_FROM_NAME,
            MAIL_STARTTLS=settings.SMTP_STARTTLS,
            MAIL_SSL_TLS=settings.SMTP_SSL_ENABLED,
            USE_CREDENTIALS=True,
            VALIDATE_CERTS=True,
            TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates' / 'email'
        )
        
        self.fastmail = FastMail(self.conf)

    async def send_email(
        self,
        subject: str,
        recipients: List[EmailStr],
        body: str,
        template_name: Optional[str] = None,
        template_data: Optional[dict] = None
    ) -> bool:
        """Send a secure email"""
        try:
            # Sanitize email content
            subject = security_service.sanitize_text(subject)
            body = security_service.sanitize_html(body)

            # Prepare message
            message = MessageSchema(
                subject=subject,
                recipients=recipients,
                body=body,
                subtype="html"
            )

            # Send email
            await self.fastmail.send_message(message)
            logger.info(f"Email sent successfully to {recipients}")
            return True

        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False

    async def send_verification_email(self, email: EmailStr, token: str) -> bool:
        """Send verification email with secure token"""
        try:
            verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            
            return await self.send_email(
                subject="Verify your email address",
                recipients=[email],
                template_name="verification_email.html",
                template_data={
                    "verification_url": verification_url,
                    "expiry_hours": settings.EMAIL_TOKEN_EXPIRE_HOURS
                }
            )

        except Exception as e:
            logger.error(f"Error sending verification email: {str(e)}")
            return False

    async def send_password_reset_email(self, email: EmailStr, token: str) -> bool:
        """Send password reset email with secure token"""
        try:
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            
            return await self.send_email(
                subject="Reset your password",
                recipients=[email],
                template_name="password_reset_email.html",
                template_data={
                    "reset_url": reset_url,
                    "expiry_hours": settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS
                }
            )

        except Exception as e:
            logger.error(f"Error sending password reset email: {str(e)}")
            return False

    async def send_2fa_backup_codes_email(self, email: EmailStr, backup_codes: List[str]) -> bool:
        """Send 2FA backup codes via email"""
        try:
            return await self.send_email(
                subject="Your 2FA Backup Codes",
                recipients=[email],
                template_name="2fa_backup_codes_email.html",
                template_data={
                    "backup_codes": backup_codes
                }
            )

        except Exception as e:
            logger.error(f"Error sending 2FA backup codes email: {str(e)}")
            return False

    async def send_security_alert_email(
        self,
        email: EmailStr,
        alert_type: str,
        details: dict
    ) -> bool:
        """Send security alert email"""
        try:
            return await self.send_email(
                subject=f"Security Alert: {alert_type}",
                recipients=[email],
                template_name="security_alert_email.html",
                template_data={
                    "alert_type": alert_type,
                    "details": details,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

        except Exception as e:
            logger.error(f"Error sending security alert email: {str(e)}")
            return False

# Create a global email service instance
email_service = EmailService() 