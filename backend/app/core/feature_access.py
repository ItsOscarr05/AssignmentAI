from typing import Dict, List, Optional, Callable
from functools import wraps
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Define feature access matrix by subscription plan
FEATURE_ACCESS_MATRIX = {
    "free": {
        "basic_assignment_generation": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "standard_response_time": True,
        "basic_templates": True,
        # Premium features - NOT available
        "advanced_writing_analysis": False,
        "style_tone_suggestions": False,
        "priority_response_time": False,
        "extended_templates": False,
        "ad_free_experience": False,
        "ai_research_assistance": False,
        "citation_reference_check": False,
        "advanced_plagiarism_detection": False,
        "diagram_generation": False,
        "image_analysis": False,
        "code_generation": False,
        "data_analysis": False,
        "unlimited_analysis": False,
        "custom_ai_training": False,
        "personalized_insights": False,
        "dedicated_support": False,
    },
    "plus": {
        # Inherit all free features
        "basic_assignment_generation": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "standard_response_time": True,
        "basic_templates": True,
        # Plus-specific features
        "advanced_writing_analysis": True,
        "style_tone_suggestions": True,
        "priority_response_time": True,
        "extended_templates": True,
        "ad_free_experience": True,
        # Higher tier features - NOT available
        "ai_research_assistance": False,
        "citation_reference_check": False,
        "advanced_plagiarism_detection": False,
        "diagram_generation": False,
        "image_analysis": False,
        "code_generation": False,
        "data_analysis": False,
        "unlimited_analysis": False,
        "custom_ai_training": False,
        "personalized_insights": False,
        "dedicated_support": False,
    },
    "pro": {
        # Inherit all free and plus features
        "basic_assignment_generation": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "standard_response_time": True,
        "basic_templates": True,
        "advanced_writing_analysis": True,
        "style_tone_suggestions": True,
        "priority_response_time": True,
        "extended_templates": True,
        "ad_free_experience": True,
        # Pro-specific features
        "ai_research_assistance": True,
        "citation_reference_check": True,
        "advanced_plagiarism_detection": True,
        "diagram_generation": True,
        "image_analysis": True,
        "code_generation": True,
        "data_analysis": True,
        # Max tier features - NOT available
        "unlimited_analysis": False,
        "custom_ai_training": False,
        "personalized_insights": False,
        "dedicated_support": False,
    },
    "max": {
        # All features available
        "basic_assignment_generation": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "standard_response_time": True,
        "basic_templates": True,
        "advanced_writing_analysis": True,
        "style_tone_suggestions": True,
        "priority_response_time": True,
        "extended_templates": True,
        "ad_free_experience": True,
        "ai_research_assistance": True,
        "citation_reference_check": True,
        "advanced_plagiarism_detection": True,
        "diagram_generation": True,
        "image_analysis": True,
        "code_generation": True,
        "data_analysis": True,
        "unlimited_analysis": True,
        "custom_ai_training": True,
        "personalized_insights": True,
        "dedicated_support": True,
    }
}

