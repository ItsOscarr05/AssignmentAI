from typing import Dict, List, Optional, Any, Tuple, Union
import numpy as np
import torch
import tensorflow as tf
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
import shap
import lime
import lime.lime_tabular
import matplotlib.pyplot as plt
from captum.attr import (
    IntegratedGradients,
    DeepLift,
    GradientShap,
    Occlusion,
    NoiseTunnel,
    FeatureAblation
)
from collections import defaultdict
import logging
import asyncio

logger = logging.getLogger(__name__)

class ExplanationMethod(Enum):
    SHAP = "shap"
    LIME = "lime"
    INTEGRATED_GRADIENTS = "integrated_gradients"
    DEEP_LIFT = "deep_lift"
    GRADIENT_SHAP = "gradient_shap"
    OCCLUSION = "occlusion"
    FEATURE_ABLATION = "feature_ablation"
    COUNTERFACTUAL = "counterfactual"

@dataclass
class ExplanationConfig:
    method: ExplanationMethod
    num_samples: int = 1000
    background_samples: int = 100
    feature_names: Optional[List[str]] = None
    class_names: Optional[List[str]] = None
    output_path: Optional[str] = None

@dataclass
class Explanation:
    method: ExplanationMethod
    feature_importance: Dict[str, float]
    visualization_data: Any
    metadata: Dict[str, Any]
    counterfactuals: Optional[List[Dict[str, Any]]] = None

class ExplanationBase(ABC):
    @abstractmethod
    async def explain(
        self,
        model: Any,
        inputs: Any,
        targets: Optional[Any] = None,
        config: Optional[ExplanationConfig] = None
    ) -> Explanation:
        pass
        
    @abstractmethod
    async def visualize(self, explanation: Explanation) -> None:
        pass

class ShapExplainer(ExplanationBase):
    async def explain(
        self,
        model: Any,
        inputs: Any,
        targets: Optional[Any] = None,
        config: Optional[ExplanationConfig] = None
    ) -> Explanation:
        """Generate SHAP explanations"""
        try:
            # Create explainer
            background = await self._get_background_data(inputs, config)
            explainer = shap.DeepExplainer(model, background)
            
            # Calculate SHAP values
            shap_values = await asyncio.to_thread(explainer.shap_values, inputs)
            
            # Process feature importance
            feature_importance = await self._process_shap_values(
                shap_values,
                config.feature_names if config else None
            )
            
            # Create visualization data
            viz_data = {
                "shap_values": shap_values,
                "feature_names": config.feature_names if config else None,
                "class_names": config.class_names if config else None
            }
            
            return Explanation(
                method=ExplanationMethod.SHAP,
                feature_importance=feature_importance,
                visualization_data=viz_data,
                metadata={"num_samples": len(inputs)}
            )
            
        except Exception as e:
            logger.error(f"SHAP explanation failed: {str(e)}")
            raise
            
    async def visualize(self, explanation: Explanation) -> None:
        """Visualize SHAP explanations"""
        if explanation.method != ExplanationMethod.SHAP:
            raise ValueError("Invalid explanation method")
            
        viz_data = explanation.visualization_data
        
        # Run visualization in thread pool to avoid blocking
        await asyncio.to_thread(self._create_visualizations, viz_data)
        
    async def _create_visualizations(self, viz_data: Dict[str, Any]) -> None:
        """Create SHAP visualizations"""
        # Summary plot
        shap.summary_plot(
            viz_data["shap_values"],
            feature_names=viz_data["feature_names"],
            class_names=viz_data["class_names"]
        )
        
        # Force plot for individual predictions
        shap.force_plot(
            viz_data["shap_values"][0],
            feature_names=viz_data["feature_names"]
        )
        
    async def _get_background_data(
        self,
        inputs: Any,
        config: Optional[ExplanationConfig]
    ) -> Any:
        """Get background data for SHAP"""
        if config and config.background_samples:
            indices = np.random.choice(
                len(inputs),
                config.background_samples,
                replace=False
            )
            return inputs[indices]
        return inputs[:100]  # Default to first 100 samples
        
    async def _process_shap_values(
        self,
        shap_values: Any,
        feature_names: Optional[List[str]]
    ) -> Dict[str, float]:
        """Process SHAP values into feature importance"""
        importance = {}
        mean_shap = np.abs(shap_values).mean(axis=0)
        
        for i, value in enumerate(mean_shap):
            feature_name = (
                feature_names[i] if feature_names and i < len(feature_names)
                else f"feature_{i}"
            )
            importance[feature_name] = float(value)
            
        return importance

