from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from uuid import uuid4



class PreferenceBase(BaseModel):
    # UI Preferences
    theme: str = "light"
    language: str = "en"
    font_size: str = "medium"
    compact_mode: bool = False
    

    
    # Privacy Preferences
    show_profile: bool = True
    show_progress: bool = True
    show_activity: bool = True
    
    # Accessibility Preferences
    high_contrast: bool = False
    reduced_motion: bool = False
    screen_reader: bool = False
    
    # Custom Preferences
    custom_preferences: Dict[str, Any] = Field(default_factory=dict)
    model_config = ConfigDict(from_attributes=True)

class PreferenceCreate(PreferenceBase):
    user_id: int

class PreferenceUpdate(BaseModel):
    # UI Preferences
    theme: Optional[str] = None
    language: Optional[str] = None
    font_size: Optional[str] = None
    compact_mode: Optional[bool] = None
    

    
    # Privacy Preferences
    show_profile: Optional[bool] = None
    show_progress: Optional[bool] = None
    show_activity: Optional[bool] = None
    
    # Accessibility Preferences
    high_contrast: Optional[bool] = None
    reduced_motion: Optional[bool] = None
    screen_reader: Optional[bool] = None
    
    # Custom Preferences
    custom_preferences: Optional[Dict[str, Any]] = None

class PreferenceInDBBase(PreferenceBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

class Preference(PreferenceInDBBase):
    pass 