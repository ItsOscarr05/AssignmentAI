import pyotp
import qrcode
from io import BytesIO
import base64
from typing import Optional, Tuple
from app.core.config import settings

class TwoFactorService:
    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret"""
        return pyotp.random_base32()

    @staticmethod
    def generate_qr_code(secret: str, email: str) -> str:
        """Generate a QR code for the TOTP secret"""
        # Create TOTP URI
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

        # Convert to base64
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

    @staticmethod
    def verify_code(secret: str, code: str) -> bool:
        """Verify a TOTP code"""
        totp = pyotp.TOTP(secret)
        return totp.verify(code)

    @staticmethod
    def generate_backup_codes(count: int = 8) -> list[str]:
        """Generate backup codes for 2FA recovery"""
        return [pyotp.random_base32()[:8] for _ in range(count)]

    @staticmethod
    def verify_backup_code(backup_codes: list[str], code: str) -> Tuple[bool, list[str]]:
        """Verify a backup code and return updated backup codes list"""
        if code in backup_codes:
            # Remove used backup code
            backup_codes.remove(code)
            return True, backup_codes
        return False, backup_codes

    @staticmethod
    def is_valid_code_format(code: str) -> bool:
        """Validate the format of a 2FA code"""
        return code.isdigit() and len(code) == 6 