from typing import Dict, List, Optional, Set, Any
import jwt
from datetime import datetime, timedelta
import secrets
from fastapi import Request, HTTPException
from pydantic import BaseModel
import re
from collections import defaultdict
import asyncio
import hashlib
import aiohttp
from authlib.integrations.starlette_client import OAuth
from authlib.oauth2.rfc6749 import OAuth2Token
import ipaddress
from user_agents import parse
import logging
from dataclasses import dataclass
from backend.config import settings
from backend.core.monitoring.telemetry import telemetry

@dataclass
class SecurityEvent:
    event_type: str
    severity: str
    details: Dict[str, Any]
    timestamp: datetime
    source_ip: Optional[str] = None
    user_id: Optional[str] = None

class Permission(BaseModel):
    resource: str
    action: str
    conditions: Optional[Dict] = None

class Role(BaseModel):
    name: str
    permissions: List[Permission]
    parent_role: Optional[str] = None

class SecurityManager:
    def __init__(self):
        self._api_keys: Dict[str, Dict] = {}
        self._roles: Dict[str, Role] = {}
        self._user_roles: Dict[str, Set[str]] = defaultdict(set)
        self._rate_limits: Dict[str, List[datetime]] = defaultdict(list)
        self._blocked_ips: Set[str] = set()
        self._jwt_secret = settings.JWT_SECRET
        self._security_events: List[SecurityEvent] = []
        self._threat_patterns: Dict[str, int] = defaultdict(int)
        self._suspicious_ips: Dict[str, float] = {}
        
        # Initialize OAuth providers
        self._oauth = OAuth()
        self._configure_oauth_providers()
        
        # Start background tasks
        asyncio.create_task(self._analyze_security_events())
        asyncio.create_task(self._update_threat_intelligence())

    def _configure_oauth_providers(self):
        """Configure OAuth2.0 providers"""
        # Google OAuth2.0
        self._oauth.register(
            name='google',
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
            client_kwargs={'scope': 'openid email profile'}
        )
        
        # GitHub OAuth2.0
        self._oauth.register(
            name='github',
            client_id=settings.GITHUB_CLIENT_ID,
            client_secret=settings.GITHUB_CLIENT_SECRET,
            authorize_url='https://github.com/login/oauth/authorize',
            authorize_params=None,
            token_url='https://github.com/login/oauth/access_token',
            token_params=None,
            api_base_url='https://api.github.com/',
            client_kwargs={'scope': 'user:email'}
        )

    async def authenticate_oauth(self, provider: str, code: str) -> Dict:
        """Authenticate user using OAuth2.0"""
        try:
            oauth_client = self._oauth.create_client(provider)
            token = await oauth_client.authorize_access_token(code)
            user_info = await self._get_oauth_user_info(provider, token)
            
            # Create or update user
            user_id = await self._get_or_create_user(user_info)
            
            # Generate JWT token
            access_token = self.create_jwt_token(user_id)
            
            await self._log_security_event(
                SecurityEvent(
                    event_type="oauth_login",
                    severity="INFO",
                    details={"provider": provider, "user_info": user_info},
                    timestamp=datetime.now(),
                    user_id=user_id
                )
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user_id
            }
            
        except Exception as e:
            await self._log_security_event(
                SecurityEvent(
                    event_type="oauth_login_failed",
                    severity="WARNING",
                    details={"provider": provider, "error": str(e)},
                    timestamp=datetime.now()
                )
            )
            raise HTTPException(status_code=401, detail="OAuth authentication failed")

    async def _get_oauth_user_info(self, provider: str, token: OAuth2Token) -> Dict:
        """Get user info from OAuth provider"""
        oauth_client = self._oauth.create_client(provider)
        
        if provider == 'google':
            resp = await oauth_client.get('userinfo')
            if resp.status_code == 200:
                return await resp.json()
                
        elif provider == 'github':
            resp = await oauth_client.get('user')
            if resp.status_code == 200:
                return await resp.json()
                
        raise HTTPException(status_code=400, detail=f"Failed to get user info from {provider}")

    async def validate_request(self, request: Request):
        """Enhanced request validation with threat detection"""
        client_ip = request.client.host
        
        # Check if IP is blocked
        if client_ip in self._blocked_ips:
            await self._log_security_event(
                SecurityEvent(
                    event_type="blocked_ip_request",
                    severity="WARNING",
                    details={"path": request.url.path},
                    timestamp=datetime.now(),
                    source_ip=client_ip
                )
            )
            raise HTTPException(status_code=403, detail="IP address blocked")
            
        # Check if IP is suspicious
        if client_ip in self._suspicious_ips:
            await self._enhance_monitoring(request, client_ip)
            
        # Rate limiting
        await self._check_rate_limit(client_ip)
        
        # Validate headers
        await self._validate_headers(request.headers)
        
        # Validate content
        if request.method in ["POST", "PUT", "PATCH"]:
            await self._validate_content(request)
            
        # Analyze request patterns
        await self._analyze_request_pattern(request)

    async def _analyze_request_pattern(self, request: Request):
        """Analyze request patterns for suspicious activity"""
        pattern_key = f"{request.method}:{request.url.path}"
        self._threat_patterns[pattern_key] += 1
        
        # Check for suspicious patterns
        if self._threat_patterns[pattern_key] > 100:  # High frequency
            client_ip = request.client.host
            self._suspicious_ips[client_ip] = self._suspicious_ips.get(client_ip, 0) + 1
            
            if self._suspicious_ips[client_ip] > 5:
                await self._block_ip(client_ip, "Suspicious activity detected")

    async def _enhance_monitoring(self, request: Request, client_ip: str):
        """Enhanced monitoring for suspicious IPs"""
        # Log detailed request information
        await self._log_security_event(
            SecurityEvent(
                event_type="suspicious_request",
                severity="WARNING",
                details={
                    "method": request.method,
                    "path": request.url.path,
                    "headers": dict(request.headers),
                    "query_params": dict(request.query_params)
                },
                timestamp=datetime.now(),
                source_ip=client_ip
            )
        )

    async def _block_ip(self, ip: str, reason: str):
        """Block an IP address"""
        self._blocked_ips.add(ip)
        await self._log_security_event(
            SecurityEvent(
                event_type="ip_blocked",
                severity="WARNING",
                details={"reason": reason},
                timestamp=datetime.now(),
                source_ip=ip
            )
        )

    async def _analyze_security_events(self):
        """Analyze security events for patterns"""
        while True:
            try:
                now = datetime.now()
                recent_events = [
                    event for event in self._security_events
                    if (now - event.timestamp) < timedelta(hours=1)
                ]
                
                # Analyze events by type
                event_counts = defaultdict(int)
                for event in recent_events:
                    event_counts[event.event_type] += 1
                    
                # Check for suspicious patterns
                for event_type, count in event_counts.items():
                    if count > 100 and event_type in ["failed_login", "invalid_token"]:
                        await self._trigger_security_alert(event_type, count)
                        
            except Exception as e:
                logging.error(f"Error analyzing security events: {str(e)}")
                
            await asyncio.sleep(60)  # Run every minute

    async def _update_threat_intelligence(self):
        """Update threat intelligence data"""
        while True:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(settings.THREAT_INTELLIGENCE_API) as response:
                        if response.status == 200:
                            threat_data = await response.json()
                            # Update blocked IPs from threat intelligence
                            for ip in threat_data.get("malicious_ips", []):
                                self._blocked_ips.add(ip)
            except Exception as e:
                logging.error(f"Error updating threat intelligence: {str(e)}")
                
            await asyncio.sleep(3600)  # Update every hour

    async def _trigger_security_alert(self, event_type: str, count: int):
        """Trigger security alert"""
        alert = {
            "type": event_type,
            "count": count,
            "timestamp": datetime.now().isoformat(),
            "severity": "HIGH"
        }
        
        # Log alert
        await self._log_security_event(
            SecurityEvent(
                event_type="security_alert",
                severity="HIGH",
                details=alert,
                timestamp=datetime.now()
            )
        )
        
        # Send alert to monitoring system
        await telemetry.logger.log_event(
            "ERROR",
            "security_alert",
            f"Security alert: {event_type}",
            alert
        )

    async def _log_security_event(self, event: SecurityEvent):
        """Log security event"""
        self._security_events.append(event)
        
        # Trim old events
        now = datetime.now()
        self._security_events = [
            e for e in self._security_events
            if (now - e.timestamp) < timedelta(days=7)
        ]
        
        # Log to monitoring system
        await telemetry.logger.log_event(
            event.severity,
            event.event_type,
            str(event.details),
            {
                "source_ip": event.source_ip,
                "user_id": event.user_id,
                "timestamp": event.timestamp.isoformat()
            }
        )

    async def create_api_key(self, user_id: str, expires_in_days: int = 30) -> str:
        """Create a new API key with enhanced security"""
        key = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=expires_in_days)
        
        # Hash the key for storage
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        self._api_keys[key_hash] = {
            "user_id": user_id,
            "created_at": datetime.now(),
            "expires_at": expires_at,
            "last_used": None,
            "usage_count": 0,
            "allowed_ips": [],  # IP whitelist
            "permissions": []  # Specific permissions for this key
        }
        
        await self._log_security_event(
            SecurityEvent(
                event_type="api_key_created",
                severity="INFO",
                details={"expires_at": expires_at.isoformat()},
                timestamp=datetime.now(),
                user_id=user_id
            )
        )
        
        return key

    async def validate_api_key(self, key: str, request: Request = None) -> bool:
        """Validate API key with enhanced security checks"""
        key_hash = hashlib.sha256(key.encode()).hexdigest()
        
        if key_hash not in self._api_keys:
            await self._log_security_event(
                SecurityEvent(
                    event_type="invalid_api_key",
                    severity="WARNING",
                    details={},
                    timestamp=datetime.now(),
                    source_ip=request.client.host if request else None
                )
            )
            return False
            
        key_data = self._api_keys[key_hash]
        
        # Check expiration
        if datetime.now() > key_data["expires_at"]:
            await self._log_security_event(
                SecurityEvent(
                    event_type="expired_api_key",
                    severity="WARNING",
                    details={"key_id": key_hash[:8]},
                    timestamp=datetime.now(),
                    user_id=key_data["user_id"]
                )
            )
            del self._api_keys[key_hash]
            return False
            
        # Check IP whitelist if configured
        if request and key_data["allowed_ips"]:
            client_ip = ipaddress.ip_address(request.client.host)
            if not any(client_ip in ipaddress.ip_network(allowed_ip)
                      for allowed_ip in key_data["allowed_ips"]):
                await self._log_security_event(
                    SecurityEvent(
                        event_type="api_key_ip_restricted",
                        severity="WARNING",
                        details={"key_id": key_hash[:8]},
                        timestamp=datetime.now(),
                        source_ip=request.client.host
                    )
                )
                return False
            
        # Update usage statistics
        key_data["last_used"] = datetime.now()
        key_data["usage_count"] += 1
        
        return True

    def create_jwt_token(self, user_id: str, expires_in_minutes: int = 30) -> str:
        """Create a JWT token"""
        payload = {
            "sub": user_id,
            "exp": datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        }
        return jwt.encode(payload, self._jwt_secret, algorithm="HS256")

    def validate_jwt_token(self, token: str) -> Optional[str]:
        """Validate a JWT token"""
        try:
            payload = jwt.decode(token, self._jwt_secret, algorithms=["HS256"])
            return payload["sub"]
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

# Global instance
security_manager = SecurityManager() 