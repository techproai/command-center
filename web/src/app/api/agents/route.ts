import { createAgentSchema } from "@/lib/contracts";
import { recordAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  const workspaceId = await getWorkspaceId();

  const agents = await prisma.agent.findMany({
    where: { workspaceId },
    include: {
      policy: true,
      deployments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return ok(agents);
}

export async function POST(req: Request) {
  const workspaceId = await getWorkspaceId();
  const body = await req.json();
  const parsed = createAgentSchema.safeParse(body);

  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const policy = await prisma.policy.findFirst({
    where: { id: parsed.data.policyId, workspaceId },
  });

  if (!policy) {
    return fail("Policy not found", 404);
  }

  const agent = await prisma.agent.create({
    data: {
      workspaceId,
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
    action: "agent.create",
    targetType: "agent",
    targetId: agent.id,
    detail: { kind: agent.kind, name: agent.name },
  });

  return ok(agent, { status: 201 });
}

