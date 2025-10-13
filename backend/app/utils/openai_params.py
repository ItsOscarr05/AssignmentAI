"""
OpenAI API parameter utilities
Handles model-specific parameter compatibility
"""
from typing import Dict, Any, Optional


def get_openai_params(
    model: str,
    messages: list,
    max_completion_tokens: int,
    temperature: Optional[float] = None,
    top_p: Optional[float] = None,
    frequency_penalty: Optional[float] = None,
    presence_penalty: Optional[float] = None,
    stop: Optional[list] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Get OpenAI API parameters with model-specific compatibility checks.
    
    Some newer models (like GPT-5) have limited parameter support.
    
    Args:
        model: The OpenAI model name
        messages: List of message objects
        max_completion_tokens: Maximum tokens for completion
        temperature: Temperature parameter (0.0-2.0)
        top_p: Top-p parameter
        frequency_penalty: Frequency penalty
        presence_penalty: Presence penalty
        stop: Stop sequences
        **kwargs: Additional parameters
        
    Returns:
        Dict of parameters compatible with the model
    """
    params = {
        "model": model,
        "messages": messages,
        "max_completion_tokens": max_completion_tokens
    }
    
    # GPT-5 models have limited parameter support
    if model.startswith("gpt-5"):
        # GPT-5 only supports basic parameters
        return params
    
    # Add optional parameters for other models
    if temperature is not None:
        params["temperature"] = temperature
    
    if top_p is not None:
        params["top_p"] = top_p
        
    if frequency_penalty is not None:
        params["frequency_penalty"] = frequency_penalty
        
    if presence_penalty is not None:
        params["presence_penalty"] = presence_penalty
        
    if stop is not None:
        params["stop"] = stop
    
    # Add any additional parameters
    params.update(kwargs)
    
    return params
