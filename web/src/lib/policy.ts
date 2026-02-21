import type { AgentKind, Policy } from "@prisma/client";
import type { PolicyDecision, RiskTier } from "@/lib/contracts";

export function mapRiskTier(kind: AgentKind, action: string): RiskTier {
  if (kind === "linkedin") {
    if (action.includes("message") || action.includes("connect")) {
      return "tier_3";
    }
    return "tier_2";
  }

  if (kind === "browser") {
    return action.includes("extract") ? "tier_1" : "tier_2";
  }

  return "tier_2";
}

export function evaluatePolicy(
  policy: Pick<Policy, "maxActionsPerHour" | "maxLinkedinMessages" | "requireApprovalTier">,
  args: { kind: AgentKind; action: string; expectedActionsThisHour: number },
): PolicyDecision {
  const riskTier = mapRiskTier(args.kind, args.action);
  const tierNumber = Number(riskTier.split("_")[1]);

  if (args.expectedActionsThisHour > policy.maxActionsPerHour) {
    return "deny";
  }

  if (args.kind === "linkedin" && args.expectedActionsThisHour > policy.maxLinkedinMessages) {
    return "deny";
  }

  if (tierNumber >= policy.requireApprovalTier) {
    return "require_approval";
  }

  return "allow";
}

