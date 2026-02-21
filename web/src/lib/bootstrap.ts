import { prisma } from "@/lib/prisma";

export const DEFAULT_WORKSPACE_ID = "default-workspace";

export async function ensureBootstrapData() {
  const workspace = await prisma.workspace.upsert({
    where: { id: DEFAULT_WORKSPACE_ID },
    update: {},
    create: {
      id: DEFAULT_WORKSPACE_ID,
      name: process.env.DEFAULT_WORKSPACE_NAME ?? "Command Center",
    },
  });

  await prisma.user.upsert({
    where: { email: "owner@command.center" },
    update: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      email: "owner@command.center",
      name: "Workspace Owner",
      role: "owner",
    },
  });

  const defaultPolicy = await prisma.policy.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: "Balanced Autonomy",
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "Balanced Autonomy",
      description: "Tier-1 and Tier-2 actions auto-run, Tier-3 requires approval.",
      maxActionsPerHour: 20,
      maxLinkedinMessages: 25,
      requireApprovalTier: 3,
    },
  });

  const templates = [
    {
      name: "Browser Prospect Miner",
      kind: "browser" as const,
      description: "Extract lead data from public pages and normalize into structured records.",
      defaults: {
        objective: "Mine prospect details from target websites and deliver CRM-ready rows.",
        tools: ["browser", "webhook"],
        maxRetries: 3,
        maxActionsPerHour: 20,
        linkedInGuardedMode: true,
      },
    },
    {
      name: "LinkedIn Guarded Outreach",
      kind: "linkedin" as const,
      description: "Run compliant outreach cadences with approval checkpoints.",
      defaults: {
        objective: "Send personalized and compliant outreach with policy-gated approvals.",
        tools: ["linkedin", "message_lint", "webhook"],
        maxRetries: 2,
        maxActionsPerHour: 15,
        linkedInGuardedMode: true,
      },
    },
    {
      name: "Webhook Triage Agent",
      kind: "webhook" as const,
      description: "Classify inbound webhook payloads and route by priority.",
      defaults: {
        objective: "Classify incoming webhook payloads and route by priority.",
        tools: ["webhook", "llm", "router"],
        maxRetries: 3,
        maxActionsPerHour: 50,
        linkedInGuardedMode: true,
      },
    },
  ];

  for (const template of templates) {
    await prisma.agentTemplate.upsert({
      where: {
        workspaceId_name: {
          workspaceId: workspace.id,
          name: template.name,
        },
      },
      update: template,
      create: {
        workspaceId: workspace.id,
        ...template,
      },
    });
  }

  return { workspace, defaultPolicy };
}

