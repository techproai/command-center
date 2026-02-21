import { z } from "zod";

export const agentKindSchema = z.enum(["browser", "linkedin", "webhook"]);
export type AgentKind = z.infer<typeof agentKindSchema>;

export const riskTierSchema = z.enum(["tier_1", "tier_2", "tier_3"]);
export type RiskTier = z.infer<typeof riskTierSchema>;

export const agentConfigSchema = z.object({
  objective: z.string().min(10),
  tools: z.array(z.string()).min(1),
  schedule: z.string().optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  maxActionsPerHour: z.number().int().min(1).max(100).default(20),
  linkedInGuardedMode: z.boolean().default(true),
});

export const createAgentSchema = z.object({
  name: z.string().min(3).max(120),
  kind: agentKindSchema,
  templateId: z.string().optional(),
  policyId: z.string(),
  config: agentConfigSchema,
});

export const createRunSchema = z.object({
  agentId: z.string(),
  deploymentId: z.string(),
  input: z.record(z.string(), z.unknown()).default({}),
});

export const policyDecisionSchema = z.enum(["allow", "require_approval", "deny"]);
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;
