import { createAgentSchema } from "@/lib/contracts";
import { recordAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
    include: {
      policy: true,
      deployments: { orderBy: { version: "desc" } },
      runs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!agent) {
    return fail("Agent not found", 404);
  }

  return ok(agent);
}

export async function PUT(req: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;

  const existing = await prisma.agent.findFirst({ where: { id, workspaceId } });
  if (!existing) {
    return fail("Agent not found", 404);
  }

  const body = await req.json();
  const parsed = createAgentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  if (parsed.data.policyId) {
    const policy = await prisma.policy.findFirst({
      where: { id: parsed.data.policyId, workspaceId },
    });

    if (!policy) {
      return fail("Policy not found", 404);
    }
  }

  const agent = await prisma.agent.update({
    where: { id },
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      policyId: parsed.data.policyId,
      templateId: parsed.data.templateId,
      config: parsed.data.config,
    },
  });

  await recordAudit({
    workspaceId,
    actor: "owner@command.center",
    action: "agent.update",
    targetType: "agent",
    targetId: id,
    detail: parsed.data,
  });

  return ok(agent);
}

