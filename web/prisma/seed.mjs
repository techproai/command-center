import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspaceName = process.env.DEFAULT_WORKSPACE_NAME ?? "Command Center";

  const workspace = await prisma.workspace.upsert({
    where: { id: "default-workspace" },
    update: {},
    create: {
      id: "default-workspace",
      name: workspaceName,
    },
  });

  await prisma.user.upsert({
    where: { email: "owner@command.center" },
    update: { workspaceId: workspace.id },
    create: {
      email: "owner@command.center",
      name: "Workspace Owner",
      role: "owner",
      workspaceId: workspace.id,
    },
  });

  const policies = [
    {
      name: "Balanced Autonomy",
      description: "Tier-1 and Tier-2 actions auto-run, Tier-3 requires approval.",
      maxActionsPerHour: 20,
      maxLinkedinMessages: 25,
      requireApprovalTier: 3,
    },
    {
      name: "Compliance Strict",
      description: "Conservative outreach and approvals for most external write actions.",
      maxActionsPerHour: 12,
      maxLinkedinMessages: 15,
      requireApprovalTier: 2,
    },
  ];

  for (const policy of policies) {
    await prisma.policy.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: policy.name } },
      update: policy,
      create: { ...policy, workspaceId: workspace.id },
    });
  }

  const templates = [
    {
      name: "Browser Prospect Miner",
      kind: "browser",
      description: "Extract lead data from public pages and normalize into structured records.",
      defaults: {
        objective: "Mine prospect details from target websites and deliver clean CRM-ready rows.",
        tools: ["browser", "enrichment", "webhook"],
        maxRetries: 3,
        maxActionsPerHour: 20,
        linkedInGuardedMode: true,
      },
    },
    {
      name: "LinkedIn Guarded Outreach",
      kind: "linkedin",
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
      kind: "webhook",
      description: "Classify inbound events and route to downstream systems.",
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
      where: { workspaceId_name: { workspaceId: workspace.id, name: template.name } },
      update: template,
      create: { ...template, workspaceId: workspace.id },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

