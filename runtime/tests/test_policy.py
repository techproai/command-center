from app.models import EvaluateRequest, RiskTier
from app.policy import evaluate_policy


def test_policy_denies_when_action_cap_exceeded() -> None:
    result = evaluate_policy(
        EvaluateRequest(
            action="browser.extract",
            risk_tier=RiskTier.TIER_1,
            expected_actions_this_hour=40,
            expected_linkedin_messages=0,
            policy={"maxActionsPerHour": 20, "maxLinkedinMessages": 30, "requireApprovalTier": 3},
        )
    )

    assert result.decision == "deny"


def test_policy_requires_approval_for_tier_three() -> None:
    result = evaluate_policy(
        EvaluateRequest(
            action="linkedin.send_message",
            risk_tier=RiskTier.TIER_3,
            expected_actions_this_hour=10,
            expected_linkedin_messages=8,
            policy={"maxActionsPerHour": 20, "maxLinkedinMessages": 30, "requireApprovalTier": 3},
        )
    )

    assert result.decision == "require_approval"


def test_policy_allows_low_risk_action() -> None:
    result = evaluate_policy(
        EvaluateRequest(
            action="browser.extract",
            risk_tier=RiskTier.TIER_1,
            expected_actions_this_hour=10,
            expected_linkedin_messages=0,
            policy={"maxActionsPerHour": 20, "maxLinkedinMessages": 30, "requireApprovalTier": 3},
        )
    )

    assert result.decision == "allow"

