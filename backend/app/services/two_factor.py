import pyotp
import qrcode
import io
import base64
from typing import Tuple
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.config import settings
from app.core.two_factor import TwoFactorService
from app.core.security import get_password_hash
import secrets
from app.services.auth_service import verify_password

class TwoFactorAuthService:
    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()

    @staticmethod
    def generate_qr_code(secret: str, email: str) -> str:
        """Generate QR code for the TOTP secret"""
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=email,
            issuer_name=settings.PROJECT_NAME
        )
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        # Convert QR code to base64
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

    @staticmethod
    def verify_code(secret: str, code: str) -> bool:
        """Verify a TOTP code"""
        totp = pyotp.TOTP(secret)
        return totp.verify(code)

    @staticmethod
    def setup_2fa(db: Session, user: User) -> tuple[str, str]:
        """
        Setup 2FA for a user.
        Returns (secret, qr_code)
        """
        # Generate a new secret
        secret = TwoFactorService.generate_secret()
        
        # Generate QR code
        qr_code = TwoFactorService.generate_qr_code(secret, user.email)
        
        # Store the secret temporarily (will be confirmed later)
        user.two_factor_secret = secret
        db.commit()
        
        return secret, qr_code

    @staticmethod
    def confirm_2fa(db: Session, user: User, code: str) -> bool:
        """
        Confirm 2FA setup by verifying the first code.
        """
        if not user.two_factor_secret:
            return False
            
        if not TwoFactorService.verify_code(user.two_factor_secret, code):
            return False
            
        # Enable 2FA
        user.two_factor_enabled = True
        db.commit()
        return True

    @staticmethod
    def disable_2fa(db: Session, user: User) -> None:
        """
        Disable 2FA for a user.
        """
        user.two_factor_secret = None
        user.two_factor_enabled = False
        db.commit()

    @staticmethod
    def verify_2fa(db: Session, user: User, code: str) -> bool:
        """
        Verify a 2FA code during login.
        """
        if not user.two_factor_secret or not user.two_factor_enabled:
            return False
            
        return TwoFactorService.verify_code(user.two_factor_secret, code)

    @staticmethod
    def generate_backup_codes(db: Session, user: User) -> list[str]:
        """
        Generate backup codes for 2FA recovery.
        """
        backup_codes = TwoFactorService.generate_backup_codes()
        # Hash the backup codes before storing
        hashed_codes = [get_password_hash(code) for code in backup_codes]
        # Store hashed codes in user's metadata (you'll need to add this field to the User model)
        user.backup_codes = hashed_codes
        db.commit()
        return backup_codes

    @staticmethod
    def verify_backup_code(db: Session, user: User, code: str) -> bool:
        """
        Verify a backup code for 2FA recovery.
        """
        if not user.backup_codes:
            return False
            
        # Check each backup code
        for hashed_code in user.backup_codes:
            if verify_password(code, hashed_code):
                # Remove the used backup code
                user.backup_codes.remove(hashed_code)
                db.commit()
                return True
                
        return False 