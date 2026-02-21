from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class RiskTier(StrEnum):
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"
    TIER_3 = "tier_3"


class PolicyDecision(StrEnum):
    ALLOW = "allow"
    REQUIRE_APPROVAL = "require_approval"
    DENY = "deny"


class EvaluateRequest(BaseModel):
    action: str
    risk_tier: RiskTier
    expected_actions_this_hour: int = Field(ge=0)
    expected_linkedin_messages: int = Field(ge=0)
    policy: dict[str, Any]


class EvaluateResponse(BaseModel):
    decision: PolicyDecision
    reason: str


class ExecuteTaskRequest(BaseModel):
    run_id: str
    task_id: str
    context: dict[str, Any] = Field(default_factory=dict)
    tool_bindings: dict[str, Any] = Field(default_factory=dict)
    policy_context: dict[str, Any] = Field(default_factory=dict)


class ExecuteTaskResponse(BaseModel):
    run_id: str
    task_id: str
    status: str
    output: dict[str, Any] = Field(default_factory=dict)

