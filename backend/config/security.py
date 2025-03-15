import shutil
from typing import Dict, List, Optional, Any
from pathlib import Path
import yaml
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import os
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64
import jwt
import secrets
import hashlib
import hmac
import time

logger = logging.getLogger(__name__)

class SecurityError(Exception):
    """Base exception for security-related errors."""
    pass

class EncryptionError(SecurityError):
    """Exception raised for encryption/decryption errors."""
    pass

class TokenError(SecurityError):
    """Exception raised for token-related errors."""
    pass

@dataclass
class SecurityConfig:
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
    settings: Dict[str, Any]
    audit_logging: bool
    encryption_enabled: bool
    access_control: Dict[str, List[str]]
    rate_limiting: Dict[str, int]
    key_rotation_days: int = 30
    mfa_enabled: bool = False
    session_timeout_minutes: int = 30
    password_policy: Dict[str, Any] = None
    ip_whitelist: List[str] = None
    ip_blacklist: List[str] = None
    ssl_config: Dict[str, Any] = None
    quantum_safe: bool = False
    post_quantum_algorithm: str = None
    hybrid_scheme: bool = False

class SecurityManager:
    def __init__(self, config_dir: Path):
        self.config_dir = config_dir
        self.security_dir = config_dir / "security"
        self.security_dir.mkdir(parents=True, exist_ok=True)
        self.keys_dir = self.security_dir / "keys"
        self.keys_dir.mkdir(parents=True, exist_ok=True)
        self.audit_dir = self.security_dir / "audit"
        self.audit_dir.mkdir(parents=True, exist_ok=True)
        self._setup_logging()
        self._load_keys()

    def _setup_logging(self):
        """Setup audit logging"""
        self.logger = logging.getLogger("security")
        self.logger.setLevel(logging.INFO)
        
        audit_file = self.audit_dir / "audit.log"
        handler = logging.FileHandler(audit_file)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(levelname)s - %(message)s"
            )
        )
        self.logger.addHandler(handler)

    def _load_keys(self):
        """Load or generate encryption keys"""
        self._load_symmetric_key()
        self._load_asymmetric_keys()
        self._load_hmac_key()

    def _load_symmetric_key(self):
        """Load or generate symmetric key"""
        key_file = self.keys_dir / "symmetric.key"
        if key_file.exists():
            with open(key_file, "rb") as f:
                self.symmetric_key = f.read()
        else:
            self.symmetric_key = Fernet.generate_key()
            with open(key_file, "wb") as f:
                f.write(self.symmetric_key)
        self.cipher_suite = Fernet(self.symmetric_key)

    def _load_asymmetric_keys(self):
        """Load or generate asymmetric keys"""
        private_key_file = self.keys_dir / "private.pem"
        public_key_file = self.keys_dir / "public.pem"
        
        if private_key_file.exists() and public_key_file.exists():
            with open(private_key_file, "rb") as f:
                self.private_key = serialization.load_pem_private_key(
                    f.read(),
                    password=None,
                    backend=default_backend()
                )
            with open(public_key_file, "rb") as f:
                self.public_key = serialization.load_pem_public_key(
                    f.read(),
                    backend=default_backend()
                )
        else:
            self.private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            self.public_key = self.private_key.public_key()
            
            with open(private_key_file, "wb") as f:
                f.write(self.private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                ))
            with open(public_key_file, "wb") as f:
                f.write(self.public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ))

    def _load_hmac_key(self):
        """Load or generate HMAC key"""
        key_file = self.keys_dir / "hmac.key"
        if key_file.exists():
            with open(key_file, "rb") as f:
                self.hmac_key = f.read()
        else:
            self.hmac_key = secrets.token_bytes(32)
            with open(key_file, "wb") as f:
                f.write(self.hmac_key)

    def create_security_config(self, config: SecurityConfig) -> Path:
        """Create a new security configuration"""
        config_dir = self.security_dir / config.name
        config_dir.mkdir(exist_ok=True)
        
        # Save configuration
        config_file = config_dir / "config.yaml"
        config_data = {
            "name": config.name,
            "description": config.description,
            "created_at": config.created_at.isoformat(),
            "updated_at": config.updated_at.isoformat(),
            "settings": config.settings,
            "audit_logging": config.audit_logging,
            "encryption_enabled": config.encryption_enabled,
            "key_rotation_days": config.key_rotation_days,
            "access_control": config.access_control or {},
            "rate_limiting": config.rate_limiting or {},
            "mfa_enabled": config.mfa_enabled,
            "session_timeout_minutes": config.session_timeout_minutes,
            "password_policy": config.password_policy or {},
            "ip_whitelist": config.ip_whitelist or [],
            "ip_blacklist": config.ip_blacklist or [],
            "ssl_config": config.ssl_config or {},
            "quantum_safe": config.quantum_safe,
            "post_quantum_algorithm": config.post_quantum_algorithm,
            "hybrid_scheme": config.hybrid_scheme
        }
        
        with open(config_file, "w") as f:
            yaml.dump(config_data, f, default_flow_style=False)
        
        return config_dir

    def get_security_config(self, name: str) -> Optional[SecurityConfig]:
        """Get security configuration"""
        config_dir = self.security_dir / name
        if not config_dir.exists():
            return None
        
        config_file = config_dir / "config.yaml"
        with open(config_file, "r") as f:
            config_data = yaml.safe_load(f)
        
        return SecurityConfig(**config_data)

    def update_security_config(self, name: str, config: SecurityConfig) -> Path:
        """Update security configuration"""
        config_dir = self.security_dir / name
        if not config_dir.exists():
            raise ValueError(f"Security configuration {name} not found")
        
        return self.create_security_config(config)

    def delete_security_config(self, name: str):
        """Delete security configuration"""
        config_dir = self.security_dir / name
        if not config_dir.exists():
            raise ValueError(f"Security configuration {name} not found")
        
        shutil.rmtree(config_dir)

    def encrypt_data(self, data: str, use_quantum_safe: bool = False) -> str:
        """Encrypt data using symmetric or quantum-safe encryption"""
        if use_quantum_safe and self.quantum_safe:
            # Use quantum-safe encryption
            if self.hybrid_scheme:
                # Use hybrid scheme (classical + quantum-safe)
                classical_encrypted = self.cipher_suite.encrypt(data.encode())
                quantum_encrypted = self._quantum_encrypt(data)
                return base64.b64encode(
                    classical_encrypted + b":" + quantum_encrypted
                ).decode()
            else:
                # Use only quantum-safe encryption
                return self._quantum_encrypt(data)
        else:
            # Use classical encryption
            return self.cipher_suite.encrypt(data.encode()).decode()

    def decrypt_data(self, encrypted_data: str, use_quantum_safe: bool = False) -> str:
        """Decrypt data using symmetric or quantum-safe decryption"""
        if use_quantum_safe and self.quantum_safe:
            if self.hybrid_scheme:
                # Decrypt hybrid scheme
                data_parts = base64.b64decode(encrypted_data).split(b":")
                classical_decrypted = self.cipher_suite.decrypt(data_parts[0])
                quantum_decrypted = self._quantum_decrypt(data_parts[1])
                
                # Verify both decryptions match
                if classical_decrypted != quantum_decrypted:
                    raise ValueError("Decryption mismatch in hybrid scheme")
                
                return classical_decrypted.decode()
            else:
                # Decrypt quantum-safe only
                return self._quantum_decrypt(encrypted_data)
        else:
            # Decrypt classical only
            return self.cipher_suite.decrypt(encrypted_data.encode()).decode()

    def _quantum_encrypt(self, data: str) -> bytes:
        """Quantum-safe encryption implementation"""
        # This is a placeholder for actual quantum-safe encryption
        # In a real implementation, this would use a quantum-safe algorithm
        # like CRYSTALS-Kyber or SABER
        return base64.b64encode(data.encode())

    def _quantum_decrypt(self, encrypted_data: str) -> str:
        """Quantum-safe decryption implementation"""
        # This is a placeholder for actual quantum-safe decryption
        # In a real implementation, this would use a quantum-safe algorithm
        # like CRYSTALS-Kyber or SABER
        return base64.b64decode(encrypted_data).decode()

    def generate_token(self, user_id: str, expires_in: int = 3600) -> str:
        """Generate JWT token"""
        payload = {
            "user_id": user_id,
            "exp": int(time.time()) + expires_in,
            "iat": int(time.time())
        }
        
        return jwt.encode(
            payload,
            self.hmac_key,
            algorithm="HS256"
        )

    def verify_token(self, token: str) -> Dict:
        """Verify JWT token"""
        try:
            return jwt.decode(
                token,
                self.hmac_key,
                algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")

    def rotate_keys(self):
        """Rotate encryption keys"""
        # Generate new keys
        new_symmetric_key = Fernet.generate_key()
        new_private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        new_public_key = new_private_key.public_key()
        new_hmac_key = secrets.token_bytes(32)
        
        # Save new keys with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        with open(self.keys_dir / f"symmetric_{timestamp}.key", "wb") as f:
            f.write(new_symmetric_key)
        
        with open(self.keys_dir / f"private_{timestamp}.pem", "wb") as f:
            f.write(new_private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))
        
        with open(self.keys_dir / f"public_{timestamp}.pem", "wb") as f:
            f.write(new_public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            ))
        
        with open(self.keys_dir / f"hmac_{timestamp}.key", "wb") as f:
            f.write(new_hmac_key)
        
        # Update current keys
        self.symmetric_key = new_symmetric_key
        self.private_key = new_private_key
        self.public_key = new_public_key
        self.hmac_key = new_hmac_key
        
        # Clean up old keys
        self._cleanup_old_keys()

    def _cleanup_old_keys(self):
        """Clean up old encryption keys"""
        current_time = datetime.now()
        for key_file in self.keys_dir.glob("*_*.key"):
            timestamp = datetime.strptime(
                key_file.stem.split("_")[1],
                "%Y%m%d_%H%M%S"
            )
            if (current_time - timestamp).days > 30:
                key_file.unlink()

    def audit_log(self, event: str, user_id: str, details: Dict = None):
        """Log security audit event"""
        if not self.audit_logging:
            return
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event": event,
            "user_id": user_id,
            "details": details or {}
        }
        
        self.logger.info(json.dumps(log_entry))

    def check_access(self, user_id: str, resource: str) -> bool:
        """Check if user has access to resource"""
        config = self.get_security_config("default")
        if not config or not config.access_control:
            return True
        
        user_roles = config.access_control.get(user_id, [])
        resource_roles = config.access_control.get(resource, [])
        
        return bool(set(user_roles) & set(resource_roles))

    def check_rate_limit(self, user_id: str, action: str) -> bool:
        """Check if user has exceeded rate limit"""
        config = self.get_security_config("default")
        if not config or not config.rate_limiting:
            return True
        
        rate_limit = config.rate_limiting.get(action, 0)
        if rate_limit == 0:
            return True
        
        # Implement rate limiting logic here
        # This could use Redis or another fast storage
        return True

    def validate_password(self, password: str) -> List[str]:
        """Validate password against policy"""
        config = self.get_security_config("default")
        if not config or not config.password_policy:
            return []
        
        errors = []
        policy = config.password_policy
        
        if len(password) < policy.get("min_length", 8):
            errors.append("Password too short")
        
        if policy.get("require_uppercase") and not any(c.isupper() for c in password):
            errors.append("Password must contain uppercase letter")
        
        if policy.get("require_lowercase") and not any(c.islower() for c in password):
            errors.append("Password must contain lowercase letter")
        
        if policy.get("require_numbers") and not any(c.isdigit() for c in password):
            errors.append("Password must contain number")
        
        if policy.get("require_special") and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain special character")
        
        return errors

    def check_ip_access(self, ip: str) -> bool:
        """Check if IP is allowed access"""
        config = self.get_security_config("default")
        if not config:
            return True
        
        if config.ip_whitelist and ip not in config.ip_whitelist:
            return False
        
        if config.ip_blacklist and ip in config.ip_blacklist:
            return False
        
        return True

    def generate_mfa_secret(self) -> str:
        """Generate MFA secret"""
        return secrets.token_hex(20)

    def verify_mfa_code(self, secret: str, code: str) -> bool:
        """Verify MFA code"""
        # Implement TOTP verification here
        # This is a placeholder
        return True

    def get_ssl_config(self) -> Dict:
        """Get SSL configuration"""
        config = self.get_security_config("default")
        if not config or not config.ssl_config:
            return {}
        
        return config.ssl_config

    def export_security_config(self, name: str, format: str = "yaml") -> str:
        """Export security configuration"""
        config = self.get_security_config(name)
        if not config:
            raise ValueError(f"Security configuration {name} not found")
        
        data = {
            "name": config.name,
            "description": config.description,
            "created_at": config.created_at.isoformat(),
            "updated_at": config.updated_at.isoformat(),
            "settings": config.settings,
            "audit_logging": config.audit_logging,
            "encryption_enabled": config.encryption_enabled,
            "key_rotation_days": config.key_rotation_days,
            "access_control": config.access_control,
            "rate_limiting": config.rate_limiting,
            "mfa_enabled": config.mfa_enabled,
            "session_timeout_minutes": config.session_timeout_minutes,
            "password_policy": config.password_policy,
            "ip_whitelist": config.ip_whitelist,
            "ip_blacklist": config.ip_blacklist,
            "ssl_config": config.ssl_config,
            "quantum_safe": config.quantum_safe,
            "post_quantum_algorithm": config.post_quantum_algorithm,
            "hybrid_scheme": config.hybrid_scheme
        }
        
        if format == "yaml":
            return yaml.dump(data, default_flow_style=False)
        elif format == "json":
            return json.dumps(data, indent=2)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def import_security_config(self, name: str, data: str, format: str = "yaml"):
        """Import security configuration"""
        if format == "yaml":
            config_data = yaml.safe_load(data)
        elif format == "json":
            config_data = json.loads(data)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        config = SecurityConfig(**config_data)
        self.create_security_config(config) 