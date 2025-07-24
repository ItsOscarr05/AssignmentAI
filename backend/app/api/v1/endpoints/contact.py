from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.services.email_service import email_service
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ContactFormData(BaseModel):
    name: str
    email: EmailStr
    message: str

@router.get("/test-email-config")
async def test_email_config():
    """
    Test endpoint to check email configuration
    """
    try:
        config_info = {
            "smtp_server": settings.SMTP_SERVER,
            "smtp_port": settings.SMTP_PORT,
            "smtp_user": settings.SMTP_USER,
            "smtp_from": settings.SMTP_FROM,
            "smtp_from_name": settings.SMTP_FROM_NAME,
            "smtp_starttls": settings.SMTP_STARTTLS,
            "smtp_ssl_enabled": settings.SMTP_SSL_ENABLED,
            "has_password": bool(settings.SMTP_PASSWORD),
            "password_length": len(settings.SMTP_PASSWORD) if settings.SMTP_PASSWORD else 0
        }
        
        logger.info(f"Email configuration: {config_info}")
        return {
            "status": "Email configuration loaded",
            "config": config_info,
            "note": "Check if SMTP_PASSWORD is set to a Gmail App Password"
        }
    except Exception as e:
        logger.error(f"Error checking email config: {str(e)}")
        return {"error": str(e)}

@router.post("/contact", status_code=status.HTTP_200_OK)
async def submit_contact_form(contact_data: ContactFormData):
    """
    Submit a contact form and send email to support team
    """
    try:
        # Log the attempt
        logger.info(f"Contact form submission attempt from {contact_data.email}")
        
        # Format the email content
        subject = f"New Contact Form Submission from {contact_data.name}"
        
        # Format the message with line breaks converted to HTML
        formatted_message = contact_data.message.replace('\n', '<br>')
        
        body = f"""
        <html>
        <body>
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> {contact_data.name}</p>
            <p><strong>Email:</strong> {contact_data.email}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #d32f2f; margin: 10px 0;">
                {formatted_message}
            </div>
            <hr>
            <p style="color: #666; font-size: 12px;">
                This message was sent from the AssignmentAI contact form.
            </p>
        </body>
        </html>
        """
        
        # Log email attempt
        logger.info(f"Attempting to send email to support@assignmentai.app")
        logger.info(f"Email subject: {subject}")
        
        # Send email to support team
        # Using Zoho Mail support@assignmentai.app
        success = await email_service.send_email(
            subject=subject,
            recipients=["support@assignmentai.app"],
            body=body
        )
        
        if success:
            logger.info(f"Contact form submitted successfully from {contact_data.email}")
            return {"message": "Your message has been sent successfully. We'll get back to you soon!"}
        else:
            logger.error(f"Failed to send contact form email from {contact_data.email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send message. Please try again later."
            )
            
    except Exception as e:
        logger.error(f"Error processing contact form submission: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request. Please try again later."
        ) 