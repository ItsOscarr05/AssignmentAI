"""Model manager for handling AI model selection and management."""
from typing import Any, Dict, Optional, Tuple

from .ai_engine import AIEngine
from .model_optimizer import ModelOptimizer
from .performance_tracker import PerformanceTracker


class ModelManager:
    """Manages AI model selection, optimization, and fallback strategies."""

    def __init__(self):
        """Initialize the model manager."""
        self.ai_engine = AIEngine()
        self.optimizer = ModelOptimizer()
        self.performance_tracker = PerformanceTracker()
        self.available_models = {
            "gpt-4": {"priority": 1, "status": "active"},
            "claude-3": {"priority": 2, "status": "active"},
            "gemini-pro": {"priority": 3, "status": "active"}
        }

    async def select_model(
        self,
        model_preference: Optional[str] = None,
        task_type: Optional[str] = None
    ) -> Tuple[str, Any]:
        """Select the most appropriate model based on preference and availability.
        
        Args:
            model_preference: Preferred model to use.
            task_type: Type of task to be performed.
            
        Returns:
            Tuple containing the selected model name and its configuration.
        """
        if model_preference and model_preference in self.available_models:
            if self.available_models[model_preference]["status"] == "active":
                return model_preference, self.available_models[model_preference]

        # Select best available model based on priority
        for model, config in sorted(
            self.available_models.items(),
            key=lambda x: x[1]["priority"]
        ):
            if config["status"] == "active":
                return model, config

        raise RuntimeError("No available models found") 