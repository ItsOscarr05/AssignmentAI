from typing import Dict, List, Optional, Union, Deque, Any
import os
import json
from enum import Enum
from urllib.request import Request
import openai
from openai import OpenAI
import anthropic
import google.generativeai as genai
from tenacity import retry, stop_after_attempt, wait_exponential
import logging
from collections import deque, defaultdict
from datetime import datetime, timedelta
from dataclasses import dataclass
import hashlib
import random
import asyncio
import numpy as np
from abc import ABC, abstractmethod

class ModelProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"

class SubjectType(Enum):
    MATH = "mathematics"
    SCIENCE = "science"
    ENGLISH = "english"
    HISTORY = "history"
    COMPUTER_SCIENCE = "computer_science"
    GENERAL = "general"

class AssignmentType(Enum):
    PROBLEM_SOLVING = "problem_solving"
    ESSAY = "essay"
    RESEARCH = "research"
    CODE = "code"
    ANALYSIS = "analysis"
    GENERAL = "general"

class ConversationMemory:
    def __init__(self, max_size: int = 10):
        self.messages: Deque[Dict] = deque(maxlen=max_size)
        self.metadata: Dict = {}
        self.last_interaction: Optional[datetime] = None
        
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        self.messages.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now(),
            "metadata": metadata or {}
        })
        self.last_interaction = datetime.now()
        
    def get_recent_context(self, window_minutes: int = 30) -> List[Dict]:
        if not self.last_interaction:
            return []
        
        cutoff_time = datetime.now() - timedelta(minutes=window_minutes)
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in self.messages
            if msg["timestamp"] > cutoff_time
        ]
        
    def clear_old_messages(self, minutes: int = 60):
        if not self.last_interaction:
            return
        
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        self.messages = deque(
            [msg for msg in self.messages if msg["timestamp"] > cutoff_time],
            maxlen=self.messages.maxlen
        )

@dataclass
class ModelVersion:
    version_id: str
    timestamp: datetime
    config: Dict[str, Any]
    checksum: str
    performance_baseline: float
    is_stable: bool = True
    rollback_version: Optional[str] = None

@dataclass
class PerformanceMetric:
    timestamp: datetime
    success_rate: float
    average_response_time: float
    error_rate: float
    quality_score: float
    request_count: int

@dataclass
class Experiment:
    id: str
    control_version: str
    variant_version: str
    start_time: datetime
    end_time: Optional[datetime]
    sample_size: int
    confidence_level: float
    metrics: Dict[str, List[float]]
    is_active: bool = True

@dataclass
class BiasPattern:
    name: str
    pattern: str
    category: str
    severity: float
    description: str
    mitigation_strategy: str

@dataclass
class BiasReport:
    detected_biases: List[Dict[str, Any]]
    overall_bias_score: float
    recommendations: List[str]
    analysis_details: Dict[str, Any]

@dataclass
class MitigationStrategy:
    name: str
    description: str
    action: str
    effectiveness: float

@dataclass
class Resource:
    id: str
    type: str
    capacity: float
    used: float
    status: str
    last_updated: datetime
    metrics: Dict[str, float]

@dataclass
class ResourceAllocation:
    resource_id: str
    allocated_capacity: float
    start_time: datetime
    duration: timedelta
    priority: int
    constraints: Dict[str, Any]

@dataclass
class Demand:
    request_type: str
    required_capacity: float
    priority: int
    constraints: Dict[str, Any]
    deadline: Optional[datetime]

@dataclass
class AllocationStrategy:
    name: str
    priority_weights: Dict[str, float]
    constraints: List[str]
    optimization_goal: str

@dataclass
class SecurityVerdict:
    is_approved: bool
    confidence: float
    reason: str
    risk_level: str
    timestamp: datetime
    metadata: Dict[str, Any]

@dataclass
class SecurityContext:
    user_id: str
    roles: List[str]
    permissions: List[str]
    session_id: str
    ip_address: str
    device_info: Dict[str, str]
    authentication_method: str
    trust_score: float

@dataclass
class AccessPolicy:
    name: str
    resource_pattern: str
    required_roles: List[str]
    required_permissions: List[str]
    conditions: Dict[str, Any]
    risk_threshold: float

@dataclass
class NetworkSegment:
    id: str
    name: str
    trust_level: int
    allowed_connections: List[str]
    security_controls: List[str]
    monitoring_level: str

@dataclass
class ThreatPattern:
    id: str
    name: str
    pattern: str
    severity: float
    category: str
    description: str
    indicators: List[str]
    false_positive_rate: float

@dataclass
class ThreatReport:
    timestamp: datetime
    detected_threats: List[Dict[str, Any]]
    risk_score: float
    recommended_actions: List[str]
    analysis_details: Dict[str, Any]
    confidence_score: float

@dataclass
class Traffic:
    source_ip: str
    destination_ip: str
    protocol: str
    port: int
    payload: bytes
    timestamp: datetime
    metadata: Dict[str, Any]

@dataclass
class MitigationAction:
    id: str
    name: str
    description: str
    action_type: str
    effectiveness: float
    side_effects: List[str]
    prerequisites: List[str]

