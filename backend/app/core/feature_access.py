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
        "basic_templates": True,
        # Premium features - NOT available
        "advanced_writing_analysis": False,
        "style_tone_suggestions": False,
        "extended_templates": False,
        "ad_free_experience": False,
        "citation_management": False,
        "basic_plagiarism_detection": False,
        "diagram_generation": False,
        "image_analysis": True,
        "code_analysis": False,
        "smart_content_summarization": False,
        "data_analysis": False,
        "advanced_research_assistant": False,
        "advanced_analytics": False,
        "custom_templates": False,
        "ai_learning_path": False,
        "advanced_content_optimization": False,
        "enterprise_collaboration": False,
    },
    "plus": {
        # Inherit all free features
        "basic_assignment_generation": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "basic_templates": True,
        "image_analysis": True,
        "code_analysis": True,
        "smart_content_summarization": True,
        # Plus-specific features
        "advanced_writing_analysis": True,
        "style_tone_suggestions": True,
        "extended_templates": True,
        "ad_free_experience": True,
        # Higher tier features - NOT available
        "citation_management": False,
        "basic_plagiarism_detection": False,
        "diagram_generation": False,
        "data_analysis": False,
        "advanced_research_assistant": False,
        "advanced_analytics": False,
        "custom_templates": False,
        "ai_learning_path": False,
        "advanced_content_optimization": False,
        "enterprise_collaboration": False,
    },
    "pro": {
        # Inherit all free and plus features
        "basic_assignment_generation": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "basic_templates": True,
        "advanced_writing_analysis": True,
        "style_tone_suggestions": True,
        "extended_templates": True,
        "ad_free_experience": True,
        "image_analysis": True,
        "code_analysis": True,
        "smart_content_summarization": True,
        # Pro-specific features
        "citation_management": True,
        "basic_plagiarism_detection": True,
        "diagram_generation": True,
        "data_analysis": True,
        "advanced_research_assistant": True,
        # Max tier features - NOT available
        "advanced_analytics": False,
        "custom_templates": False,
        "ai_learning_path": False,
        "advanced_content_optimization": False,
        "enterprise_collaboration": False,
    },
    "max": {
        # All features available
        "basic_assignment_generation": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "basic_templates": True,
        "advanced_writing_analysis": True,
        "style_tone_suggestions": True,
        "extended_templates": True,
        "ad_free_experience": True,
        "citation_management": True,
        "basic_plagiarism_detection": True,
        "diagram_generation": True,
        "image_analysis": True,
        "code_analysis": True,
        "smart_content_summarization": True,
        "data_analysis": True,
        "advanced_research_assistant": True,
        "advanced_analytics": True,
        "custom_templates": True,
        "ai_learning_path": True,
        "advanced_content_optimization": True,
        "enterprise_collaboration": True,
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
        if feature in ["advanced_writing_analysis", "style_tone_suggestions", "extended_templates", "ad_free_experience", "code_analysis", "smart_content_summarization"]:
            return "Upgrade to Plus plan to access this feature"
        elif feature in ["citation_management", "basic_plagiarism_detection", "diagram_generation", "data_analysis", "advanced_research_assistant"]:
            return "Upgrade to Pro plan to access this feature"
        else:
            return "Upgrade to Max plan to access this feature"
    elif current_plan == "plus":
        if feature in ["citation_management", "basic_plagiarism_detection", "diagram_generation", "data_analysis", "advanced_research_assistant"]:
            return "Upgrade to Pro plan to access this feature"
        else:
            return "Upgrade to Max plan to access this feature"
    elif current_plan == "pro":
        if feature in ["advanced_analytics", "custom_templates", "ai_learning_path", "advanced_content_optimization", "enterprise_collaboration"]:
            return "Upgrade to Max plan to access this feature"
        else:
            return "Contact support for access to this feature"
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
            "available": ["basic_assignment_generation", "grammar_spelling_check", "basic_writing_suggestions", "basic_templates", "image_analysis"],
            "unavailable": ["advanced_writing_analysis", "style_tone_suggestions", "extended_templates", "ad_free_experience", "citation_management", "basic_plagiarism_detection", "diagram_generation", "code_analysis", "smart_content_summarization", "data_analysis", "advanced_research_assistant", "advanced_analytics", "custom_templates", "ai_learning_path", "advanced_content_optimization", "enterprise_collaboration"]
        },
        "plus": {
            "available": ["basic_assignment_generation", "grammar_spelling_check", "basic_writing_suggestions", "basic_templates", "advanced_writing_analysis", "style_tone_suggestions", "extended_templates", "ad_free_experience", "image_analysis", "code_analysis", "smart_content_summarization"],
            "unavailable": ["citation_management", "basic_plagiarism_detection", "diagram_generation", "data_analysis", "advanced_research_assistant", "advanced_analytics", "custom_templates", "ai_learning_path", "advanced_content_optimization", "enterprise_collaboration"]
        },
        "pro": {
            "available": ["basic_assignment_generation", "grammar_spelling_check", "basic_writing_suggestions", "basic_templates", "advanced_writing_analysis", "style_tone_suggestions", "extended_templates", "ad_free_experience", "citation_management", "basic_plagiarism_detection", "diagram_generation", "image_analysis", "code_analysis", "smart_content_summarization", "data_analysis", "advanced_research_assistant"],
            "unavailable": ["advanced_analytics", "custom_templates", "ai_learning_path", "advanced_content_optimization", "enterprise_collaboration"]
        },
        "max": {
            "available": ["basic_assignment_generation", "grammar_spelling_check", "basic_writing_suggestions", "basic_templates", "advanced_writing_analysis", "style_tone_suggestions", "extended_templates", "ad_free_experience", "citation_management", "basic_plagiarism_detection", "diagram_generation", "image_analysis", "code_analysis", "smart_content_summarization", "data_analysis", "advanced_research_assistant", "advanced_analytics", "custom_templates", "ai_learning_path", "advanced_content_optimization", "enterprise_collaboration"],
            "unavailable": []
        }
    } 