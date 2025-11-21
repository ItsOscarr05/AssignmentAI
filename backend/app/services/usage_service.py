from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import func, select
from datetime import datetime, timedelta
import asyncio
import inspect
try:
    from unittest.mock import AsyncMock
except ImportError:  # pragma: no cover
    AsyncMock = None
from app.models.usage import Usage, UsageLimit
from app.models.user import User
from app.models.subscription import Subscription, SubscriptionStatus
from fastapi import HTTPException

class UsageService:
    def __init__(self, db):
        self.db = db
        commit_callable = getattr(db, "commit", None)
        self.is_async = isinstance(db, AsyncSession) or asyncio.iscoroutinefunction(commit_callable) or (
            AsyncMock is not None and isinstance(commit_callable, AsyncMock)
        )

    async def track_usage(
        self,
        user: User,
        feature: str,
        action: str,
        tokens_used: int = 0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Usage:
        """Track a usage event with token consumption"""
        # Check if user has exceeded their limits
        await self._check_usage_limits(user, feature)
        
        # Create usage record
        usage = Usage(
            user_id=user.id,
            feature=feature,
            action=action,
            tokens_used=tokens_used,
            requests_made=1,
            usage_metadata=metadata or {}
        )
        add_result = self.db.add(usage)
        if inspect.isawaitable(add_result):
            await add_result
        
        if self.is_async:
            commit_result = self.db.commit()
            if inspect.isawaitable(commit_result):
                await commit_result

            refresh_result = self.db.refresh(usage)
            if inspect.isawaitable(refresh_result):
                await refresh_result
        else:
            self.db.commit()
            self.db.refresh(usage)
        
        return usage

    async def get_usage(
        self,
        user: User,
        feature: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Usage]:
        """Get usage records for a user"""
        query = self.db.query(Usage).filter(Usage.user_id == user.id)
        
        if feature:
            query = query.filter(Usage.feature == feature)
        if start_date:
            query = query.filter(Usage.timestamp >= start_date)
        if end_date:
            query = query.filter(Usage.timestamp <= end_date)
            
        return query.order_by(Usage.timestamp.desc()).all()

    async def get_usage_summary(
        self,
        user: User,
        feature: Optional[str] = None,
        period: str = 'daily'  # 'daily', 'weekly', 'monthly'
    ) -> Dict[str, int]:
        """Get usage summary for a user"""
        query = self.db.query(Usage).filter(Usage.user_id == user.id)
        
        if feature:
            query = query.filter(Usage.feature == feature)
            
        # Calculate date range based on period
        end_date = datetime.utcnow()
        if period == 'daily':
            start_date = end_date - timedelta(days=1)
        elif period == 'weekly':
            start_date = end_date - timedelta(weeks=1)
        else:  # monthly
            start_date = end_date - timedelta(days=30)
            
        query = query.filter(Usage.timestamp >= start_date)
        
        # Group by feature and count
        results = query.group_by(Usage.feature).with_entities(
            Usage.feature,
            func.count(Usage.id)
        ).all()
        
        return {feature: count for feature, count in results}

    async def get_token_usage_summary(
        self,
        user: User,
        period: str = 'monthly'
    ) -> Dict[str, Any]:
        """Get token usage summary for a user"""
        # Calculate date range based on period
        end_date = datetime.utcnow()
        if period == 'daily':
            start_date = end_date - timedelta(days=1)
        elif period == 'weekly':
            start_date = end_date - timedelta(weeks=1)
        elif period == 'lifetime':
            # For lifetime, don't filter by date - get all records
            start_date = None
        else:  # monthly
            start_date = end_date - timedelta(days=30)
        
        # Build query filters
        query_filters = [Usage.user_id == user.id]
        if start_date is not None:
            query_filters.append(Usage.timestamp >= start_date)
            
        # Get total tokens used in the period
        total_tokens_query = self.db.query(func.sum(Usage.tokens_used)).filter(*query_filters)
        total_tokens_result = total_tokens_query.scalar()
        total_tokens = int(total_tokens_result) if total_tokens_result else 0
        
        # Get usage by feature
        feature_usage_query = self.db.query(
            Usage.feature,
            func.sum(Usage.tokens_used).label('tokens_used'),
            func.count(Usage.id).label('requests_made')
        ).filter(*query_filters).group_by(Usage.feature)
        feature_usage = feature_usage_query.all()
        
        return {
            'total_tokens': total_tokens,
            'period': period,
            'start_date': start_date.isoformat() if start_date else None,
            'end_date': end_date.isoformat(),
            'feature_usage': {
                feature: {
                    'tokens_used': int(tokens_used),
                    'requests_made': int(requests_made)
                }
                for feature, tokens_used, requests_made in feature_usage
            }
        }

    async def _check_usage_limits(self, user: User, feature: str) -> None:
        """Check if user has exceeded their usage limits"""
        # Get user's subscription
        if self.is_async:
            result = await self.db.execute(
                select(Subscription).filter(
                    Subscription.user_id == user.id,
                    Subscription.status == SubscriptionStatus.ACTIVE
                )
            )
            subscription = result.scalar_one_or_none()
        else:
            subscription = self.db.query(Subscription).filter(
                Subscription.user_id == user.id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).first()
        
        if not subscription:
            # Free tier limits
            plan_id = 'free'
        else:
            plan_id = subscription.plan_id
            
        # Get usage limits for the plan
        if self.is_async:
            result = await self.db.execute(
                select(UsageLimit).filter(
                    UsageLimit.plan_id == plan_id,
                    UsageLimit.feature == feature
                )
            )
            limits = result.scalars().all()
        else:
            limits = self.db.query(UsageLimit).filter(
                UsageLimit.plan_id == plan_id,
                UsageLimit.feature == feature
            ).all()
        
        for limit in limits:
            if limit.limit_type == 'daily':
                start_date = datetime.utcnow() - timedelta(days=1)
            elif limit.limit_type == 'monthly':
                start_date = datetime.utcnow() - timedelta(days=30)
            else:  # total
                start_date = datetime.min
                
            # Count usage within the period
            if self.is_async:
                result = await self.db.execute(
                    select(func.count()).select_from(Usage).filter(
                        Usage.user_id == user.id,
                        Usage.feature == feature,
                        Usage.timestamp >= start_date
                    )
                )
                usage_count = result.scalar()
            else:
                usage_count = self.db.query(Usage).filter(
                    Usage.user_id == user.id,
                    Usage.feature == feature,
                    Usage.timestamp >= start_date
                ).count()
            
            if usage_count >= limit.limit_value:
                raise HTTPException(
                    status_code=403,
                    detail=f"Usage limit exceeded for {feature}. {limit.limit_type} limit: {limit.limit_value}"
                )

    async def get_usage_limits(
        self,
        user: User,
        feature: Optional[str] = None
    ) -> List[UsageLimit]:
        """Get usage limits for a user's plan"""
        # Get user's subscription
        subscription = self.db.query(Subscription).filter(
            Subscription.user_id == user.id,
            Subscription.status == SubscriptionStatus.ACTIVE
        ).first()
        
        if not subscription:
            # Free tier limits
            plan_id = 'free'
        else:
            plan_id = subscription.plan_id
            
        query = self.db.query(UsageLimit).filter(UsageLimit.plan_id == plan_id)
        
        if feature:
            query = query.filter(UsageLimit.feature == feature)
            
        return query.all() 