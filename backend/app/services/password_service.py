import hashlib
import requests
from typing import Tuple, Optional
from app.core.config import settings
import re

class PasswordService:
    def __init__(self):
        self.min_length = 12
        self.require_uppercase = True
        self.require_lowercase = True
        self.require_numbers = True
        self.require_special = True
        self.haveibeenpwned_api_key = settings.HAVEIBEENPWNED_API_KEY

    def check_password_strength(self, password: str) -> Tuple[bool, str]:
        """
        Check password strength and return (is_valid, message)
        """
        if len(password) < self.min_length:
            return False, f"Password must be at least {self.min_length} characters long"

        if self.require_uppercase and not re.search(r"[A-Z]", password):
            return False, "Password must contain at least one uppercase letter"

        if self.require_lowercase and not re.search(r"[a-z]", password):
            return False, "Password must contain at least one lowercase letter"

        if self.require_numbers and not re.search(r"\d", password):
            return False, "Password must contain at least one number"

        if self.require_special and not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False, "Password must contain at least one special character"

        return True, "Password meets requirements"

    async def check_password_breach(self, password: str) -> Tuple[bool, Optional[str]]:
        """
        Check if password has been exposed in data breaches using HaveIBeenPwned API
        Returns (is_safe, message)
        """
        # Generate SHA-1 hash of password
        sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]

        try:
            # Check password against HaveIBeenPwned API
            headers = {
                "hibp-api-key": self.haveibeenpwned_api_key,
                "user-agent": "AssignmentAI-PasswordCheck"
            }
            
            response = requests.get(
                f"https://api.pwnedpasswords.com/range/{prefix}",
                headers=headers
            )
            
            if response.status_code == 200:
                # Check if password hash suffix exists in response
                hashes = response.text.splitlines()
                for hash_count in hashes:
                    hash_suffix, count = hash_count.split(":")
                    if hash_suffix == suffix:
                        return False, f"Password has been exposed in {count} data breaches"
            
            return True, "Password has not been exposed in known data breaches"
            
        except Exception as e:
            # Log the error but don't block password usage
            return True, "Unable to check password breach status"

    def calculate_password_strength_score(self, password: str) -> int:
        """
        Calculate password strength score (0-4)
        """
        score = 0
        
        # Length
        if len(password) >= 12:
            score += 1
        
        # Character types
        if re.search(r"[A-Z]", password):
            score += 1
        if re.search(r"[a-z]", password):
            score += 1
        if re.search(r"\d", password):
            score += 1
        if re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            score += 1
        
        # Complexity
        if len(set(password)) > len(password) * 0.7:  # At least 70% unique characters
            score += 1
        
        return min(score, 4)  # Cap at 4

# Create a global password service instance
password_service = PasswordService() 