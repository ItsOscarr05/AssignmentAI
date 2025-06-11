import secrets
import base64
import string
import random

def generate_secret_key(length=32):
    """Generate a secure random secret key."""
    return secrets.token_urlsafe(length)

def generate_jwt_secret(length=32):
    """Generate a secure random JWT secret."""
    return secrets.token_urlsafe(length)

def generate_redis_password(length=32):
    """Generate a secure random Redis password."""
    return secrets.token_urlsafe(length)

def generate_db_password(length=32):
    """Generate a secure random database password."""
    # Include special characters for better security
    chars = string.ascii_letters + string.digits + "!@#$%^&*()_+-=[]{}|;:,.<>?"
    return ''.join(secrets.choice(chars) for _ in range(length))

def main():
    print("Generating secure random keys for your .env file...")
    print("\nAdd these to your .env file:")
    print("\n# Security")
    print(f"SECRET_KEY={generate_secret_key()}")
    print(f"JWT_SECRET_KEY={generate_jwt_secret()}")
    print("\n# Database")
    print(f"DB_PASSWORD={generate_db_password()}")
    print("\n# Redis")
    print(f"REDIS_PASSWORD={generate_redis_password()}")
    print("\n# SMTP")
    print(f"SMTP_PASSWORD={generate_db_password()}")  # Using same generator for SMTP password

if __name__ == "__main__":
    main() 