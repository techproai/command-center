import { recordAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
    include: {
      deployments: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!agent) {
    return fail("Agent not found", 404);
  }

  const lastVersion = agent.deployments[0]?.version ?? 0;
  const nextVersion = lastVersion + 1;

  await prisma.deployment.updateMany({
    where: { workspaceId, agentId: id, status: "active" },
    data: { status: "archived" },
  });

  const deployment = await prisma.deployment.create({
    data: {
      workspaceId,
      agentId: id,
      version: nextVersion,
      status: "active",
      createdBy: "owner@command.center",
      snapshot: {
        config: agent.config,
        policyId: agent.policyId,
        templateId: agent.templateId,
        kind: agent.kind,
      },
    },
  });

  await recordAudit({
    workspaceId,
    actor: "owner@command.center",
    action: "deployment.create",
    targetType: "deployment",
    targetId: deployment.id,
    detail: { agentId: id, version: nextVersion },
  });

  return ok(deployment, { status: 201 });
}