class LimeExplainer(ExplanationBase):
    async def explain(
        self,
        model: Any,
        inputs: Any,
        targets: Optional[Any] = None,
        config: Optional[ExplanationConfig] = None
    ) -> Explanation:
        """Generate LIME explanations"""
        try:
            # Create explainer
            explainer = await asyncio.to_thread(
                lime.lime_tabular.LimeTabularExplainer,
                training_data=inputs,
                feature_names=config.feature_names if config else None,
                class_names=config.class_names if config else None,
                mode="classification"
            )
            
            # Generate explanation for each instance
            explanations = []
            for instance in inputs[:config.num_samples if config else 1]:
                exp = await asyncio.to_thread(
                    explainer.explain_instance,
                    instance,
                    model.predict_proba,
                    num_features=len(instance)
                )
                explanations.append(exp)
                
            # Process feature importance
            feature_importance = await self._process_lime_explanations(explanations)
            
            return Explanation(
                method=ExplanationMethod.LIME,
                feature_importance=feature_importance,
                visualization_data=explanations,
                metadata={"num_samples": len(explanations)}
            )
            
        except Exception as e:
            logger.error(f"LIME explanation failed: {str(e)}")
            raise
            
    async def visualize(self, explanation: Explanation) -> None:
        """Visualize LIME explanations"""
        if explanation.method != ExplanationMethod.LIME:
            raise ValueError("Invalid explanation method")
            
        for idx, exp in enumerate(explanation.visualization_data):
            await asyncio.to_thread(exp.show_in_notebook, show_all=False)
            
    async def _process_lime_explanations(
        self,
        explanations: List[Any]
    ) -> Dict[str, float]:
        """Process LIME explanations into feature importance"""
        importance = defaultdict(float)
        for exp in explanations:
            for feature, value in exp.as_list():
                importance[feature] += abs(value)
                
        # Average importance across samples
        for feature in importance:
            importance[feature] /= len(explanations)
            
        return dict(importance)

class IntegratedGradientsExplainer(ExplanationBase):
    async def explain(
        self,
        model: Any,
        inputs: Any,
        targets: Optional[Any] = None,
        config: Optional[ExplanationConfig] = None
    ) -> Explanation:
        """Generate Integrated Gradients explanations"""
        try:
            if isinstance(model, torch.nn.Module):
                return await self._explain_pytorch(model, inputs, targets, config)
            elif isinstance(model, tf.keras.Model):
                return await self._explain_tensorflow(model, inputs, targets, config)
            else:
                raise ValueError("Unsupported model type")
                
        except Exception as e:
            raise Exception(f"Integrated Gradients explanation failed: {str(e)}")
            
    async def _explain_pytorch(
        self,
        model: torch.nn.Module,
        inputs: torch.Tensor,
        targets: Optional[torch.Tensor],
        config: Optional[ExplanationConfig]
    ) -> Explanation:
        """Generate explanations for PyTorch models"""
        ig = IntegratedGradients(model)
        attributions = ig.attribute(
            inputs,
            target=targets,
            n_steps=config.num_samples if config else 100
        )
        
        feature_importance = self._process_attributions(
            attributions,
            config.feature_names if config else None
        )
        
        return Explanation(
            method=ExplanationMethod.INTEGRATED_GRADIENTS,
            feature_importance=feature_importance,
            visualization_data=attributions,
            metadata={"framework": "pytorch"}
        )
        
    async def _explain_tensorflow(
        self,
        model: tf.keras.Model,
        inputs: tf.Tensor,
        targets: Optional[tf.Tensor],
        config: Optional[ExplanationConfig]
    ) -> Explanation:
        """Generate explanations for TensorFlow models"""
        # Implement TensorFlow-specific logic
        return Explanation(
            method=ExplanationMethod.INTEGRATED_GRADIENTS,
            feature_importance={},
            visualization_data=None,
            metadata={"framework": "tensorflow"}
        )
        
    async def visualize(self, explanation: Explanation) -> None:
        """Visualize Integrated Gradients explanations"""
        if explanation.method != ExplanationMethod.INTEGRATED_GRADIENTS:
            raise ValueError("Invalid explanation method")
            
        attributions = explanation.visualization_data
        plt.figure(figsize=(10, 6))
        plt.imshow(attributions.sum(dim=2).squeeze().cpu().detach().numpy())
        plt.colorbar()
        plt.title("Integrated Gradients Attributions")
        plt.show()
        
    def _process_attributions(
        self,
        attributions: torch.Tensor,
        feature_names: Optional[List[str]]
    ) -> Dict[str, float]:
        """Process attributions into feature importance"""
        importance = {}
        attr_sum = attributions.abs().sum(dim=0).squeeze().cpu().detach().numpy()
        
        for i, value in enumerate(attr_sum):
            feature_name = (
                feature_names[i] if feature_names and i < len(feature_names)
                else f"feature_{i}"
            )
            importance[feature_name] = float(value)
            
        return importance

