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


class OrchestrateRunRequest(BaseModel):
    run_id: str
    agent_kind: str
    objective: str
    tools: list[str] = Field(default_factory=list)
    input: dict[str, Any] = Field(default_factory=dict)
    max_retries: int = Field(default=3, ge=0, le=10)
    simulate_seconds: float = Field(default=0.8, ge=0, le=3)
    force_retry: bool = False
    force_fail: bool = False


class OrchestrateRunResponse(BaseModel):
    job_id: str
    state: str


class JobStatusResponse(BaseModel):
    job_id: str
    state: str
    ready: bool
    successful: bool
    failed: bool
    result: dict[str, Any] | None = None
    error: str | None = None


class CancelJobResponse(BaseModel):
    job_id: str
    revoked: bool