class RealTimeThreatAnalyzer:
    def __init__(self):
        self.threat_patterns: List[ThreatPattern] = self._initialize_threat_patterns()
        self.mitigation_actions: Dict[str, MitigationAction] = self._initialize_mitigation_actions()
        self.traffic_history: Deque[Traffic] = deque(maxlen=1000)
        self.threat_history: List[ThreatReport] = []
        self.analysis_window: timedelta = timedelta(minutes=5)
        self.risk_threshold: float = 0.7
        self.confidence_threshold: float = 0.8
        self.max_false_positive_rate: float = 0.1
        
    def _initialize_threat_patterns(self) -> List[ThreatPattern]:
        """Initialize known threat patterns"""
        return [
            ThreatPattern(
                id="DOS_001",
                name="Denial of Service Attack",
                pattern="high_frequency_requests",
                severity=0.9,
                category="availability",
                description="Potential DoS attack detected based on request frequency",
                indicators=[
                    "high_request_rate",
                    "similar_request_pattern",
                    "resource_exhaustion"
                ],
                false_positive_rate=0.05
            ),
            ThreatPattern(
                id="INJ_001",
                name="SQL Injection Attempt",
                pattern="sql_injection_payload",
                severity=0.95,
                category="injection",
                description="SQL injection attempt detected in request payload",
                indicators=[
                    "sql_keywords",
                    "special_characters",
                    "encoded_strings"
                ],
                false_positive_rate=0.02
            ),
            ThreatPattern(
                id="AUTH_001",
                name="Authentication Bypass Attempt",
                pattern="auth_manipulation",
                severity=0.9,
                category="authentication",
                description="Attempt to bypass authentication mechanisms",
                indicators=[
                    "token_manipulation",
                    "cookie_tampering",
                    "header_spoofing"
                ],
                false_positive_rate=0.03
            ),
            ThreatPattern(
                id="DATA_001",
                name="Data Exfiltration Attempt",
                pattern="unusual_data_transfer",
                severity=0.85,
                category="data_security",
                description="Unusual data transfer patterns indicating potential exfiltration",
                indicators=[
                    "large_response_size",
                    "unusual_endpoints",
                    "encoded_data"
                ],
                false_positive_rate=0.07
            )
        ]
        
    def _initialize_mitigation_actions(self) -> Dict[str, MitigationAction]:
        """Initialize available mitigation actions"""
        actions = [
            MitigationAction(
                id="BLOCK_IP",
                name="Block IP Address",
                description="Block the source IP address at the firewall level",
                action_type="network",
                effectiveness=0.95,
                side_effects=["potential_false_positives"],
                prerequisites=["firewall_access"]
            ),
            MitigationAction(
                id="RATE_LIMIT",
                name="Apply Rate Limiting",
                description="Implement rate limiting for the affected endpoint",
                action_type="application",
                effectiveness=0.85,
                side_effects=["reduced_performance"],
                prerequisites=["rate_limiter"]
            ),
            MitigationAction(
                id="INCREASE_AUTH",
                name="Increase Authentication Requirements",
                description="Temporarily increase authentication requirements",
                action_type="authentication",
                effectiveness=0.9,
                side_effects=["user_friction"],
                prerequisites=["auth_system_access"]
            ),
            MitigationAction(
                id="ISOLATE_SYSTEM",
                name="System Isolation",
                description="Isolate affected system components",
                action_type="system",
                effectiveness=0.98,
                side_effects=["service_disruption"],
                prerequisites=["system_control"]
            )
        ]
        return {action.id: action for action in actions}
        
    async def analyze_traffic(self, traffic: Traffic) -> ThreatReport:
        """Analyze traffic patterns for potential threats"""
        try:
            # Add traffic to history
            self.traffic_history.append(traffic)
            
            # Analyze recent traffic patterns
            recent_traffic = self._get_recent_traffic()
            
            # Detect threats
            detected_threats = await self._detect_threats(traffic, recent_traffic)
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(detected_threats)
            
            # Generate mitigation recommendations
            recommended_actions = await self._generate_mitigation_recommendations(
                detected_threats,
                risk_score
            )
            
            # Prepare analysis details
            analysis_details = self._prepare_analysis_details(
                traffic,
                detected_threats,
                risk_score
            )
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(
                detected_threats,
                analysis_details
            )
            
            # Create threat report
            report = ThreatReport(
                timestamp=datetime.now(),
                detected_threats=detected_threats,
                risk_score=risk_score,
                recommended_actions=recommended_actions,
                analysis_details=analysis_details,
                confidence_score=confidence_score
            )
            
            # Update threat history
            self.threat_history.append(report)
            
            # Trigger automatic mitigations if necessary
            if risk_score >= self.risk_threshold and confidence_score >= self.confidence_threshold:
                await self._apply_automatic_mitigations(detected_threats)
            
            return report
            
        except Exception as e:
            logging.error(f"Threat analysis failed: {str(e)}")
            return ThreatReport(
                timestamp=datetime.now(),
                detected_threats=[],
                risk_score=0.0,
                recommended_actions=["Analysis failed, manual investigation required"],
                analysis_details={"error": str(e)},
                confidence_score=0.0
            )
            
    def _get_recent_traffic(self) -> List[Traffic]:
        """Get traffic from recent analysis window"""
        cutoff_time = datetime.now() - self.analysis_window
        return [t for t in self.traffic_history if t.timestamp > cutoff_time]
        
    async def _detect_threats(
        self,
        current_traffic: Traffic,
        recent_traffic: List[Traffic]
    ) -> List[Dict[str, Any]]:
        """Detect potential threats in traffic"""
        detected_threats = []
        
        for pattern in self.threat_patterns:
            # Skip patterns with high false positive rates
            if pattern.false_positive_rate > self.max_false_positive_rate:
                continue
                
            # Check for pattern indicators
            matched_indicators = self._match_threat_indicators(
                pattern,
                current_traffic,
                recent_traffic
            )
            
            if matched_indicators:
                threat = {
                    "pattern_id": pattern.id,
                    "name": pattern.name,
                    "severity": pattern.severity,
                    "category": pattern.category,
                    "matched_indicators": matched_indicators,
                    "confidence": self._calculate_indicator_confidence(
                        matched_indicators,
                        pattern
                    ),
                    "timestamp": datetime.now(),
                    "traffic_data": {
                        "source_ip": current_traffic.source_ip,
                        "destination_ip": current_traffic.destination_ip,
                        "protocol": current_traffic.protocol,
                        "port": current_traffic.port
                    }
                }
                detected_threats.append(threat)
                
        return detected_threats
        
    def _match_threat_indicators(
        self,
        pattern: ThreatPattern,
        current_traffic: Traffic,
        recent_traffic: List[Traffic]
    ) -> List[str]:
        """Match traffic against threat indicators"""
        matched_indicators = []
        
        # Check frequency-based indicators
        if "high_request_rate" in pattern.indicators:
            request_rate = self._calculate_request_rate(recent_traffic)
            if request_rate > 100:  # Threshold requests per minute
                matched_indicators.append("high_request_rate")
                
        # Check payload-based indicators
        if current_traffic.payload:
            if "sql_keywords" in pattern.indicators and self._contains_sql_injection(current_traffic.payload):
                matched_indicators.append("sql_keywords")
            if "encoded_strings" in pattern.indicators and self._contains_suspicious_encoding(current_traffic.payload):
                matched_indicators.append("encoded_strings")
                
        # Check authentication-related indicators
        if "token_manipulation" in pattern.indicators and self._detect_token_manipulation(current_traffic):
            matched_indicators.append("token_manipulation")
            
        # Check data transfer indicators
        if "large_response_size" in pattern.indicators and self._is_large_transfer(current_traffic):
            matched_indicators.append("large_response_size")
            
        return matched_indicators
        
    def _calculate_request_rate(self, traffic: List[Traffic]) -> float:
        """Calculate request rate per minute"""
        if not traffic:
            return 0.0
            
        time_range = (traffic[-1].timestamp - traffic[0].timestamp).total_seconds() / 60
        return len(traffic) / time_range if time_range > 0 else 0.0
        
    def _contains_sql_injection(self, payload: bytes) -> bool:
        """Check for SQL injection patterns"""
        sql_patterns = [
            b"SELECT",
            b"UNION",
            b"DROP",
            b"--",
            b";"
        ]
        return any(pattern in payload.upper() for pattern in sql_patterns)
        
    def _contains_suspicious_encoding(self, payload: bytes) -> bool:
        """Check for suspicious encoding patterns"""
        encoding_patterns = [
            b"%[0-9A-Fa-f]{2}",
            b"base64:",
            b"\\u[0-9A-Fa-f]{4}"
        ]
        return any(pattern in payload for pattern in encoding_patterns)
        
    def _detect_token_manipulation(self, traffic: Traffic) -> bool:
        """Detect potential token manipulation"""
        # Implementation would include token validation logic
        return False
        
    def _is_large_transfer(self, traffic: Traffic) -> bool:
        """Check if transfer size is unusually large"""
        threshold = 10 * 1024 * 1024  # 10MB
        return len(traffic.payload) > threshold
        
    def _calculate_indicator_confidence(
        self,
        matched_indicators: List[str],
        pattern: ThreatPattern
    ) -> float:
        """Calculate confidence score for matched indicators"""
        if not matched_indicators:
            return 0.0
            
        # Weight indicators by importance
        indicator_weights = {
            "high_request_rate": 0.7,
            "sql_keywords": 0.9,
            "encoded_strings": 0.6,
            "token_manipulation": 0.8,
            "large_response_size": 0.5
        }
        
        weighted_sum = sum(
            indicator_weights.get(indicator, 0.5)
            for indicator in matched_indicators
        )
        max_possible = sum(
            indicator_weights.get(indicator, 0.5)
            for indicator in pattern.indicators
        )
        
        # Adjust confidence based on false positive rate
        base_confidence = weighted_sum / max_possible if max_possible > 0 else 0
        return base_confidence * (1 - pattern.false_positive_rate)
        
    def _calculate_risk_score(self, detected_threats: List[Dict[str, Any]]) -> float:
        """Calculate overall risk score"""
        if not detected_threats:
            return 0.0
            
        # Weight threats by severity and confidence
        weighted_scores = [
            threat["severity"] * threat["confidence"]
            for threat in detected_threats
        ]
        
        # Use exponential scaling for multiple threats
        return 1 - (1 - max(weighted_scores)) ** len(detected_threats)
        
    async def _generate_mitigation_recommendations(
        self,
        detected_threats: List[Dict[str, Any]],
        risk_score: float
    ) -> List[str]:
        """Generate mitigation recommendations"""
        recommendations = []
        
        for threat in detected_threats:
            # Find applicable mitigation actions
            applicable_actions = self._find_applicable_actions(
                threat["category"],
                threat["severity"]
            )
            
            # Sort by effectiveness
            applicable_actions.sort(key=lambda x: x.effectiveness, reverse=True)
            
            # Add recommendations
            for action in applicable_actions[:2]:  # Top 2 most effective actions
                recommendations.append(
                    f"{action.name}: {action.description} "
                    f"(Effectiveness: {action.effectiveness:.0%})"
                )
                
        # Add general recommendations for high risk
        if risk_score >= self.risk_threshold:
            recommendations.append(
                "Immediate action required: Consider system isolation "
                "and incident response team notification"
            )
            
        return recommendations
        
    def _find_applicable_actions(
        self,
        threat_category: str,
        threat_severity: float
    ) -> List[MitigationAction]:
        """Find applicable mitigation actions"""
        applicable = []
        
        for action in self.mitigation_actions.values():
            # Match action type to threat category
            if self._action_matches_category(action.action_type, threat_category):
                # Check if action is appropriate for severity
                if threat_severity >= 0.8 or action.effectiveness >= 0.9:
                    applicable.append(action)
                    
        return applicable
        
    def _action_matches_category(self, action_type: str, threat_category: str) -> bool:
        """Check if action type matches threat category"""
        category_mappings = {
            "availability": ["network", "system"],
            "injection": ["application", "system"],
            "authentication": ["authentication", "system"],
            "data_security": ["system", "application"]
        }
        return action_type in category_mappings.get(threat_category, [])
        
    def _prepare_analysis_details(
        self,
        traffic: Traffic,
        detected_threats: List[Dict[str, Any]],
        risk_score: float
    ) -> Dict[str, Any]:
        """Prepare detailed analysis information"""
        return {
            "traffic_analysis": {
                "timestamp": traffic.timestamp,
                "protocol": traffic.protocol,
                "source_ip": traffic.source_ip,
                "destination_ip": traffic.destination_ip,
                "port": traffic.port
            },
            "threat_analysis": {
                "num_threats": len(detected_threats),
                "categories": list(set(t["category"] for t in detected_threats)),
                "max_severity": max((t["severity"] for t in detected_threats), default=0),
                "risk_score": risk_score
            },
            "historical_context": {
                "recent_threats": len([
                    t for t in self.threat_history
                    if t.timestamp > datetime.now() - self.analysis_window
                ]),
                "analysis_window": str(self.analysis_window)
            }
        }
        
    def _calculate_confidence_score(
        self,
        detected_threats: List[Dict[str, Any]],
        analysis_details: Dict[str, Any]
    ) -> float:
        """Calculate overall confidence score"""
        if not detected_threats:
            return 1.0  # High confidence in no threats
            
        # Average threat confidence scores
        threat_confidence = sum(t["confidence"] for t in detected_threats) / len(detected_threats)
        
        # Adjust based on historical context
        historical_factor = self._calculate_historical_factor(analysis_details)
        
        return threat_confidence * historical_factor
        
    def _calculate_historical_factor(self, analysis_details: Dict[str, Any]) -> float:
        """Calculate historical confidence factor"""
        recent_threats = analysis_details["historical_context"]["recent_threats"]
        
        if recent_threats == 0:
            return 0.8  # Slightly reduce confidence for no historical context
        elif recent_threats > 10:
            return 1.0  # High confidence with substantial history
        else:
            return 0.8 + (recent_threats * 0.02)  # Linear scaling
            
    async def _apply_automatic_mitigations(self, detected_threats: List[Dict[str, Any]]):
        """Apply automatic mitigation actions"""
        try:
            for threat in detected_threats:
                if threat["severity"] >= 0.9 and threat["confidence"] >= 0.9:
                    # Find highest effectiveness action
                    applicable_actions = self._find_applicable_actions(
                        threat["category"],
                        threat["severity"]
                    )
                    
                    if applicable_actions:
                        best_action = max(
                            applicable_actions,
                            key=lambda x: x.effectiveness
                        )
                        
                        # Log automatic mitigation
                        logging.warning(
                            f"Applying automatic mitigation: {best_action.name} "
                            f"for threat: {threat['name']}"
                        )
                        
                        # Implementation would include actual mitigation logic
                        
        except Exception as e:
            logging.error(f"Automatic mitigation failed: {str(e)}")

