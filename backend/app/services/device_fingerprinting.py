import hashlib
import json
import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)

class DeviceFingerprintService:
    def __init__(self):
        self.known_devices = {}  # Cache for known devices
        
    def generate_device_fingerprint(self, user_agent: str, ip_address: str, additional_data: Dict = None) -> str:
        """
        Generate a unique device fingerprint based on available data.
        This is a simplified version - in production, you'd want more sophisticated fingerprinting.
        """
        fingerprint_data = {
            "user_agent": user_agent,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if additional_data:
            fingerprint_data.update(additional_data)
        
        # Create a hash of the fingerprint data
        fingerprint_string = json.dumps(fingerprint_data, sort_keys=True)
        return hashlib.sha256(fingerprint_string.encode()).hexdigest()
    
    def analyze_device_risk(self, device_fingerprint: str, user: User, ip_address: str, user_agent: str) -> Dict:
        """
        Analyze the risk level of a device based on various factors.
        """
        risk_factors = []
        risk_score = 0
        
        # Check if this is a new device for the user
        if not self.is_known_device(user.id, device_fingerprint):
            risk_factors.append("New device")
            risk_score += 20
        
        # Check if IP address is suspicious (would integrate with security monitoring)
        # This is a placeholder - in production, you'd check against security monitoring service
        if ip_address.startswith("192.168.") or ip_address.startswith("10."):
            # Internal IP - lower risk
            pass
        else:
            # External IP - higher risk
            risk_score += 10
            risk_factors.append("External IP address")
        
        # Check user agent for suspicious patterns
        user_agent_risk = self._analyze_user_agent_risk(user_agent)
        if user_agent_risk > 0:
            risk_score += user_agent_risk
            risk_factors.append("Suspicious user agent")
        
        # Determine risk level
        if risk_score >= 50:
            risk_level = "HIGH"
        elif risk_score >= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        return {
            "device_fingerprint": device_fingerprint,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendations": self._get_risk_recommendations(risk_score)
        }
    
    def _analyze_user_agent_risk(self, user_agent: str) -> int:
        """
        Analyze user agent string for suspicious patterns.
        """
        risk_score = 0
        user_agent_lower = user_agent.lower()
        
        # Check for automated tools
        suspicious_patterns = [
            "bot", "crawler", "spider", "scraper", "automation",
            "headless", "phantom", "selenium", "puppeteer"
        ]
        
        for pattern in suspicious_patterns:
            if pattern in user_agent_lower:
                risk_score += 15
        
        # Check for missing or generic user agents
        if not user_agent or user_agent == "Mozilla/5.0":
            risk_score += 20
        
        return risk_score
    
    def _get_risk_recommendations(self, risk_score: int) -> List[str]:
        """
        Get recommendations based on risk score.
        """
        recommendations = []
        
        if risk_score >= 50:
            recommendations.extend([
                "Consider requiring additional verification",
                "Monitor this device closely",
                "Consider blocking access temporarily"
            ])
        elif risk_score >= 30:
            recommendations.extend([
                "Consider requiring 2FA",
                "Monitor for suspicious activity"
            ])
        else:
            recommendations.append("Normal risk level")
        
        return recommendations
    
    def is_known_device(self, user_id: int, device_fingerprint: str) -> bool:
        """
        Check if a device fingerprint is known for a user.
        In production, this would query the database.
        """
        key = f"{user_id}:{device_fingerprint}"
        return key in self.known_devices
    
    def register_device(self, user_id: int, device_fingerprint: str, device_info: Dict) -> None:
        """
        Register a new device for a user.
        In production, this would store in the database.
        """
        key = f"{user_id}:{device_fingerprint}"
        self.known_devices[key] = {
            "user_id": user_id,
            "device_fingerprint": device_fingerprint,
            "device_info": device_info,
            "first_seen": datetime.utcnow(),
            "last_seen": datetime.utcnow()
        }
        logger.info(f"Registered new device for user {user_id}: {device_fingerprint}")
    
    def update_device_activity(self, user_id: int, device_fingerprint: str) -> None:
        """
        Update the last seen timestamp for a device.
        """
        key = f"{user_id}:{device_fingerprint}"
        if key in self.known_devices:
            self.known_devices[key]["last_seen"] = datetime.utcnow()
    
    def get_user_devices(self, user_id: int) -> List[Dict]:
        """
        Get all known devices for a user.
        """
        devices = []
        for key, device_data in self.known_devices.items():
            if device_data["user_id"] == user_id:
                devices.append(device_data)
        return devices
    
    def revoke_device(self, user_id: int, device_fingerprint: str) -> bool:
        """
        Revoke access for a specific device.
        """
        key = f"{user_id}:{device_fingerprint}"
        if key in self.known_devices:
            del self.known_devices[key]
            logger.info(f"Revoked device {device_fingerprint} for user {user_id}")
            return True
        return False

# Global instance
device_fingerprint_service = DeviceFingerprintService() 