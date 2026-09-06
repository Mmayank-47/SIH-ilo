"""
Structured Output Schemas for ilo Facial Analysis & Affective Wellbeing Pipeline.
Conforms strictly to the clinical Explainable AI (XAI) contract.
"""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class PrimaryEmotion(str, Enum):
    ANGER = "anger"
    DISGUST = "disgust"
    FEAR = "fear"
    HAPPINESS = "happiness"
    NEUTRAL = "neutral"
    SADNESS = "sadness"
    SURPRISE = "surprise"


class ActionUnit(BaseModel):
    au: str = Field(
        ...,
        description="FACS Action Unit code, e.g. 'AU12', 'AU06', 'AU04', 'AU15'",
        example="AU12"
    )
    intensity: float = Field(
        ...,
        ge=0.0,
        le=5.0,
        description="AU intensity on the standardized 0.0 to 5.0 scale",
        example=1.2
    )
    present: bool = Field(
        ...,
        description="Whether the AU meets the clinical activation threshold",
        example=True
    )


class StructuredFacialOutput(BaseModel):
    """
    The critical data contract for each analyzed frame.
    Every analyzed frame must produce this structured JSON object.
    """
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="ISO 8601 UTC timestamp of frame capture and analysis"
    )
    session_id: str = Field(
        ...,
        description="Identifier of the active companion session"
    )
    primary_emotion: PrimaryEmotion = Field(
        ...,
        description="Predominant emotion detected from the 7 standard FER classes"
    )
    emotion_distribution: Dict[str, float] = Field(
        ...,
        description="Full probability distribution across all 7 standard emotion classes summing to ~1.0"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence score (0.0-1.0), accounting for lighting, head pose, and facial visibility"
    )
    action_units: List[ActionUnit] = Field(
        default_factory=list,
        description="Extracted FACS Action Units with established clinical depression/distress links"
    )
    facial_distress_indicators: List[str] = Field(
        default_factory=list,
        description="Clinical distress markers detected, e.g. 'reduced_smiling', 'brow_lowering', 'flat_affect'"
    )
    explanation: str = Field(
        ...,
        min_length=10,
        description="Mandatory human-readable summary explaining what drove this reading for Explainable AI (XAI)"
    )

    @field_validator("emotion_distribution")
    @classmethod
    def validate_distribution_keys(cls, v: Dict[str, float]) -> Dict[str, float]:
        required_keys = {e.value for e in PrimaryEmotion}
        missing = required_keys - set(v.keys())
        if missing:
            raise ValueError(f"Emotion distribution missing required emotion classes: {missing}")
        return v


class FrameAnalysisRequest(BaseModel):
    session_id: str = Field(..., min_length=1, description="Unique session ID")
    user_id: Optional[str] = Field("user-default", description="User ID for baseline tracking")
    image_base64: str = Field(..., description="JPEG/PNG compressed base64 image (no stream)")
    trigger_reason: Optional[str] = Field(
        "periodic_interval",
        description="Reason for capture: 'periodic_interval' (20-30s) or 'sentiment_shift'"
    )


class UserRollingBaseline(BaseModel):
    user_id: str
    sample_count: int
    sessions_tracked: int
    baseline_distribution: Dict[str, float]
    mean_au12_intensity: float
    mean_au04_intensity: float
    last_updated: str


class SessionFramesResponse(BaseModel):
    session_id: str
    total_frames_analyzed: int
    average_confidence: float
    frames: List[StructuredFacialOutput]
    baseline_deviation_score: float
    dds_facial_subscore: float
    explanation_summary: str
