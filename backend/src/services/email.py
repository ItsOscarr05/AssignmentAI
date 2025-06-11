from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import List
import os
from dotenv import load_dotenv
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

load_dotenv()

# Email configuration
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "test@example.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "test_password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "test@example.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.example.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "AssignmentAI"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    TEMPLATE_FOLDER=Path(__file__).parent.parent / 'templates'
)

# Initialize Jinja2 environment
template_env = Environment(
    loader=FileSystemLoader(Path(__file__).parent.parent / 'templates')
)

async def send_email(
    email_to: str,
    subject: str,
    template_name: str,
    template_data: dict
) -> None:
    """Send an email using a template"""
    # Render template
    template = template_env.get_template(f"{template_name}.html")
    html_content = template.render(**template_data)
    
    # Create message
    message = MessageSchema(
        subject=subject,
        recipients=[email_to],
        body=html_content,
        subtype="html"
    )
    
    # Send email
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_password_reset_email(email: str, reset_token: str) -> None:
    """Send password reset email"""
    reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}&email={email}"
    
    await send_email(
        email_to=email,
        subject="Reset Your AssignmentAI Password",
        template_name="password_reset",
        template_data={
            "reset_url": reset_url,
            "expiry_minutes": 30
        }
    )

async def send_verification_email(email: str, verification_token: str) -> None:
    """Send email verification email"""
    verification_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}&email={email}"
    
    await send_email(
        email_to=email,
        subject="Verify Your AssignmentAI Email",
        template_name="email_verification",
        template_data={
            "verification_url": verification_url
        }
    ) 