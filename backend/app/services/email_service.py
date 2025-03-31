from typing import Optional
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    SMTP_HOST = "smtp.gmail.com"
    SMTP_PORT = 587
    
    @classmethod
    async def send_email(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        from_email: Optional[str] = None
    ) -> bool:
        """
        Send an email using SMTP
        """
        try:
            if not from_email:
                from_email = settings.SMTP_USERNAME
            
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = from_email
            message["To"] = to_email
            
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            async with aiosmtplib.SMTP(
                hostname=cls.SMTP_HOST,
                port=cls.SMTP_PORT,
                use_tls=True
            ) as smtp:
                await smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                await smtp.send_message(message)
            
            return True
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False
    
    @classmethod
    async def send_verification_email(cls, to_email: str, token: str) -> bool:
        """
        Send verification email
        """
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        html_content = f"""
        <h1>Welcome to AssignmentAI!</h1>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="{verification_url}">Verify Email</a></p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        """
        
        return await cls.send_email(
            to_email=to_email,
            subject="Verify your email address",
            html_content=html_content
        )
    
    @classmethod
    async def send_password_reset_email(cls, to_email: str, token: str) -> bool:
        """
        Send password reset email
        """
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        html_content = f"""
        <h1>Password Reset Request</h1>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <p><a href="{reset_url}">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 30 minutes.</p>
        """
        
        return await cls.send_email(
            to_email=to_email,
            subject="Reset your password",
            html_content=html_content
        ) 