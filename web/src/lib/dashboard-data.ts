import { prisma } from "@/lib/prisma";
import { DEFAULT_WORKSPACE_ID, ensureBootstrapData } from "@/lib/bootstrap";

export async function getDashboardSnapshot() {
  await ensureBootstrapData();
  const workspaceId = DEFAULT_WORKSPACE_ID;

  const [agents, runs, approvals, deployments, policies, templates] = await Promise.all([
    prisma.agent.findMany({
      where: { workspaceId },
      include: {
        policy: true,
        deployments: { orderBy: { version: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.run.findMany({
      where: { workspaceId },
      include: {
        agent: true,
        deployment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.approvalRequest.findMany({
      where: {
        run: { workspaceId },
      },
      include: {
        run: {
          include: { agent: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.deployment.findMany({
      where: { workspaceId },
      include: { agent: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.policy.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.agentTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const stats = {
    totalAgents: agents.length,
    activeDeployments: deployments.filter((deployment) => deployment.status === "active").length,
    queuedApprovals: approvals.filter((approval) => approval.status === "pending").length,
    runSuccessRate:
      runs.length === 0
        ? 0
        : Number(((runs.filter((run) => run.status === "succeeded").length / runs.length) * 100).toFixed(1)),
  };

  return {
    workspaceId,
    agents,
    runs,
    approvals,
    deployments,
    policies,
    templates,
    stats,
  };
}