class AIEngine:
    def __init__(self, config_path: str = "ai_models/config/ai_config.json"):
        """Initialize the AI Engine with configuration"""
        self.config = self._load_config(config_path)
        self._initialize_providers()
        self._load_prompt_templates()
        self.conversation_memory = ConversationMemory()
        self.version_control = AIVersionControl()
        self.ab_testing = ABTesting()
        self.performance_metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "average_response_time": 0.0,
            "provider_stats": {
                provider.value: {"requests": 0, "errors": 0}
                for provider in ModelProvider
            }
        }
        
        # Create initial version
        self.current_version_id = self.version_control.create_version(
            config=self.config,
            performance_baseline=0.7  # Initial conservative baseline
        )
        self.bias_detector = BiasDetector()
        self.resource_manager = ResourceManager()
        self.zero_trust = ZeroTrustFramework()
        self.threat_analyzer = RealTimeThreatAnalyzer()
        
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Use default configuration if file not found
            return {
                "openai": {"model": "gpt-4-turbo-preview"},
                "anthropic": {"model": "claude-3-opus-20240229"},
                "gemini": {"model": "gemini-pro"},
                "default_provider": "openai"
            }

    def _initialize_providers(self):
        """Initialize AI provider clients"""
        # OpenAI initialization
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Anthropic initialization
        self.anthropic_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        
        # Google Gemini initialization
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        self.gemini_model = genai.GenerativeModel('gemini-pro')

    def _load_prompt_templates(self):
        """Load subject-specific prompt templates"""
        self.prompt_templates = {
            SubjectType.MATH: {
                "system": "You are an expert mathematics tutor. Provide step-by-step solutions, explain mathematical concepts clearly, and include relevant formulas and diagrams when necessary.",
                "analysis": "Let's break this mathematics problem down:\n1. What are we solving for?\n2. What information is given?\n3. Which mathematical concepts are involved?\n4. What formulas will we need?"
            },
            SubjectType.SCIENCE: {
                "system": "You are a scientific expert. Explain scientific concepts with precision, use relevant terminology, and include practical examples and experimental context when appropriate.",
                "analysis": "Let's analyze this scientific problem:\n1. What are the key scientific principles involved?\n2. What data or observations are provided?\n3. Which scientific methods are relevant?\n4. How can we approach this systematically?"
            },
            SubjectType.ENGLISH: {
                "system": "You are an expert in English literature and language. Provide detailed literary analysis, consider cultural and historical context, and explain language patterns and writing techniques.",
                "analysis": "Let's examine this text:\n1. What are the key themes and literary devices?\n2. What is the context?\n3. How does the author's style contribute to the meaning?\n4. What evidence supports our analysis?"
            },
            SubjectType.COMPUTER_SCIENCE: {
                "system": "You are an expert software engineer and computer scientist. Provide clear explanations of programming concepts, include code examples, and follow best practices in software development.",
                "analysis": "Let's analyze this programming problem:\n1. What are the requirements?\n2. What data structures and algorithms are needed?\n3. How can we optimize the solution?\n4. What edge cases should we consider?"
            }
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def process_assignment(
        self,
        assignment_text: str,
        subject: SubjectType,
        assignment_type: AssignmentType,
        grade_level: str,
        provider: ModelProvider = None,
        additional_context: Dict = None,
        experiment_id: Optional[str] = None
    ) -> Dict:
        """Process an assignment with version control and A/B testing support"""
        start_time = datetime.now()
        self.performance_metrics["total_requests"] += 1
        
        try:
            # Check for active experiment
            if experiment_id and experiment_id in self.ab_testing.experiments:
                # Use either control or variant version based on request count
                experiment = self.ab_testing.experiments[experiment_id]
                is_control = self.performance_metrics["total_requests"] % 2 == 0
                config_version = experiment.control_version if is_control else experiment.variant_version
                self.config = self.version_control.versions[config_version].config
            
            # Determine the best provider for the subject and assignment type
            provider = provider or self._select_best_provider(subject, assignment_type)
            self.performance_metrics["provider_stats"][provider.value]["requests"] += 1
            
            # Get conversation history and context
            recent_context = self.conversation_memory.get_recent_context()
            
            # Generate enhanced prompt with context
            prompt = self._generate_enhanced_prompt(
                assignment_text,
                subject,
                assignment_type,
                grade_level,
                additional_context,
                recent_context
            )
            
            # Try primary provider
            try:
                response = await self._get_model_response(prompt, provider)
            except Exception as e:
                logging.warning(f"Primary provider {provider.value} failed: {str(e)}")
                self.performance_metrics["provider_stats"][provider.value]["errors"] += 1
                # Fallback to next best provider
                fallback_provider = self._get_fallback_provider(provider, subject, assignment_type)
                response = await self._get_model_response(prompt, fallback_provider)
                provider = fallback_provider
            
            # Update conversation memory
            self.conversation_memory.add_message(
                "assistant",
                response,
                {
                    "subject": subject.value,
                    "assignment_type": assignment_type.value,
                    "provider": provider.value
                }
            )
            
            # Post-process the response
            processed_response = self._post_process_response(
                response,
                subject,
                assignment_type,
                provider
            )
            
            # Add quality metrics
            quality_score = await self._evaluate_response_quality(
                processed_response["response"],
                assignment_text,
                subject,
                assignment_type
            )
            processed_response["quality_metrics"] = quality_score
            
            # Update performance metrics
            self.performance_metrics["successful_requests"] += 1
            elapsed_time = (datetime.now() - start_time).total_seconds()
            self._update_performance_metrics(elapsed_time)
            
            # Adaptive learning: Update provider preferences based on quality
            self._update_provider_preferences(
                provider,
                subject,
                assignment_type,
                quality_score["overall_score"]
            )
            
            # Record metrics for A/B testing if applicable
            if experiment_id:
                quality_score = processed_response["quality_metrics"]["overall_score"]
                await self.ab_testing.record_metric(
                    experiment_id,
                    "quality_score",
                    quality_score,
                    is_control
                )
                
                await self.ab_testing.record_metric(
                    experiment_id,
                    "response_time",
                    elapsed_time,
                    is_control
                )
            
            # Update version control metrics
            self.version_control.add_performance_metric(
                version_id=self.current_version_id,
                success_rate=self.performance_metrics["successful_requests"] / self.performance_metrics["total_requests"],
                average_response_time=self.performance_metrics["average_response_time"],
                error_rate=self.performance_metrics["failed_requests"] / self.performance_metrics["total_requests"],
                quality_score=processed_response["quality_metrics"]["overall_score"],
                request_count=self.performance_metrics["total_requests"]
            )
            
            # Check for performance degradation
            await self.version_control.rollback_if_degraded(threshold=0.15)
            
            # Analyze response for bias
            bias_report = await self.bias_detector.analyze_response(processed_response["response"])
            
            # If bias score is above threshold, attempt to mitigate
            if bias_report.overall_bias_score > self.bias_detector.bias_threshold:
                # Generate a new response with bias mitigation prompt
                mitigation_prompt = self._generate_bias_mitigation_prompt(
                    processed_response["response"],
                    bias_report.recommendations
                )
                
                try:
                    mitigated_response = await self._get_model_response(
                        self._generate_enhanced_prompt(
                            mitigation_prompt,
                            subject,
                            assignment_type,
                            grade_level,
                            additional_context
                        ),
                        provider
                    )
                    
                    # Re-analyze the mitigated response
                    new_bias_report = await self.bias_detector.analyze_response(mitigated_response)
                    
                    # Use mitigated response if it has lower bias score
                    if new_bias_report.overall_bias_score < bias_report.overall_bias_score:
                        processed_response["response"] = mitigated_response
                        bias_report = new_bias_report
                except Exception as e:
                    logging.warning(f"Bias mitigation failed: {str(e)}")
            
            # Add bias analysis to response
            processed_response["bias_analysis"] = {
                "score": bias_report.overall_bias_score,
                "detected_biases": bias_report.detected_biases,
                "recommendations": bias_report.recommendations,
                "analysis_details": bias_report.analysis_details
            }
            
            # Add threat analysis
            traffic = Traffic(
                source_ip=recent_context.get("source_ip", "unknown"),
                destination_ip=recent_context.get("destination_ip", "unknown"),
                protocol=recent_context.get("protocol", "https"),
                port=recent_context.get("port", 443),
                payload=assignment_text.encode(),
                timestamp=datetime.now(),
                metadata={
                    "subject": subject.value,
                    "assignment_type": assignment_type.value,
                    "grade_level": grade_level
                }
            )
            
            threat_report = await self.threat_analyzer.analyze_traffic(traffic)
            
            if threat_report.risk_score >= self.threat_analyzer.risk_threshold:
                logging.warning(
                    f"High risk traffic detected: {threat_report.risk_score:.2%} "
                    f"confidence: {threat_report.confidence_score:.2%}"
                )
                
            processed_response["security_analysis"] = {
                "risk_score": threat_report.risk_score,
                "detected_threats": threat_report.detected_threats,
                "recommendations": threat_report.recommended_actions
            }
            
            return processed_response
            
        except Exception as e:
            self.performance_metrics["failed_requests"] += 1
            logging.error(f"Assignment processing failed: {str(e)}")
            raise

    def _select_best_provider(
        self,
        subject: SubjectType,
        assignment_type: AssignmentType
    ) -> ModelProvider:
        """Select the most appropriate AI provider based on subject and assignment type"""
        # Provider selection logic based on strengths
        if subject == SubjectType.COMPUTER_SCIENCE and assignment_type == AssignmentType.CODE:
            return ModelProvider.OPENAI  # GPT-4 is strong with code
        elif assignment_type == AssignmentType.ESSAY:
            return ModelProvider.ANTHROPIC  # Claude is strong with long-form content
        elif subject == SubjectType.MATH and assignment_type == AssignmentType.PROBLEM_SOLVING:
            return ModelProvider.GEMINI  # Gemini is strong with mathematical reasoning
        
        return ModelProvider(self.config["default_provider"])

    def _generate_enhanced_prompt(
        self,
        assignment_text: str,
        subject: SubjectType,
        assignment_type: AssignmentType,
        grade_level: str,
        additional_context: Optional[Dict] = None,
        recent_context: List[Dict] = None
    ) -> Dict:
        """Generate an enhanced prompt with subject-specific templates and context"""
        template = self.prompt_templates.get(subject, self.prompt_templates.get(SubjectType.GENERAL))
        
        # Build the prompt with specific instructions
        messages = [
            {"role": "system", "content": template["system"]},
            {"role": "user", "content": template["analysis"]},
            {"role": "user", "content": f"Grade Level: {grade_level}\n\nAssignment: {assignment_text}"}
        ]
        
        # Add additional context if provided
        if additional_context:
            context_prompt = self._format_additional_context(additional_context)
            messages.append({"role": "user", "content": context_prompt})
        
        # Add recent context if provided
        if recent_context:
            context_prompt = self._format_additional_context(recent_context)
            messages.append({"role": "user", "content": context_prompt})
        
        return messages

    async def _get_model_response(
        self,
        prompt: List[Dict],
        provider: ModelProvider
    ) -> str:
        """Get response from the selected AI provider with advanced features"""
        # Add system context based on performance history
        prompt = self._enhance_prompt_with_performance_data(prompt, provider)
        
        # Get response with automatic retries and fallback
        try:
            if provider == ModelProvider.OPENAI:
                response = await self._get_openai_response(prompt)
            elif provider == ModelProvider.ANTHROPIC:
                response = await self._get_anthropic_response(prompt)
            elif provider == ModelProvider.GEMINI:
                response = await self._get_gemini_response(prompt)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            
            # Validate response quality
            if not self._validate_response(response):
                raise ValueError("Response validation failed")
            
            # Enhance response with additional context if needed
            response = await self._enhance_response(response, prompt)
            
            return response
            
        except Exception as e:
            logging.error(f"{provider.value} response generation failed: {str(e)}")
            raise

    def _enhance_prompt_with_performance_data(
        self,
        prompt: List[Dict],
        provider: ModelProvider
    ) -> List[Dict]:
        """Enhance prompt with performance data and optimization hints"""
        # Get provider performance stats
        stats = self.performance_metrics["provider_stats"][provider.value]
        success_rate = (
            (stats["requests"] - stats["errors"]) / stats["requests"]
            if stats["requests"] > 0 else 0.5
        )
        
        # Add performance context to system message
        performance_context = (
            f"Current provider success rate: {success_rate:.2%}. "
            f"Average response time: {self.performance_metrics['average_response_time']:.2f}s. "
            "Optimize response for accuracy and completeness."
        )
        
        # Find and update system message
        for message in prompt:
            if message["role"] == "system":
                message["content"] = f"{message['content']}\n\n{performance_context}"
                break
        
        return prompt

    def _validate_response(self, response: str) -> bool:
        """Validate response meets quality standards"""
        if not response or len(response.strip()) < 10:
            return False
            
        # Check for common error indicators
        error_indicators = [
            "error occurred",
            "api error",
            "failed to generate",
            "unable to process"
        ]
        
        if any(indicator in response.lower() for indicator in error_indicators):
            return False
            
        # Ensure response is properly structured
        try:
            # Check for basic formatting
            paragraphs = [p for p in response.split('\n\n') if p.strip()]
            if len(paragraphs) < 1:
                return False
                
            # Check for minimum content requirements
            words = response.split()
            if len(words) < 20:  # Adjust threshold as needed
                return False
                
            return True
        except Exception:
            return False

    async def _enhance_response(self, response: str, original_prompt: List[Dict]) -> str:
        """Enhance response with additional context and improvements"""
        try:
            # Extract key concepts for enhancement
            concepts = await self._extract_key_concepts(response)
            
            # Generate improvements if needed
            if len(concepts) > 0:
                enhancement_prompt = [
                    {
                        "role": "system",
                        "content": "Enhance the following response by expanding on key concepts while maintaining clarity and conciseness."
                    },
                    {
                        "role": "user",
                        "content": f"Original response: {response}\n\nKey concepts to enhance: {', '.join(concepts)}"
                    }
                ]
                
                enhanced = await self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=enhancement_prompt,
                    temperature=0.3,
                    max_tokens=1000
                )
                
                enhanced_response = enhanced.choices[0].message.content
                
                # Validate enhancement improved the response
                if self._is_enhancement_better(response, enhanced_response):
                    return enhanced_response
            
            return response
            
        except Exception as e:
            logging.warning(f"Response enhancement failed: {str(e)}")
            return response

    async def _extract_key_concepts(self, text: str) -> List[str]:
        """Extract key concepts that might need enhancement"""
        try:
            concept_prompt = [
                {
                    "role": "system",
                    "content": "Identify key concepts in the text that might benefit from additional explanation or context."
                },
                {
                    "role": "user",
                    "content": text
                }
            ]
            
            concept_response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=concept_prompt,
                temperature=0.3,
                max_tokens=200
            )
            
            concepts_text = concept_response.choices[0].message.content
            return [c.strip() for c in concepts_text.split(',') if c.strip()]
            
        except Exception:
            return []

    def _is_enhancement_better(self, original: str, enhanced: str) -> bool:
        """Determine if the enhanced response is better than the original"""
        # Check length ratio
        if len(enhanced) < len(original) * 0.8 or len(enhanced) > len(original) * 2:
            return False
            
        # Check content preservation
        original_words = set(original.lower().split())
        enhanced_words = set(enhanced.lower().split())
        common_words = original_words.intersection(enhanced_words)
        
        if len(common_words) < len(original_words) * 0.5:
            return False
            
        # Check for better structure
        enhanced_paragraphs = [p for p in enhanced.split('\n\n') if p.strip()]
        original_paragraphs = [p for p in original.split('\n\n') if p.strip()]
        
        if len(enhanced_paragraphs) <= len(original_paragraphs):
            return False
            
        return True

    def _post_process_response(
        self,
        response: str,
        subject: SubjectType,
        assignment_type: AssignmentType,
        provider: ModelProvider
    ) -> Dict:
        """Post-process the AI response with additional features"""
        # Extract key points and concepts
        key_points = self._extract_key_points(response)
        
        # Generate citations if needed
        citations = self._generate_citations(response) if assignment_type == AssignmentType.RESEARCH else None
        
        # Check for potential plagiarism
        plagiarism_check = self._check_plagiarism(response) if assignment_type in [AssignmentType.ESSAY, AssignmentType.RESEARCH] else None
        
        # Format code if it's a programming assignment
        if subject == SubjectType.COMPUTER_SCIENCE and assignment_type == AssignmentType.CODE:
            response = self._format_code_response(response)
        
        return {
            "response": response,
            "key_points": key_points,
            "citations": citations,
            "plagiarism_check": plagiarism_check,
            "metadata": {
                "subject": subject.value,
                "assignment_type": assignment_type.value,
                "model_provider": provider.value
            }
        }

    async def _get_openai_response(self, prompt: List[Dict]) -> str:
        """Get response from OpenAI"""
        try:
            response = await self.openai_client.chat.completions.create(
                model=self.config["openai"]["model"],
                messages=prompt,
                temperature=self.config["openai"]["temperature"],
                max_tokens=self.config["openai"]["max_tokens"],
                top_p=self.config["openai"]["top_p"],
                frequency_penalty=self.config["openai"]["frequency_penalty"],
                presence_penalty=self.config["openai"]["presence_penalty"]
            )
            return response.choices[0].message.content
        except Exception as e:
            logging.error(f"OpenAI API error: {str(e)}")
            raise

    async def _get_anthropic_response(self, prompt: List[Dict]) -> str:
        """Get response from Anthropic"""
        try:
            # Convert chat format to Anthropic format
            system_message = next((msg["content"] for msg in prompt if msg["role"] == "system"), "")
            user_messages = [msg["content"] for msg in prompt if msg["role"] == "user"]
            
            combined_prompt = f"{system_message}\n\n" + "\n".join(user_messages)
            
            response = await self.anthropic_client.messages.create(
                model=self.config["anthropic"]["model"],
                max_tokens=self.config["anthropic"]["max_tokens"],
                temperature=self.config["anthropic"]["temperature"],
                messages=[
                    {
                        "role": "user",
                        "content": combined_prompt
                    }
                ]
            )
            return response.content[0].text
        except Exception as e:
            logging.error(f"Anthropic API error: {str(e)}")
            raise

    async def _get_gemini_response(self, prompt: List[Dict]) -> str:
        """Get response from Google's Gemini"""
        try:
            # Convert chat format to Gemini format
            system_message = next((msg["content"] for msg in prompt if msg["role"] == "system"), "")
            user_messages = [msg["content"] for msg in prompt if msg["role"] == "user"]
            
            combined_prompt = f"{system_message}\n\n" + "\n".join(user_messages)
            
            response = await self.gemini_model.generate_content(
                combined_prompt,
                generation_config={
                    "temperature": self.config["gemini"]["temperature"],
                    "top_k": self.config["gemini"]["top_k"],
                    "top_p": self.config["gemini"]["top_p"]
                }
            )
            return response.text
        except Exception as e:
            logging.error(f"Gemini API error: {str(e)}")
            raise

    def _extract_key_points(self, response: str) -> List[str]:
        """Extract key points from the response"""
        try:
            # Use OpenAI to extract key points
            key_points_prompt = [
                {"role": "system", "content": "Extract the key points from the following text as a list."},
                {"role": "user", "content": response}
            ]
            
            key_points_response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=key_points_prompt,
                temperature=0.3,
                max_tokens=1000
            )
            
            # Parse the response into a list
            key_points_text = key_points_response.choices[0].message.content
            key_points = [point.strip('- ').strip() for point in key_points_text.split('\n') if point.strip()]
            return key_points
        except Exception as e:
            logging.error(f"Error extracting key points: {str(e)}")
            return []

    def _generate_citations(self, response: str) -> List[Dict]:
        """Generate citations for referenced materials"""
        try:
            # Use OpenAI to identify and format citations
            citation_prompt = [
                {"role": "system", "content": "Identify and format citations from the following text in APA style."},
                {"role": "user", "content": response}
            ]
            
            citation_response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=citation_prompt,
                temperature=0.3,
                max_tokens=1000
            )
            
            # Parse the response into structured citations
            citations_text = citation_response.choices[0].message.content
            citations = []
            
            for citation in citations_text.split('\n'):
                if citation.strip():
                    citations.append({
                        "text": citation.strip(),
                        "style": "APA",
                        "type": "reference"
                    })
            
            return citations
        except Exception as e:
            logging.error(f"Error generating citations: {str(e)}")
            return []

    def _check_plagiarism(self, response: str) -> Dict:
        """Check for potential plagiarism"""
        try:
            # Use OpenAI to analyze for potential plagiarism
            plagiarism_prompt = [
                {"role": "system", "content": "Analyze the following text for potential plagiarism indicators."},
                {"role": "user", "content": response}
            ]
            
            plagiarism_response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=plagiarism_prompt,
                temperature=0.3,
                max_tokens=1000
            )
            
            # Parse the response into a structured format
            analysis = plagiarism_response.choices[0].message.content
            
            return {
                "risk_level": self._determine_plagiarism_risk(analysis),
                "analysis": analysis,
                "recommendations": self._generate_plagiarism_recommendations(analysis)
            }
        except Exception as e:
            logging.error(f"Error checking plagiarism: {str(e)}")
            return {
                "risk_level": "unknown",
                "analysis": "Error performing plagiarism check",
                "recommendations": []
            }

    def _determine_plagiarism_risk(self, analysis: str) -> str:
        """Determine plagiarism risk level from analysis"""
        # Simple risk level determination based on keywords
        analysis_lower = analysis.lower()
        if any(word in analysis_lower for word in ["identical", "copied", "exact match"]):
            return "high"
        elif any(word in analysis_lower for word in ["similar", "paraphrased", "potential"]):
            return "medium"
        elif any(word in analysis_lower for word in ["original", "unique", "no indication"]):
            return "low"
        return "unknown"

    def _generate_plagiarism_recommendations(self, analysis: str) -> List[str]:
        """Generate recommendations based on plagiarism analysis"""
        recommendations = []
        analysis_lower = analysis.lower()
        
        if "citation" in analysis_lower or "reference" in analysis_lower:
            recommendations.append("Add proper citations for referenced materials")
        if "paraphrase" in analysis_lower:
            recommendations.append("Rephrase the content in your own words")
        if "quotation" in analysis_lower:
            recommendations.append("Use quotation marks for direct quotes")
        
        return recommendations

    def _format_code_response(self, response: str) -> str:
        """Format code responses with proper syntax highlighting and documentation"""
        try:
            # Use OpenAI to format and document code
            formatting_prompt = [
                {"role": "system", "content": "Format and document the following code according to best practices."},
                {"role": "user", "content": response}
            ]
            
            formatting_response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=formatting_prompt,
                temperature=0.3,
                max_tokens=2000
            )
            
            return formatting_response.choices[0].message.content
        except Exception as e:
            logging.error(f"Error formatting code: {str(e)}")
            return response

    def _format_additional_context(self, context: Dict) -> str:
        """Format additional context into a prompt-friendly string"""
        context_parts = []
        
        if "prerequisites" in context:
            context_parts.append(f"Prerequisites:\n{context['prerequisites']}")
        
        if "constraints" in context:
            context_parts.append(f"Constraints:\n{context['constraints']}")
        
        if "examples" in context:
            context_parts.append(f"Examples:\n{context['examples']}")
        
        if "resources" in context:
            context_parts.append(f"Additional Resources:\n{context['resources']}")
        
        return "\n\n".join(context_parts)

    def _get_fallback_provider(
        self,
        current_provider: ModelProvider,
        subject: SubjectType,
        assignment_type: AssignmentType
    ) -> ModelProvider:
        """Get the next best provider if the current one fails"""
        providers = list(ModelProvider)
        current_index = providers.index(current_provider)
        
        # Try to find a provider with good historical performance
        for provider in providers:
            if provider == current_provider:
                continue
            
            stats = self.performance_metrics["provider_stats"][provider.value]
            if stats["requests"] > 0 and stats["errors"] / stats["requests"] < 0.1:
                return provider
        
        # If no good historical performance, use next provider in list
        next_index = (current_index + 1) % len(providers)
        return providers[next_index]

    async def _evaluate_response_quality(
        self,
        response: str,
        original_query: str,
        subject: SubjectType,
        assignment_type: AssignmentType
    ) -> Dict:
        """Evaluate the quality of the AI response"""
        try:
            evaluation_prompt = [
                {
                    "role": "system",
                    "content": "Evaluate the quality of the following AI response based on relevance, accuracy, completeness, and clarity."
                },
                {
                    "role": "user",
                    "content": f"Original Query: {original_query}\n\nAI Response: {response}"
                }
            ]
            
            evaluation = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=evaluation_prompt,
                temperature=0.3,
                max_tokens=500
            )
            
            # Parse evaluation into structured metrics
            eval_text = evaluation.choices[0].message.content
            
            # Extract scores using regex or simple parsing
            scores = self._parse_quality_scores(eval_text)
            
            return {
                "overall_score": scores["overall"],
                "relevance_score": scores["relevance"],
                "accuracy_score": scores["accuracy"],
                "completeness_score": scores["completeness"],
                "clarity_score": scores["clarity"],
                "detailed_feedback": eval_text
            }
        except Exception as e:
            logging.error(f"Quality evaluation failed: {str(e)}")
            return {
                "overall_score": 0.7,  # Default conservative score
                "detailed_feedback": "Quality evaluation failed"
            }

    def _parse_quality_scores(self, evaluation_text: str) -> Dict[str, float]:
        """Parse quality scores from evaluation text"""
        # Default scores
        scores = {
            "overall": 0.7,
            "relevance": 0.7,
            "accuracy": 0.7,
            "completeness": 0.7,
            "clarity": 0.7
        }
        
        try:
            # Simple parsing based on keywords
            for line in evaluation_text.split('\n'):
                line = line.lower()
                for metric in scores.keys():
                    if metric in line and ':' in line:
                        try:
                            score_text = line.split(':')[1].strip()
                            if '/' in score_text:
                                num, den = map(float, score_text.split('/'))
                                scores[metric] = num / den
                            else:
                                scores[metric] = float(score_text)
                        except (ValueError, IndexError):
                            continue
        except Exception as e:
            logging.error(f"Score parsing failed: {str(e)}")
        
        return scores

    def _update_performance_metrics(self, elapsed_time: float):
        """Update performance metrics with new response time"""
        total_successful = self.performance_metrics["successful_requests"]
        current_avg = self.performance_metrics["average_response_time"]
        
        # Update running average
        self.performance_metrics["average_response_time"] = (
            (current_avg * (total_successful - 1) + elapsed_time) / total_successful
        )

    def _update_provider_preferences(
        self,
        provider: ModelProvider,
        subject: SubjectType,
        assignment_type: AssignmentType,
        quality_score: float
    ):
        """Update provider preferences based on performance"""
        try:
            # Update subject preferences
            subject_prefs = self.config["subject_preferences"].get(subject.value, {})
            current_score = subject_prefs.get("provider_scores", {}).get(provider.value, 0.7)
            new_score = (current_score * 0.9 + quality_score * 0.1)  # Exponential moving average
            
            if subject.value not in self.config["subject_preferences"]:
                self.config["subject_preferences"][subject.value] = {}
            if "provider_scores" not in self.config["subject_preferences"][subject.value]:
                self.config["subject_preferences"][subject.value]["provider_scores"] = {}
            
            self.config["subject_preferences"][subject.value]["provider_scores"][provider.value] = new_score
            
            # Update if this provider becomes the best for this subject
            if new_score > max(
                subject_prefs.get("provider_scores", {}).get(p.value, 0)
                for p in ModelProvider if p != provider
            ):
                self.config["subject_preferences"][subject.value]["preferred_provider"] = provider.value
            
            # Save updated config
            self._save_config()
            
        except Exception as e:
            logging.error(f"Failed to update provider preferences: {str(e)}")

    def _save_config(self):
        """Save the current configuration back to file"""
        try:
            with open("ai_models/config/ai_config.json", 'w') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            logging.error(f"Failed to save config: {str(e)}")

    def _generate_bias_mitigation_prompt(self, original_response: str, recommendations: List[str]) -> str:
        """Generate a prompt for bias mitigation"""
        return f"""Please revise the following response to address potential biases. 
Apply these specific recommendations:
{chr(10).join(f'- {rec}' for rec in recommendations)}

Original response:
{original_response}

Please provide a revised version that maintains the same information while eliminating potential biases."""

