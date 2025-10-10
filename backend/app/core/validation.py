from typing import Dict, Any, List, Optional
from app.core.config import settings

def get_subscription_token_limit(subscription_plan: str) -> int:
    """Get maximum token limit for a subscription plan"""
    limits = {
        'free': 100000,
        'plus': 200000,
        'pro': 400000,
        'max': 800000
    }
    return limits.get(subscription_plan, 100000)

def validate_ai_settings(ai_settings: Dict[str, Any], subscription_plan: str = 'free') -> List[str]:
    """Validate AI settings and return list of errors"""
    errors = []
    
    if not ai_settings:
        return errors
    
    # Validate token context limit
    token_limit = ai_settings.get('tokenContextLimit')
    if token_limit is not None:
        max_allowed = get_subscription_token_limit(subscription_plan)
        if not isinstance(token_limit, (int, float)) or token_limit < 1000 or token_limit > max_allowed:
            errors.append(f"Token context limit must be between 1,000 and {max_allowed:,}")
    
    # Validate temperature
    temperature = ai_settings.get('temperature')
    if temperature is not None:
        try:
            temp_value = float(temperature)
            if temp_value < 0 or temp_value > 1:
                errors.append("Temperature must be between 0 and 1")
        except (ValueError, TypeError):
            errors.append("Temperature must be a valid number")
    
    # Validate context length
    context_length = ai_settings.get('contextLength')
    if context_length is not None:
        if not isinstance(context_length, int) or context_length < 1 or context_length > 20:
            errors.append("Context length must be between 1 and 20")
    
    return errors

def sanitize_ai_settings(ai_settings: Dict[str, Any], subscription_plan: str = 'free') -> Dict[str, Any]:
    """Sanitize AI settings to ensure they're within valid ranges"""
    if not ai_settings:
        return {}
    
    sanitized = {}
    max_allowed = get_subscription_token_limit(subscription_plan)
    
    # Sanitize token context limit
    token_limit = ai_settings.get('tokenContextLimit')
    if token_limit is not None:
        try:
            token_limit = int(token_limit)
            sanitized['tokenContextLimit'] = max(1000, min(token_limit, max_allowed))
        except (ValueError, TypeError):
            sanitized['tokenContextLimit'] = 1000
    
    # Sanitize temperature
    temperature = ai_settings.get('temperature')
    if temperature is not None:
        try:
            temp_value = float(temperature)
            sanitized['temperature'] = max(0.0, min(temp_value, 1.0))
        except (ValueError, TypeError):
            sanitized['temperature'] = 0.5
    
    # Sanitize context length
    context_length = ai_settings.get('contextLength')
    if context_length is not None:
        try:
            context_length = int(context_length)
            sanitized['contextLength'] = max(1, min(context_length, 20))
        except (ValueError, TypeError):
            sanitized['contextLength'] = 10
    
    return sanitized

def get_default_ai_settings() -> Dict[str, Any]:
    """Get default AI settings"""
    return {
        'tokenContextLimit': 1000,
        'temperature': 0.5,
        'contextLength': 10
    } 