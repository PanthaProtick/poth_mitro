from datetime import timezone
from typing import Optional, List, Literal
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, field_validator


class TripSummary(BaseModel):
    id: str
    name: str
    is_synthetic: bool


class TripListResponse(BaseModel):
    items: List[TripSummary]
    next_cursor: Optional[str]


class TripSegmentView(BaseModel):
    id: int
    ordinal: int
    mode: str
    origin: str
    destination: str
    route_reference_available: bool
    route_data_quality: Optional[str]


class TripView(BaseModel):
    id: str
    name: str
    is_synthetic: bool
    segments: List[TripSegmentView]


class IncidentEvidenceView(BaseModel):
    id: str
    kind: str
    title: str
    location: str
    route_id: Optional[int]
    mode: Optional[str]
    direction: Optional[str]
    observed_at: Optional[str]
    age_minutes: Optional[int]
    freshness: str
    source_type: str
    status: str
    is_synthetic: bool
    version: int
    created_at: str
    updated_at: str
    actor_label: str
    description: Optional[str]
    confirmation_note: Optional[str] = None


class RelevanceView(BaseModel):
    state: str
    reason: str


class TripContextResponse(BaseModel):
    trip: TripView
    reports: List[IncidentEvidenceView]
    as_of: str
    evidence_total: int
    reports_next_cursor: Optional[str]
    relevance: RelevanceView


class StrictRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class IncidentCreate(StrictRequest):
    kind: str = Field(min_length=1, max_length=80, description="Disruption type, such as closure, waterlogging, or blockage")
    title: str = Field(min_length=1, max_length=160)
    description: Optional[str] = Field(default=None, max_length=2000)
    location: str = Field(min_length=1, max_length=200)
    mode: str = Field(min_length=1, max_length=80)
    direction: Optional[str] = Field(default=None, max_length=120)
    route_id: Optional[int] = Field(default=None, gt=0)
    observed_at: Optional[AwareDatetime] = None
    source_type: Literal["traveller_report", "operator_notice", "staff_observation"]

    @field_validator("kind", "title", "location", "mode")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("description", "direction")
    @classmethod
    def trim_optional_text(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value is not None else None

    @field_validator("observed_at")
    @classmethod
    def normalize_observed_at(cls, value):
        return value.astimezone(timezone.utc) if value is not None else None


class IncidentUpdate(StrictRequest):
    expected_version: int = Field(gt=0)
    reason: str = Field(min_length=1, max_length=500)
    kind: Optional[str] = Field(default=None, min_length=1, max_length=80)
    title: Optional[str] = Field(default=None, min_length=1, max_length=160)
    description: Optional[str] = Field(default=None, max_length=2000)
    location: Optional[str] = Field(default=None, min_length=1, max_length=200)
    mode: Optional[str] = Field(default=None, min_length=1, max_length=80)
    direction: Optional[str] = Field(default=None, max_length=120)
    route_id: Optional[int] = Field(default=None, gt=0)
    observed_at: Optional[AwareDatetime] = None
    status: Optional[Literal["reported", "confirmed", "disputed", "resolved"]] = None
    confirmation_note: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("reason")
    @classmethod
    def trim_reason(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("kind", "title", "location", "mode")
    @classmethod
    def trim_update_required_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("description", "direction", "confirmation_note")
    @classmethod
    def trim_update_optional_text(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value is not None else None

    @field_validator("observed_at")
    @classmethod
    def normalize_update_observed_at(cls, value):
        return value.astimezone(timezone.utc) if value is not None else None

class HealthStatus(BaseModel):
    status: str = "healthy"
    project_name: str
    environment: str
    database_configured: bool
    gemini_configured: bool
    version: str = "1.0.0"

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Message to send to Gemini model")
    conversation_id: Optional[str] = Field(None, description="Optional conversation context ID")
    system_instruction: Optional[str] = Field(
        "You are an intelligent hackathon assistant providing fast, high-quality, practical responses.",
        description="System prompt instructions"
    )

class ChatResponse(BaseModel):
    reply: str
    model: str
    conversation_id: Optional[str] = None
    is_mock: bool = False

class IdeaGeneratorRequest(BaseModel):
    topic: str = Field(..., description="Hackathon topic, problem statement, or domain")
    target_audience: Optional[str] = Field(None, description="Target end users")

class HackathonIdea(BaseModel):
    title: str
    tagline: str
    target_users: str
    core_features: List[str]
    suggested_tech_stack: List[str]
    winning_pitch_hook: str

class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tags: List[str] = []

class ItemResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    tags: List[str] = []
    created_at: str