class AIVersionControl:
    def __init__(self, version_history_path: str = "ai_models/version_history.json"):
        self.versions: Dict[str, ModelVersion] = {}
        self.performance_history: Dict[str, List[PerformanceMetric]] = {}
        self.version_history_path = version_history_path
        self.current_version: Optional[str] = None
        self.stability_threshold = 0.95
        self.degradation_threshold = 0.15
        self._load_version_history()

    def _load_version_history(self):
        """Load version history from file"""
        try:
            with open(self.version_history_path, 'r') as f:
                data = json.load(f)
                for version_data in data.get('versions', []):
                    version = ModelVersion(
                        version_id=version_data['version_id'],
                        timestamp=datetime.fromisoformat(version_data['timestamp']),
                        config=version_data['config'],
                        checksum=version_data['checksum'],
                        performance_baseline=version_data['performance_baseline'],
                        is_stable=version_data['is_stable'],
                        rollback_version=version_data.get('rollback_version')
                    )
                    self.versions[version.version_id] = version
                self.current_version = data.get('current_version')
        except FileNotFoundError:
            self._initialize_version_history()

    def _initialize_version_history(self):
        """Initialize version history with current configuration"""
        self._save_version_history()

    def _save_version_history(self):
        """Save version history to file"""
        try:
            data = {
                'versions': [
                    {
                        'version_id': v.version_id,
                        'timestamp': v.timestamp.isoformat(),
                        'config': v.config,
                        'checksum': v.checksum,
                        'performance_baseline': v.performance_baseline,
                        'is_stable': v.is_stable,
                        'rollback_version': v.rollback_version
                    }
                    for v in self.versions.values()
                ],
                'current_version': self.current_version
            }
            with open(self.version_history_path, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logging.error(f"Failed to save version history: {str(e)}")

    def create_version(self, config: Dict[str, Any], performance_baseline: float) -> str:
        """Create a new version from current configuration"""
        version_id = self._generate_version_id(config)
        checksum = self._calculate_checksum(config)
        
        version = ModelVersion(
            version_id=version_id,
            timestamp=datetime.now(),
            config=config,
            checksum=checksum,
            performance_baseline=performance_baseline
        )
        
        self.versions[version_id] = version
        if not self.current_version:
            self.current_version = version_id
        
        self._save_version_history()
        return version_id

    def _generate_version_id(self, config: Dict[str, Any]) -> str:
        """Generate a unique version ID based on timestamp and config"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        config_hash = hashlib.md5(json.dumps(config, sort_keys=True).encode()).hexdigest()[:8]
        return f"v{timestamp}_{config_hash}"

    def _calculate_checksum(self, config: Dict[str, Any]) -> str:
        """Calculate checksum for configuration"""
        return hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()

    async def rollback_if_degraded(self, threshold: float) -> Optional[str]:
        """Automatically rollback to last stable version if performance drops"""
        if not self.current_version:
            return None

        current_metrics = self._get_recent_performance_metrics(self.current_version)
        if not current_metrics:
            return None

        current_performance = self._calculate_performance_score(current_metrics)
        current_version = self.versions[self.current_version]

        if current_performance < current_version.performance_baseline * (1 - threshold):
            # Performance has degraded beyond threshold
            stable_version = self._find_last_stable_version()
            if stable_version and stable_version.version_id != self.current_version:
                await self._perform_rollback(stable_version.version_id)
                return stable_version.version_id

        return None

    def _get_recent_performance_metrics(
        self,
        version_id: str,
        window_minutes: int = 30
    ) -> List[PerformanceMetric]:
        """Get recent performance metrics for a version"""
        if version_id not in self.performance_history:
            return []

        cutoff_time = datetime.now() - timedelta(minutes=window_minutes)
        return [
            metric for metric in self.performance_history[version_id]
            if metric.timestamp > cutoff_time
        ]

    def _calculate_performance_score(self, metrics: List[PerformanceMetric]) -> float:
        """Calculate overall performance score from metrics"""
        if not metrics:
            return 0.0

        weights = {
            'success_rate': 0.4,
            'quality_score': 0.3,
            'error_rate': 0.2,
            'response_time': 0.1
        }

        avg_success_rate = sum(m.success_rate for m in metrics) / len(metrics)
        avg_quality_score = sum(m.quality_score for m in metrics) / len(metrics)
        avg_error_rate = sum(m.error_rate for m in metrics) / len(metrics)
        avg_response_time = sum(m.average_response_time for m in metrics) / len(metrics)

        # Normalize response time (lower is better)
        max_acceptable_time = 5.0  # 5 seconds
        normalized_response_time = max(0, 1 - (avg_response_time / max_acceptable_time))

        return (
            weights['success_rate'] * avg_success_rate +
            weights['quality_score'] * avg_quality_score +
            weights['error_rate'] * (1 - avg_error_rate) +  # Invert error rate
            weights['response_time'] * normalized_response_time
        )

    def _find_last_stable_version(self) -> Optional[ModelVersion]:
        """Find the last stable version to rollback to"""
        stable_versions = [
            v for v in self.versions.values()
            if v.is_stable and v.version_id != self.current_version
        ]
        
        if not stable_versions:
            return None
            
        return max(stable_versions, key=lambda v: v.timestamp)

    async def _perform_rollback(self, target_version_id: str):
        """Perform rollback to a specific version"""
        if target_version_id not in self.versions:
            raise ValueError(f"Version {target_version_id} not found")

        target_version = self.versions[target_version_id]
        current_version = self.versions[self.current_version]

        # Update version metadata
        current_version.is_stable = False
        current_version.rollback_version = target_version_id
        self.current_version = target_version_id

        # Save changes
        self._save_version_history()

    def add_performance_metric(
        self,
        version_id: str,
        success_rate: float,
        average_response_time: float,
        error_rate: float,
        quality_score: float,
        request_count: int
    ):
        """Add a new performance metric for a version"""
        if version_id not in self.versions:
            raise ValueError(f"Version {version_id} not found")

        metric = PerformanceMetric(
            timestamp=datetime.now(),
            success_rate=success_rate,
            average_response_time=average_response_time,
            error_rate=error_rate,
            quality_score=quality_score,
            request_count=request_count
        )

        if version_id not in self.performance_history:
            self.performance_history[version_id] = []

        self.performance_history[version_id].append(metric)
        self._update_version_stability(version_id)

    def _update_version_stability(self, version_id: str):
        """Update version stability based on recent performance"""
        recent_metrics = self._get_recent_performance_metrics(version_id)
        if not recent_metrics:
            return

        performance_score = self._calculate_performance_score(recent_metrics)
        version = self.versions[version_id]

        # Update stability flag based on performance
        version.is_stable = performance_score >= self.stability_threshold
        self._save_version_history()

class ABTesting:
    def __init__(self):
        self.experiments: Dict[str, Experiment] = {}
        self.statistical_significance: Dict[str, float] = {}
        self.min_sample_size = 100
        self.default_confidence_level = 0.95
        
    async def create_experiment(
        self,
        control_version: str,
        variant_version: str,
        sample_size: int = None,
        confidence_level: float = None
    ) -> str:
        """Create a new A/B test experiment"""
        experiment_id = f"exp_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.experiments[experiment_id] = Experiment(
            id=experiment_id,
            control_version=control_version,
            variant_version=variant_version,
            start_time=datetime.now(),
            end_time=None,
            sample_size=sample_size or self.min_sample_size,
            confidence_level=confidence_level or self.default_confidence_level,
            metrics={
                'success_rate': [],
                'response_time': [],
                'quality_score': [],
                'user_satisfaction': []
            }
        )
        
        return experiment_id
        
    async def record_metric(
        self,
        experiment_id: str,
        metric_name: str,
        value: float,
        is_control: bool
    ):
        """Record a metric value for an experiment"""
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
            
        experiment = self.experiments[experiment_id]
        if not experiment.is_active:
            raise ValueError(f"Experiment {experiment_id} is not active")
            
        if metric_name not in experiment.metrics:
            experiment.metrics[metric_name] = []
            
        experiment.metrics[metric_name].append(value)
        
        # Check if we have enough data for statistical significance
        if len(experiment.metrics[metric_name]) >= experiment.sample_size:
            await self._analyze_significance(experiment_id, metric_name)
            
    async def _analyze_significance(self, experiment_id: str, metric_name: str):
        """Analyze statistical significance of experiment results"""
        experiment = self.experiments[experiment_id]
        metrics = experiment.metrics[metric_name]
        
        if len(metrics) < experiment.sample_size:
            return
            
        # Split data into control and variant groups
        mid_point = len(metrics) // 2
        control_data = metrics[:mid_point]
        variant_data = metrics[mid_point:]
        
        # Calculate t-test for statistical significance
        t_stat, p_value = self._calculate_t_test(control_data, variant_data)
        
        # Store significance result
        self.statistical_significance[f"{experiment_id}_{metric_name}"] = p_value
        
        # Check if experiment should be concluded
        if p_value < (1 - experiment.confidence_level):
            await self._conclude_experiment(experiment_id, metric_name)
            
    def _calculate_t_test(self, control_data: List[float], variant_data: List[float]) -> tuple:
        """Calculate t-test statistics"""
        import numpy as np
        from scipy import stats
        
        return stats.ttest_ind(control_data, variant_data)
        
    async def _conclude_experiment(self, experiment_id: str, metric_name: str):
        """Conclude an experiment and determine the winner"""
        experiment = self.experiments[experiment_id]
        metrics = experiment.metrics[metric_name]
        
        mid_point = len(metrics) // 2
        control_mean = sum(metrics[:mid_point]) / mid_point
        variant_mean = sum(metrics[mid_point:]) / (len(metrics) - mid_point)
        
        experiment.is_active = False
        experiment.end_time = datetime.now()
        
        # Return the version that performed better
        return experiment.variant_version if variant_mean > control_mean else experiment.control_version
        
    async def get_experiment_results(self, experiment_id: str) -> Dict:
        """Get detailed results for an experiment"""
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
            
        experiment = self.experiments[experiment_id]
        results = {
            'experiment_id': experiment_id,
            'status': 'active' if experiment.is_active else 'concluded',
            'duration': (experiment.end_time or datetime.now()) - experiment.start_time,
            'metrics': {}
        }
        
        for metric_name, values in experiment.metrics.items():
            if len(values) > 0:
                mid_point = len(values) // 2
                results['metrics'][metric_name] = {
                    'control_mean': sum(values[:mid_point]) / mid_point if mid_point > 0 else 0,
                    'variant_mean': sum(values[mid_point:]) / (len(values) - mid_point) if mid_point < len(values) else 0,
                    'significance': self.statistical_significance.get(f"{experiment_id}_{metric_name}")
                }
                
        return results

class BiasDetector:
    def __init__(self):
        self.bias_patterns = self._load_bias_patterns()
        self.mitigation_strategies = self._load_mitigation_strategies()
        self.bias_threshold = 0.3
        self.severity_weights = {
            "high": 1.0,
            "medium": 0.6,
            "low": 0.3
        }
        
    def _load_bias_patterns(self) -> List[BiasPattern]:
        """Load predefined bias patterns"""
        return [
            BiasPattern(
                name="gender_bias",
                pattern=r"\b(he|she|his|her|man|woman)\b",
                category="demographic",
                severity=0.8,
                description="Gender-specific language that may reinforce stereotypes",
                mitigation_strategy="use_gender_neutral"
            ),
            BiasPattern(
                name="racial_bias",
                pattern=r"\b(race|ethnic|cultural|minority)\b",
                category="demographic",
                severity=0.9,
                description="Language that may perpetuate racial stereotypes",
                mitigation_strategy="use_inclusive_language"
            ),
            BiasPattern(
                name="age_bias",
                pattern=r"\b(young|old|elderly|age)\b",
                category="demographic",
                severity=0.7,
                description="Age-related assumptions or stereotypes",
                mitigation_strategy="use_age_neutral"
            ),
            BiasPattern(
                name="socioeconomic_bias",
                pattern=r"\b(rich|poor|wealthy|privileged)\b",
                category="social",
                severity=0.8,
                description="Language that may discriminate based on economic status",
                mitigation_strategy="use_neutral_economic_terms"
            ),
            BiasPattern(
                name="educational_bias",
                pattern=r"\b(educated|uneducated|academic|degree)\b",
                category="social",
                severity=0.7,
                description="Assumptions about educational background",
                mitigation_strategy="focus_on_skills"
            )
        ]
        
    def _load_mitigation_strategies(self) -> Dict[str, MitigationStrategy]:
        """Load bias mitigation strategies"""
        return {
            "use_gender_neutral": MitigationStrategy(
                name="Use Gender-Neutral Language",
                description="Replace gender-specific terms with neutral alternatives",
                action="Replace gendered terms with neutral ones (e.g., 'they' instead of 'he/she')",
                effectiveness=0.9
            ),
            "use_inclusive_language": MitigationStrategy(
                name="Use Inclusive Language",
                description="Ensure language respects all cultural backgrounds",
                action="Use culturally sensitive and inclusive terminology",
                effectiveness=0.85
            ),
            "use_age_neutral": MitigationStrategy(
                name="Use Age-Neutral Language",
                description="Avoid age-related assumptions",
                action="Focus on capabilities rather than age-related characteristics",
                effectiveness=0.8
            ),
            "use_neutral_economic_terms": MitigationStrategy(
                name="Use Socioeconomically Neutral Terms",
                description="Avoid assumptions about economic status",
                action="Focus on specific circumstances rather than economic generalizations",
                effectiveness=0.85
            ),
            "focus_on_skills": MitigationStrategy(
                name="Focus on Skills and Abilities",
                description="Emphasize capabilities rather than credentials",
                action="Describe specific skills and knowledge rather than educational status",
                effectiveness=0.9
            )
        }
        
    async def analyze_response(self, response: str) -> BiasReport:
        """Analyze response for potential biases"""
        import re
        
        detected_biases = []
        total_severity = 0
        
        # Analyze for each bias pattern
        for pattern in self.bias_patterns:
            matches = re.finditer(pattern.pattern, response, re.IGNORECASE)
            matches_list = list(matches)
            
            if matches_list:
                bias_info = {
                    "name": pattern.name,
                    "category": pattern.category,
                    "severity": pattern.severity,
                    "instances": len(matches_list),
                    "examples": [m.group() for m in matches_list],
                    "mitigation": self.mitigation_strategies[pattern.mitigation_strategy]
                }
                detected_biases.append(bias_info)
                total_severity += pattern.severity * len(matches_list)
        
        # Calculate overall bias score
        num_patterns = len(self.bias_patterns)
        max_possible_severity = sum(p.severity for p in self.bias_patterns)
        overall_bias_score = total_severity / max_possible_severity if max_possible_severity > 0 else 0
        
        # Generate recommendations
        recommendations = self._generate_recommendations(detected_biases)
        
        # Prepare analysis details
        analysis_details = {
            "analyzed_patterns": len(self.bias_patterns),
            "detected_categories": list(set(b["category"] for b in detected_biases)),
            "severity_distribution": self._calculate_severity_distribution(detected_biases),
            "mitigation_effectiveness": self._calculate_mitigation_effectiveness(detected_biases)
        }
        
        return BiasReport(
            detected_biases=detected_biases,
            overall_bias_score=overall_bias_score,
            recommendations=recommendations,
            analysis_details=analysis_details
        )
        
    def _generate_recommendations(self, detected_biases: List[Dict]) -> List[str]:
        """Generate specific recommendations for addressing detected biases"""
        recommendations = []
        
        for bias in detected_biases:
            strategy = bias["mitigation"]
            recommendations.append(
                f"For {bias['name']} ({bias['instances']} instances): {strategy.action}"
            )
            
        if not recommendations:
            recommendations.append("No specific bias patterns detected. Continue monitoring for potential subtle biases.")
            
        return recommendations
        
    def _calculate_severity_distribution(self, detected_biases: List[Dict]) -> Dict[str, float]:
        """Calculate the distribution of bias severities"""
        severity_counts = {"high": 0, "medium": 0, "low": 0}
        
        for bias in detected_biases:
            if bias["severity"] >= 0.8:
                severity_counts["high"] += bias["instances"]
            elif bias["severity"] >= 0.5:
                severity_counts["medium"] += bias["instances"]
            else:
                severity_counts["low"] += bias["instances"]
                
        total = sum(severity_counts.values())
        if total > 0:
            return {k: v/total for k, v in severity_counts.items()}
        return severity_counts
        
    def _calculate_mitigation_effectiveness(self, detected_biases: List[Dict]) -> float:
        """Calculate the potential effectiveness of proposed mitigations"""
        if not detected_biases:
            return 1.0
            
        total_effectiveness = sum(
            bias["mitigation"].effectiveness * bias["instances"]
            for bias in detected_biases
        )
        total_instances = sum(bias["instances"] for bias in detected_biases)
        
        return total_effectiveness / total_instances if total_instances > 0 else 1.0

class ResourceManager:
    def __init__(self):
        self.resource_pool: Dict[str, Resource] = {}
        self.allocation_history: List[ResourceAllocation] = []
        self.active_allocations: Dict[str, ResourceAllocation] = {}
        self.allocation_strategies: Dict[str, AllocationStrategy] = self._initialize_strategies()
        self.current_strategy: str = "balanced"
        self.monitoring_interval: int = 60  # seconds
        self.utilization_threshold: float = 0.8
        self.scale_up_threshold: float = 0.75
        self.scale_down_threshold: float = 0.3
        
    def _initialize_strategies(self) -> Dict[str, AllocationStrategy]:
        """Initialize resource allocation strategies"""
        return {
            "balanced": AllocationStrategy(
                name="balanced",
                priority_weights={"high": 0.5, "medium": 0.3, "low": 0.2},
                constraints=["capacity", "availability", "cost"],
                optimization_goal="efficiency"
            ),
            "performance": AllocationStrategy(
                name="performance",
                priority_weights={"high": 0.7, "medium": 0.2, "low": 0.1},
                constraints=["capacity", "latency"],
                optimization_goal="speed"
            ),
            "cost_effective": AllocationStrategy(
                name="cost_effective",
                priority_weights={"high": 0.4, "medium": 0.4, "low": 0.2},
                constraints=["cost", "efficiency"],
                optimization_goal="cost"
            )
        }
        
    async def add_resource(self, resource: Resource):
        """Add a new resource to the pool"""
        self.resource_pool[resource.id] = resource
        await self._update_resource_metrics(resource.id)
        
    async def remove_resource(self, resource_id: str):
        """Remove a resource from the pool"""
        if resource_id in self.resource_pool:
            # Reallocate any active allocations
            affected_allocations = [
                alloc for alloc in self.active_allocations.values()
                if alloc.resource_id == resource_id
            ]
            for allocation in affected_allocations:
                await self._reallocate(allocation)
            del self.resource_pool[resource_id]
            
    async def optimize_allocation(self, demand: Demand) -> ResourceAllocation:
        """Dynamically allocate resources based on demand"""
        strategy = self.allocation_strategies[self.current_strategy]
        
        # Find best matching resource
        best_resource = await self._find_best_resource(demand, strategy)
        if not best_resource:
            # Handle resource shortage
            await self._handle_resource_shortage(demand)
            best_resource = await self._find_best_resource(demand, strategy)
            if not best_resource:
                raise ResourceError("No suitable resources available")
        
        # Create allocation
        allocation = ResourceAllocation(
            resource_id=best_resource.id,
            allocated_capacity=demand.required_capacity,
            start_time=datetime.now(),
            duration=self._calculate_duration(demand),
            priority=demand.priority,
            constraints=demand.constraints
        )
        
        # Update resource status
        best_resource.used += demand.required_capacity
        best_resource.last_updated = datetime.now()
        
        # Record allocation
        self.active_allocations[allocation.resource_id] = allocation
        self.allocation_history.append(allocation)
        
        # Check if optimization is needed
        await self._check_optimization_needed()
        
        return allocation
        
    async def _find_best_resource(
        self,
        demand: Demand,
        strategy: AllocationStrategy
    ) -> Optional[Resource]:
        """Find the best resource for the given demand"""
        available_resources = [
            r for r in self.resource_pool.values()
            if r.capacity - r.used >= demand.required_capacity
            and r.status == "available"
        ]
        
        if not available_resources:
            return None
            
        # Score resources based on strategy
        scored_resources = []
        for resource in available_resources:
            score = self._calculate_resource_score(resource, demand, strategy)
            scored_resources.append((score, resource))
            
        # Return the resource with the highest score
        return max(scored_resources, key=lambda x: x[0])[1] if scored_resources else None
        
    def _calculate_resource_score(
        self,
        resource: Resource,
        demand: Demand,
        strategy: AllocationStrategy
    ) -> float:
        """Calculate a score for a resource based on the strategy"""
        score = 0.0
        
        # Capacity score
        available_capacity = resource.capacity - resource.used
        capacity_score = available_capacity / resource.capacity
        score += capacity_score * strategy.priority_weights["high"]
        
        # Performance score
        performance_score = resource.metrics.get("performance", 0.5)
        score += performance_score * strategy.priority_weights["medium"]
        
        # Cost efficiency score
        cost_efficiency = resource.metrics.get("cost_efficiency", 0.5)
        score += cost_efficiency * strategy.priority_weights["low"]
        
        # Apply constraint penalties
        for constraint in strategy.constraints:
            if constraint in demand.constraints:
                required = demand.constraints[constraint]
                actual = resource.metrics.get(constraint, 0)
                if actual < required:
                    score *= 0.5
                    
        return score
        
    async def _handle_resource_shortage(self, demand: Demand):
        """Handle resource shortage by scaling or optimizing"""
        # Check if we can scale up
        if self._should_scale_up():
            await self._request_scale_up()
            
        # Try to optimize existing allocations
        await self._optimize_current_allocations()
        
        # Check if we can preempt lower priority allocations
        if demand.priority == 1:  # High priority
            await self._preempt_low_priority_allocations()
            
    def _should_scale_up(self) -> bool:
        """Determine if scaling up is needed"""
        total_capacity = sum(r.capacity for r in self.resource_pool.values())
        total_used = sum(r.used for r in self.resource_pool.values())
        
        return total_used / total_capacity > self.scale_up_threshold if total_capacity > 0 else True
        
    async def _request_scale_up(self):
        """Request additional resources"""
        # Implementation would depend on cloud provider or infrastructure
        pass
        
    async def _optimize_current_allocations(self):
        """Optimize current resource allocations"""
        # Group allocations by priority
        priority_groups = {}
        for allocation in self.active_allocations.values():
            if allocation.priority not in priority_groups:
                priority_groups[allocation.priority] = []
            priority_groups[allocation.priority].append(allocation)
            
        # Try to consolidate resources
        for priority in sorted(priority_groups.keys()):
            allocations = priority_groups[priority]
            await self._consolidate_allocations(allocations)
            
    async def _consolidate_allocations(self, allocations: List[ResourceAllocation]):
        """Consolidate allocations to optimize resource usage"""
        # Sort resources by utilization
        resources = sorted(
            self.resource_pool.values(),
            key=lambda r: r.used / r.capacity
        )
        
        # Try to move allocations to more efficient resources
        for allocation in allocations:
            current_resource = self.resource_pool[allocation.resource_id]
            for target_resource in resources:
                if (target_resource.id != current_resource.id and
                    target_resource.capacity - target_resource.used >= allocation.allocated_capacity):
                    # Move allocation
                    current_resource.used -= allocation.allocated_capacity
                    target_resource.used += allocation.allocated_capacity
                    allocation.resource_id = target_resource.id
                    break
                    
    async def _preempt_low_priority_allocations(self):
        """Preempt low priority allocations for high priority demands"""
        low_priority_allocations = [
            alloc for alloc in self.active_allocations.values()
            if alloc.priority > 2  # Priority 3 or lower
        ]
        
        for allocation in low_priority_allocations:
            resource = self.resource_pool[allocation.resource_id]
            resource.used -= allocation.allocated_capacity
            del self.active_allocations[allocation.resource_id]
            
    async def _update_resource_metrics(self, resource_id: str):
        """Update metrics for a resource"""
        resource = self.resource_pool[resource_id]
        
        # Update basic metrics
        resource.metrics.update({
            "utilization": resource.used / resource.capacity,
            "availability": 1.0 - (resource.used / resource.capacity),
            "last_updated": datetime.now().timestamp()
        })
        
        # Update performance metrics
        await self._update_performance_metrics(resource)
        
    async def _update_performance_metrics(self, resource: Resource):
        """Update performance-related metrics for a resource"""
        # These metrics would be gathered from actual monitoring systems
        resource.metrics.update({
            "latency": random.uniform(0.1, 1.0),  # Example metric
            "throughput": random.uniform(0.5, 1.0),  # Example metric
            "error_rate": random.uniform(0.0, 0.1),  # Example metric
            "cost_efficiency": random.uniform(0.6, 1.0)  # Example metric
        })
        
    def _calculate_duration(self, demand: Demand) -> timedelta:
        """Calculate expected duration for a demand"""
        if demand.deadline:
            return demand.deadline - datetime.now()
        
        # Default durations based on request type
        default_durations = {
            "short": timedelta(minutes=5),
            "medium": timedelta(minutes=15),
            "long": timedelta(hours=1)
        }
        
        return default_durations.get(demand.request_type, timedelta(minutes=10))
        
    async def _check_optimization_needed(self):
        """Check if resource optimization is needed"""
        total_capacity = sum(r.capacity for r in self.resource_pool.values())
        total_used = sum(r.used for r in self.resource_pool.values())
        
        if total_capacity > 0:
            utilization = total_used / total_capacity
            if utilization > self.utilization_threshold:
                await self._optimize_current_allocations()
            elif utilization < self.scale_down_threshold:
                await self._consider_scale_down()
                
    async def _consider_scale_down(self):
        """Consider scaling down resources"""
        # Find underutilized resources
        underutilized = [
            r for r in self.resource_pool.values()
            if r.used / r.capacity < self.scale_down_threshold
        ]
        
        if len(underutilized) > 1:  # Keep at least one resource
            # Sort by utilization (ascending)
            underutilized.sort(key=lambda r: r.used / r.capacity)
            
            # Remove the most underutilized resources
            for resource in underutilized[:-1]:  # Keep the last one
                await self.remove_resource(resource.id)

class ResourceError(Exception):
    """Custom exception for resource-related errors"""
    pass

class IdentityVerifier:
    def __init__(self):
        self.active_sessions: Dict[str, SecurityContext] = {}
        self.trust_scores: Dict[str, float] = {}
        self.authentication_history: List[Dict] = []
        self.risk_threshold: float = 0.7
        self.mfa_required_threshold: float = 0.5
        
    async def verify_identity(
        self,
        credentials: Dict[str, str],
        context: SecurityContext
    ) -> SecurityVerdict:
        """Verify user identity with multi-factor authentication"""
        try:
            # Validate basic credentials
            if not await self._validate_credentials(credentials):
                return SecurityVerdict(
                    is_approved=False,
                    confidence=0.0,
                    reason="Invalid credentials",
                    risk_level="high",
                    timestamp=datetime.now(),
                    metadata={"auth_method": "credentials"}
                )
            
            # Calculate initial trust score
            trust_score = await self._calculate_trust_score(context)
            
            # Determine if MFA is required
            if trust_score < self.mfa_required_threshold:
                mfa_result = await self._verify_mfa(context)
                if not mfa_result:
                    return SecurityVerdict(
                        is_approved=False,
                        confidence=trust_score,
                        reason="MFA verification failed",
                        risk_level="high",
                        timestamp=datetime.now(),
                        metadata={"auth_method": "mfa"}
                    )
                trust_score = (trust_score + 1.0) / 2  # Boost trust score after successful MFA
            
            # Update session and history
            self.active_sessions[context.session_id] = context
            self.trust_scores[context.user_id] = trust_score
            self.authentication_history.append({
                "user_id": context.user_id,
                "timestamp": datetime.now(),
                "trust_score": trust_score,
                "context": context
            })
            
            return SecurityVerdict(
                is_approved=trust_score >= self.risk_threshold,
                confidence=trust_score,
                reason="Identity verified",
                risk_level="low" if trust_score >= 0.8 else "medium",
                timestamp=datetime.now(),
                metadata={
                    "auth_method": "full",
                    "mfa_verified": trust_score < self.mfa_required_threshold
                }
            )
            
        except Exception as e:
            logging.error(f"Identity verification failed: {str(e)}")
            return SecurityVerdict(
                is_approved=False,
                confidence=0.0,
                reason=f"Verification error: {str(e)}",
                risk_level="high",
                timestamp=datetime.now(),
                metadata={"error": str(e)}
            )
            
    async def _validate_credentials(self, credentials: Dict[str, str]) -> bool:
        """Validate user credentials"""
        # Implementation would include password hashing and validation
        return True
        
    async def _calculate_trust_score(self, context: SecurityContext) -> float:
        """Calculate trust score based on context"""
        score = 0.0
        weights = {
            "authentication_method": 0.3,
            "device_trust": 0.2,
            "location_trust": 0.2,
            "historical_trust": 0.3
        }
        
        # Authentication method score
        auth_scores = {
            "password": 0.5,
            "mfa": 0.8,
            "biometric": 0.9,
            "certificate": 0.95
        }
        score += weights["authentication_method"] * auth_scores.get(
            context.authentication_method,
            0.3
        )
        
        # Device trust score
        device_score = await self._calculate_device_trust(context.device_info)
        score += weights["device_trust"] * device_score
        
        # Location trust score
        location_score = await self._calculate_location_trust(context.ip_address)
        score += weights["location_trust"] * location_score
        
        # Historical trust score
        historical_score = self.trust_scores.get(context.user_id, 0.5)
        score += weights["historical_trust"] * historical_score
        
        return min(1.0, max(0.0, score))
        
    async def _calculate_device_trust(self, device_info: Dict[str, str]) -> float:
        """Calculate device trust score"""
        score = 0.5  # Base score
        
        if device_info.get("is_managed", "false") == "true":
            score += 0.3
        if device_info.get("is_encrypted", "false") == "true":
            score += 0.2
        if device_info.get("has_antivirus", "false") == "true":
            score += 0.1
        if device_info.get("is_updated", "false") == "true":
            score += 0.1
            
        return min(1.0, score)
        
    async def _calculate_location_trust(self, ip_address: str) -> float:
        """Calculate location trust score"""
        # Implementation would include IP reputation checking
        return 0.8
        
    async def _verify_mfa(self, context: SecurityContext) -> bool:
        """Verify multi-factor authentication"""
        # Implementation would include actual MFA verification
        return True

class AccessControl:
    def __init__(self):
        self.policies: Dict[str, AccessPolicy] = {}
        self.role_hierarchy: Dict[str, List[str]] = {}
        self.permission_sets: Dict[str, List[str]] = {}
        
    async def check_access(
        self,
        context: SecurityContext,
        resource: str,
        action: str
    ) -> SecurityVerdict:
        """Check if access should be granted"""
        try:
            # Find applicable policies
            policies = self._find_applicable_policies(resource)
            if not policies:
                return SecurityVerdict(
                    is_approved=False,
                    confidence=1.0,
                    reason="No applicable policies",
                    risk_level="high",
                    timestamp=datetime.now(),
                    metadata={"resource": resource, "action": action}
                )
            
            # Check each policy
            for policy in policies:
                verdict = await self._evaluate_policy(policy, context, action)
                if verdict.is_approved:
                    return verdict
            
            # No policy approved access
            return SecurityVerdict(
                is_approved=False,
                confidence=1.0,
                reason="Access denied by policies",
                risk_level="medium",
                timestamp=datetime.now(),
                metadata={
                    "resource": resource,
                    "action": action,
                    "failed_policies": [p.name for p in policies]
                }
            )
            
        except Exception as e:
            logging.error(f"Access control check failed: {str(e)}")
            return SecurityVerdict(
                is_approved=False,
                confidence=0.0,
                reason=f"Access control error: {str(e)}",
                risk_level="high",
                timestamp=datetime.now(),
                metadata={"error": str(e)}
            )
            
    def _find_applicable_policies(self, resource: str) -> List[AccessPolicy]:
        """Find policies applicable to a resource"""
        return [
            policy for policy in self.policies.values()
            if self._matches_resource_pattern(resource, policy.resource_pattern)
        ]
        
    def _matches_resource_pattern(self, resource: str, pattern: str) -> bool:
        """Check if resource matches a pattern"""
        # Implementation would include pattern matching
        return True
        
    async def _evaluate_policy(
        self,
        policy: AccessPolicy,
        context: SecurityContext,
        action: str
    ) -> SecurityVerdict:
        """Evaluate a single access policy"""
        # Check roles
        if not self._has_required_roles(context.roles, policy.required_roles):
            return SecurityVerdict(
                is_approved=False,
                confidence=1.0,
                reason="Missing required roles",
                risk_level="medium",
                timestamp=datetime.now(),
                metadata={"policy": policy.name}
            )
        
        # Check permissions
        if not self._has_required_permissions(
            context.permissions,
            policy.required_permissions
        ):
            return SecurityVerdict(
                is_approved=False,
                confidence=1.0,
                reason="Missing required permissions",
                risk_level="medium",
                timestamp=datetime.now(),
                metadata={"policy": policy.name}
            )
        
        # Check conditions
        if not await self._evaluate_conditions(policy.conditions, context, action):
            return SecurityVerdict(
                is_approved=False,
                confidence=1.0,
                reason="Conditions not met",
                risk_level="medium",
                timestamp=datetime.now(),
                metadata={"policy": policy.name}
            )
        
        # Check risk threshold
        if context.trust_score < policy.risk_threshold:
            return SecurityVerdict(
                is_approved=False,
                confidence=1.0,
                reason="Trust score below threshold",
                risk_level="high",
                timestamp=datetime.now(),
                metadata={
                    "policy": policy.name,
                    "trust_score": context.trust_score,
                    "threshold": policy.risk_threshold
                }
            )
        
        return SecurityVerdict(
            is_approved=True,
            confidence=1.0,
            reason="Access granted",
            risk_level="low",
            timestamp=datetime.now(),
            metadata={"policy": policy.name}
        )
        
    def _has_required_roles(
        self,
        user_roles: List[str],
        required_roles: List[str]
    ) -> bool:
        """Check if user has required roles"""
        effective_roles = set(user_roles)
        for role in user_roles:
            effective_roles.update(self.role_hierarchy.get(role, []))
        return all(role in effective_roles for role in required_roles)
        
    def _has_required_permissions(
        self,
        user_permissions: List[str],
        required_permissions: List[str]
    ) -> bool:
        """Check if user has required permissions"""
        effective_permissions = set(user_permissions)
        for permission in user_permissions:
            effective_permissions.update(self.permission_sets.get(permission, []))
        return all(perm in effective_permissions for perm in required_permissions)
        
    async def _evaluate_conditions(
        self,
        conditions: Dict[str, Any],
        context: SecurityContext,
        action: str
    ) -> bool:
        """Evaluate policy conditions"""
        # Implementation would include condition evaluation
        return True

class NetworkSegmenter:
    def __init__(self):
        self.segments: Dict[str, NetworkSegment] = {}
        self.connection_rules: Dict[str, List[str]] = {}
        self.default_segment: str = "untrusted"
        
    async def verify_connection(
        self,
        source_segment: str,
        target_segment: str,
        context: SecurityContext
    ) -> SecurityVerdict:
        """Verify if connection between segments is allowed"""
        try:
            source = self.segments.get(source_segment)
            target = self.segments.get(target_segment)
            
            if not source or not target:
                return SecurityVerdict(
                    is_approved=False,
                    confidence=1.0,
                    reason="Invalid segment",
                    risk_level="high",
                    timestamp=datetime.now(),
                    metadata={
                        "source": source_segment,
                        "target": target_segment
                    }
                )
            
            # Check trust levels
            if source.trust_level < target.trust_level:
                return SecurityVerdict(
                    is_approved=False,
                    confidence=1.0,
                    reason="Insufficient trust level",
                    risk_level="high",
                    timestamp=datetime.now(),
                    metadata={
                        "source_trust": source.trust_level,
                        "target_trust": target.trust_level
                    }
                )
            
            # Check allowed connections
            if target.id not in source.allowed_connections:
                return SecurityVerdict(
                    is_approved=False,
                    confidence=1.0,
                    reason="Connection not allowed",
                    risk_level="high",
                    timestamp=datetime.now(),
                    metadata={
                        "source": source.id,
                        "target": target.id
                    }
                )
            
            # Verify security controls
            if not await self._verify_security_controls(source, target, context):
                return SecurityVerdict(
                    is_approved=False,
                    confidence=1.0,
                    reason="Security controls not satisfied",
                    risk_level="high",
                    timestamp=datetime.now(),
                    metadata={
                        "source_controls": source.security_controls,
                        "target_controls": target.security_controls
                    }
                )
            
            return SecurityVerdict(
                is_approved=True,
                confidence=1.0,
                reason="Connection allowed",
                risk_level="low",
                timestamp=datetime.now(),
                metadata={
                    "source": source.id,
                    "target": target.id,
                    "monitoring_level": target.monitoring_level
                }
            )
            
        except Exception as e:
            logging.error(f"Network segmentation check failed: {str(e)}")
            return SecurityVerdict(
                is_approved=False,
                confidence=0.0,
                reason=f"Segmentation error: {str(e)}",
                risk_level="high",
                timestamp=datetime.now(),
                metadata={"error": str(e)}
            )
            
    async def _verify_security_controls(
        self,
        source: NetworkSegment,
        target: NetworkSegment,
        context: SecurityContext
    ) -> bool:
        """Verify security controls between segments"""
        required_controls = set(target.security_controls)
        available_controls = set(source.security_controls)
        
        # Check if all required controls are available
        return required_controls.issubset(available_controls)

class ZeroTrustFramework:
    def __init__(self):
        self.identity_verification = IdentityVerifier()
        self.access_control = AccessControl()
        self.network_segmentation = NetworkSegmenter()
        self.security_context_cache: Dict[str, SecurityContext] = {}
        self.verification_history: List[SecurityVerdict] = []
        
    async def verify_request(self, request: Request) -> SecurityVerdict:
        """Implement zero-trust verification for each request"""
        try:
            # Extract security context
            context = await self._extract_security_context(request)
            
            # Verify identity
            identity_verdict = await self.identity_verification.verify_identity(
                request.credentials,
                context
            )
            if not identity_verdict.is_approved:
                return identity_verdict
            
            # Check access control
            access_verdict = await self.access_control.check_access(
                context,
                request.resource,
                request.action
            )
            if not access_verdict.is_approved:
                return access_verdict
            
            # Verify network segmentation
            segment_verdict = await self.network_segmentation.verify_connection(
                request.source_segment,
                request.target_segment,
                context
            )
            if not segment_verdict.is_approved:
                return segment_verdict
            
            # All checks passed
            verdict = SecurityVerdict(
                is_approved=True,
                confidence=min(
                    identity_verdict.confidence,
                    access_verdict.confidence,
                    segment_verdict.confidence
                ),
                reason="All security checks passed",
                risk_level="low",
                timestamp=datetime.now(),
                metadata={
                    "identity_score": identity_verdict.confidence,
                    "access_score": access_verdict.confidence,
                    "segment_score": segment_verdict.confidence
                }
            )
            
            # Update history
            self.verification_history.append(verdict)
            
            return verdict
            
        except Exception as e:
            logging.error(f"Zero-trust verification failed: {str(e)}")
            return SecurityVerdict(
                is_approved=False,
                confidence=0.0,
                reason=f"Verification error: {str(e)}",
                risk_level="high",
                timestamp=datetime.now(),
                metadata={"error": str(e)}
            )
            
    async def _extract_security_context(self, request: Request) -> SecurityContext:
        """Extract security context from request"""
        # Check cache first
        if request.session_id in self.security_context_cache:
            return self.security_context_cache[request.session_id]
        
        # Create new context
        context = SecurityContext(
            user_id=request.user_id,
            roles=request.roles,
            permissions=request.permissions,
            session_id=request.session_id,
            ip_address=request.ip_address,
            device_info=request.device_info,
            authentication_method=request.auth_method,
            trust_score=0.0  # Initial score
        )
        
        # Cache context
        self.security_context_cache[request.session_id] = context
        
        return context
