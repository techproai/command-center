from app.models import EvaluateRequest, EvaluateResponse, PolicyDecision, RiskTier


def evaluate_policy(request: EvaluateRequest) -> EvaluateResponse:
    max_actions_per_hour = int(request.policy.get("maxActionsPerHour", 20))
    max_linkedin_messages = int(request.policy.get("maxLinkedinMessages", 30))
    require_approval_tier = int(request.policy.get("requireApprovalTier", 3))

    if request.expected_actions_this_hour > max_actions_per_hour:
        return EvaluateResponse(
            decision=PolicyDecision.DENY,
            reason="Exceeded global actions-per-hour policy cap.",
        )

    if "linkedin" in request.action and request.expected_linkedin_messages > max_linkedin_messages:
        return EvaluateResponse(
            decision=PolicyDecision.DENY,
            reason="Exceeded LinkedIn message policy cap.",
        )

    risk_number = int(request.risk_tier.split("_")[1])
    if risk_number >= require_approval_tier:
        return EvaluateResponse(
            decision=PolicyDecision.REQUIRE_APPROVAL,
            reason=f"Risk tier {request.risk_tier} requires manual approval.",
        )

    return EvaluateResponse(
        decision=PolicyDecision.ALLOW,
        reason="Action is within autonomous policy envelope.",
    )


def infer_risk_tier(action: str) -> RiskTier:
    if "linkedin" in action and ("message" in action or "connect" in action):
        return RiskTier.TIER_3

    if "extract" in action:
        return RiskTier.TIER_1

    return RiskTier.TIER_2