def get_user_plan(user: User, db: Session) -> str:
    """Get the user's current subscription plan"""
    subscription = db.query(Subscription).filter(
        Subscription.user_id == user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    
    if not subscription:
        return "free"
    
    # Map Stripe price IDs to plan names
    plan_mapping = {
        settings.STRIPE_PRICE_FREE: "free",
        settings.STRIPE_PRICE_PLUS: "plus", 
        settings.STRIPE_PRICE_PRO: "pro",
        settings.STRIPE_PRICE_MAX: "max"
    }
    
    return plan_mapping.get(subscription.plan_id, "free")

def has_feature_access(user: User, feature: str, db: Session) -> bool:
    """Check if user has access to a specific feature"""
    plan = get_user_plan(user, db)
    return FEATURE_ACCESS_MATRIX.get(plan, {}).get(feature, False)

def require_feature(feature: str):
    """Decorator to require a specific feature for an endpoint"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract db and current_user from kwargs
            db = kwargs.get('db')
            current_user = kwargs.get('current_user')
            
            if not db or not current_user:
                # Try to get from dependencies
                for arg in args:
                    if hasattr(arg, '__class__') and 'Session' in str(arg.__class__):
                        db = arg
                    elif hasattr(arg, '__class__') and 'User' in str(arg.__class__):
                        current_user = arg
            
            if not db or not current_user:
                raise HTTPException(status_code=500, detail="Unable to determine user or database session")
            
            if not has_feature_access(current_user, feature, db):
                plan = get_user_plan(current_user, db)
                upgrade_message = get_upgrade_message(plan, feature)
                raise HTTPException(
                    status_code=403, 
                    detail={
                        "error": "Feature not available in your plan",
                        "feature": feature,
                        "current_plan": plan,
                        "upgrade_message": upgrade_message,
                        "upgrade_url": "/dashboard/price-plan"
                    }
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def get_upgrade_message(current_plan: str, feature: str) -> str:
    """Get appropriate upgrade message based on current plan and required feature"""
    if current_plan == "free":
        if feature in ["advanced_writing_analysis", "style_tone_suggestions", "priority_response_time", "extended_templates", "ad_free_experience"]:
            return "Upgrade to Plus plan to access this feature"
        elif feature in ["ai_research_assistance", "citation_reference_check", "advanced_plagiarism_detection", "diagram_generation", "image_analysis", "code_generation", "data_analysis"]:
            return "Upgrade to Pro plan to access this feature"
        else:
            return "Upgrade to Max plan to access this feature"
    elif current_plan == "plus":
        if feature in ["ai_research_assistance", "citation_reference_check", "advanced_plagiarism_detection", "diagram_generation", "image_analysis", "code_generation", "data_analysis"]:
            return "Upgrade to Pro plan to access this feature"
        else:
            return "Upgrade to Max plan to access this feature"
    elif current_plan == "pro":
        return "Upgrade to Max plan to access this feature"
    else:
        return "Contact support for access to this feature"

def get_available_features(user: User, db: Session) -> Dict[str, bool]:
    """Get all available features for a user's plan"""
    plan = get_user_plan(user, db)
    return FEATURE_ACCESS_MATRIX.get(plan, {})

def get_feature_requirements() -> Dict[str, Dict[str, List[str]]]:
    """Get feature requirements for each plan"""
    return {
        "free": {
            "available": ["basic_assignment_generation", "grammar_spelling_check", "basic_writing_suggestions", "standard_response_time", "basic_templates"],
            "unavailable": ["advanced_writing_analysis", "style_tone_suggestions", "priority_response_time", "extended_templates", "ad_free_experience", "ai_research_assistance", "citation_reference_check", "advanced_plagiarism_detection", "diagram_generation", "image_analysis", "code_generation", "data_analysis", "unlimited_analysis", "custom_ai_training", "personalized_insights", "dedicated_support"]
        },
        "plus": {
            "available": ["basic_assignment_generation", "grammar_spelling_check", "basic_writing_suggestions", "standard_response_time", "basic_templates", "advanced_writing_analysis", "style_tone_suggestions", "priority_response_time", "extended_templates", "ad_free_experience"],
            "unavailable": ["ai_research_assistance", "citation_reference_check", "advanced_plagiarism_detection", "diagram_generation", "image_analysis", "code_generation", "data_analysis", "unlimited_analysis", "custom_ai_training", "personalized_insights", "dedicated_support"]
        },
        "pro": {
            "available": ["basic_assignment_generation", "grammar_spelling_check", "basic_writing_suggestions", "standard_response_time", "basic_templates", "advanced_writing_analysis", "style_tone_suggestions", "priority_response_time", "extended_templates", "ad_free_experience", "ai_research_assistance", "citation_reference_check", "advanced_plagiarism_detection", "diagram_generation", "image_analysis", "code_generation", "data_analysis"],
            "unavailable": ["unlimited_analysis", "custom_ai_training", "personalized_insights", "dedicated_support"]
        },
        "max": {
            "available": ["basic_assignment_generation", "grammar_spelling_check", "basic_writing_suggestions", "standard_response_time", "basic_templates", "advanced_writing_analysis", "style_tone_suggestions", "priority_response_time", "extended_templates", "ad_free_experience", "ai_research_assistance", "citation_reference_check", "advanced_plagiarism_detection", "diagram_generation", "image_analysis", "code_generation", "data_analysis", "unlimited_analysis", "custom_ai_training", "personalized_insights", "dedicated_support"],
            "unavailable": []
        }
    } 