class CounterfactualExplainer(ExplanationBase):
    async def explain(
        self,
        model: Any,
        inputs: Any,
        targets: Optional[Any] = None,
        config: Optional[ExplanationConfig] = None
    ) -> Explanation:
        """Generate counterfactual explanations"""
        try:
            counterfactuals = await self._generate_counterfactuals(
                model,
                inputs,
                targets,
                config
            )
            
            return Explanation(
                method=ExplanationMethod.COUNTERFACTUAL,
                feature_importance={},  # Not applicable for counterfactuals
                visualization_data=counterfactuals,
                metadata={"num_counterfactuals": len(counterfactuals)},
                counterfactuals=counterfactuals
            )
            
        except Exception as e:
            raise Exception(f"Counterfactual explanation failed: {str(e)}")
            
    async def visualize(self, explanation: Explanation) -> None:
        """Visualize counterfactual explanations"""
        if explanation.method != ExplanationMethod.COUNTERFACTUAL:
            raise ValueError("Invalid explanation method")
            
        counterfactuals = explanation.counterfactuals
        for idx, cf in enumerate(counterfactuals):
            print(f"Counterfactual {idx + 1}:")
            print("Original:", cf["original"])
            print("Counterfactual:", cf["counterfactual"])
            print("Changes:", cf["changes"])
            print()
            
    async def _generate_counterfactuals(
        self,
        model: Any,
        inputs: Any,
        targets: Optional[Any],
        config: Optional[ExplanationConfig]
    ) -> List[Dict[str, Any]]:
        """Generate counterfactual examples"""
        # Implement counterfactual generation
        return []

class ExplainableAI:
    def __init__(self):
        self.explainers = {
            ExplanationMethod.SHAP: ShapExplainer(),
            ExplanationMethod.LIME: LimeExplainer(),
            ExplanationMethod.INTEGRATED_GRADIENTS: IntegratedGradientsExplainer(),
            ExplanationMethod.COUNTERFACTUAL: CounterfactualExplainer()
        }
        
    async def explain(
        self,
        model: Any,
        inputs: Any,
        method: ExplanationMethod,
        config: Optional[ExplanationConfig] = None,
        targets: Optional[Any] = None
    ) -> Explanation:
        """Generate explanations using specified method"""
        explainer = self.explainers.get(method)
        if not explainer:
            raise ValueError(f"Unsupported explanation method: {method}")
            
        return await explainer.explain(model, inputs, targets, config)
        
    async def visualize(
        self,
        explanation: Explanation,
        output_path: Optional[str] = None
    ) -> None:
        """Visualize explanation results"""
        explainer = self.explainers.get(explanation.method)
        if not explainer:
            raise ValueError(f"Unsupported explanation method: {explanation.method}")
            
        await explainer.visualize(explanation)
        
        if output_path:
            plt.savefig(output_path)
            
    def get_feature_importance(
        self,
        explanation: Explanation,
        top_k: Optional[int] = None
    ) -> Dict[str, float]:
        """Get feature importance rankings"""
        importance = explanation.feature_importance
        if not top_k:
            return importance
            
        # Sort by importance and get top k features
        sorted_features = sorted(
            importance.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )
        return dict(sorted_features[:top_k]) 