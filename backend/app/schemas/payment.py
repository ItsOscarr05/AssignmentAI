from pydantic import BaseModel
from typing import Optional

class CreateSubscriptionRequest(BaseModel):
    price_id: str
    payment_method_id: str

class SubscriptionResponse(BaseModel):
    id: str
    status: str
    plan_id: Optional[str] = None
    current_period_end: Optional[str] = None
    cancel_at_period_end: Optional[bool] = None
    ai_model: Optional[str] = None
    token_limit: Optional[int] = None

class PlanResponse(BaseModel):
    id: str
    name: str
    price: float
    interval: str
    features: list[str]
    priceId: str
