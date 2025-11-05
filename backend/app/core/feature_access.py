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
# Based on PRD: AssignmentAI Pricing System Optimization Plan
# 
# Core Features (available to all plans):
# - assignmentai_core_assistant (renamed from basic_assignment_generation)
# - grammar_spelling_check
# - basic_writing_suggestions
# - Templates (Basic/Standard/Advanced/Custom based on tier)
#
# Feature Progression:
# Free: Core features + Basic Templates (5 assignments/day, 100k tokens/mo)
# Plus: Core + Standard Templates + AI Notebook + Weekly Usage Report (25/day, 250k/mo)
# Pro: Core + Advanced Templates + Image Analysis + Code Review + Citation + Ad-Free + Shared Assignments + Custom Tone (100/day, 500k/mo)
# Max: Core + Custom Templates + Performance Insights + Priority Generation + Priority Support (Unlimited/day, 1M/mo)

FEATURE_ACCESS_MATRIX = {
    "free": {
        # Core Features - Available to all plans
        "assignmentai_core_assistant": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "basic_templates": True,
        "standard_templates": True,  # Now available to all plans
        # Free tier limitations
        "advanced_templates": False,
        "custom_templates": False,
        "image_analysis": False,
        "code_review_assistant": False,
        "citation_management": False,
        "ad_free_experience": False,
        "ai_notebook": False,
        "weekly_usage_report": False,
        "shared_assignments": False,
        "custom_writing_tone": False,
        "performance_insights_dashboard": False,
        "priority_generation": False,
        "priority_support": False,
    },
    "plus": {
        # Core Features - Available to all plans
        "assignmentai_core_assistant": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "basic_templates": True,  # Now available to all plans
        "standard_templates": True,  # Now available to all plans
        # Plus tier additions
        "style_tone_analysis": True,  # Analyze writing style and tone
        "enhanced_writing_suggestions": True,  # More detailed writing feedback
        "ad_free_experience": True,
        # Plus tier limitations
        "advanced_templates": False,
        "custom_templates": False,
        "image_analysis": False,
        "code_review_assistant": False,
        "citation_management": False,
        "shared_assignments": False,
        "custom_writing_tone": False,
        "performance_insights_dashboard": False,
        "priority_generation": False,
        "priority_support": False,
    },
    "pro": {
        # Core Features - Available to all plans
        "assignmentai_core_assistant": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "basic_templates": True,  # Now available to all plans
        "standard_templates": True,  # Now available to all plans
        "advanced_templates": True,  # Upgrade from Standard
        # Pro tier additions
        "image_analysis": True,
        "code_review_assistant": True,
        "citation_management": True,
        "ad_free_experience": True,
        "custom_writing_tone": True,
        "style_tone_analysis": True,  # Inherited from Plus
        "enhanced_writing_suggestions": True,  # Inherited from Plus
        # Pro tier limitations
        "custom_templates": False,
        "shared_assignments": False,  # Not available for single-user system
        "performance_insights_dashboard": False,
        "priority_generation": False,  # Not available for initial launch
        "priority_support": False,  # Not available for initial launch
    },
    "max": {
        # Core Features - Available to all plans
        "assignmentai_core_assistant": True,
        "grammar_spelling_check": True,
        "basic_writing_suggestions": True,
        "basic_templates": True,  # Now available to all plans
        "standard_templates": True,  # Now available to all plans
        "advanced_templates": True,
        "custom_templates": True,  # Max tier addition
        # Max tier additions
        "image_analysis": True,
        "code_review_assistant": True,
        "citation_management": True,
        "ad_free_experience": True,
        "custom_writing_tone": True,
        "performance_insights_dashboard": True,
        "style_tone_analysis": True,  # Inherited from Plus
        "enhanced_writing_suggestions": True,  # Inherited from Plus
        # Max tier limitations
        "shared_assignments": False,  # Not available for single-user system
        "priority_generation": False,  # Not available for initial launch
        "priority_support": False,  # Not available for initial launch
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
        if feature in ["standard_templates", "style_tone_analysis", "enhanced_writing_suggestions", "ad_free_experience"]:
            return "Upgrade to Plus plan to access this feature"
        elif feature in ["advanced_templates", "image_analysis", "code_review_assistant", "citation_management", "custom_writing_tone"]:
            return "Upgrade to Pro plan to access this feature"
        elif feature in ["custom_templates", "performance_insights_dashboard"]:
            return "Upgrade to Max plan to access this feature"
        else:
            return "Upgrade to access this feature"
    elif current_plan == "plus":
        if feature in ["advanced_templates", "image_analysis", "code_review_assistant", "citation_management", "custom_writing_tone"]:
            return "Upgrade to Pro plan to access this feature"
        elif feature in ["custom_templates", "performance_insights_dashboard"]:
            return "Upgrade to Max plan to access this feature"
        else:
            return "Upgrade to access this feature"
    elif current_plan == "pro":
        if feature in ["custom_templates", "performance_insights_dashboard"]:
            return "Upgrade to Max plan to access this feature"
        else:
            return "Upgrade to Max plan to access this feature"
    else:
        return "Contact support for access to this feature"

def get_available_features(user: User, db: Session) -> Dict[str, bool]:
    """Get all available features for a user's plan"""
    plan = get_user_plan(user, db)
    return FEATURE_ACCESS_MATRIX.get(plan, {})

def get_feature_requirements() -> Dict[str, Dict[str, List[str]]]:
    """Get feature requirements for each plan"""
    # Core features available to all plans
    core_features = ["assignmentai_core_assistant", "grammar_spelling_check", "basic_writing_suggestions"]
    
    return {
        "free": {
            "available": core_features + ["basic_templates", "standard_templates"],
            "unavailable": ["advanced_templates", "custom_templates", "image_analysis", "code_review_assistant", "citation_management", "ad_free_experience", "style_tone_analysis", "enhanced_writing_suggestions", "shared_assignments", "custom_writing_tone", "performance_insights_dashboard", "priority_generation", "priority_support"]
        },
        "plus": {
            "available": core_features + ["basic_templates", "standard_templates", "style_tone_analysis", "enhanced_writing_suggestions", "ad_free_experience"],
            "unavailable": ["advanced_templates", "custom_templates", "image_analysis", "code_review_assistant", "citation_management", "shared_assignments", "custom_writing_tone", "performance_insights_dashboard", "priority_generation", "priority_support"]
        },
        "pro": {
            "available": core_features + ["basic_templates", "standard_templates", "advanced_templates", "image_analysis", "code_review_assistant", "citation_management", "ad_free_experience", "custom_writing_tone", "style_tone_analysis", "enhanced_writing_suggestions"],
            "unavailable": ["custom_templates", "shared_assignments", "performance_insights_dashboard", "priority_generation", "priority_support"]
        },
        "max": {
            "available": core_features + ["basic_templates", "standard_templates", "advanced_templates", "custom_templates", "image_analysis", "code_review_assistant", "citation_management", "ad_free_experience", "custom_writing_tone", "performance_insights_dashboard", "style_tone_analysis", "enhanced_writing_suggestions"],
            "unavailable": ["shared_assignments", "priority_generation", "priority_support"]
        }
    } 