import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ triggerId: string }> };

export async function POST(req: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { triggerId } = await params;

  const trigger = await prisma.webhookTrigger.findFirst({
    where: { id: triggerId, workspaceId, enabled: true },
  });

  if (!trigger) {
    return fail("Webhook trigger not found", 404);
  }

  const signature = req.headers.get("x-command-center-signature");
  if (!signature || signature !== trigger.secret) {
    return fail("Invalid webhook signature", 401);
  }

  const input = await req.json();
  const deployment = await prisma.deployment.findFirst({
    where: {
      workspaceId,
      agentId: trigger.agentId,
      status: "active",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!deployment) {
    return fail("No active deployment linked to trigger", 409);
  }

  const run = await prisma.run.create({
    data: {
      workspaceId,
      agentId: trigger.agentId,
      deploymentId: deployment.id,
      status: "succeeded",
      input,
      output: {
        summary: "Webhook ingested and acknowledged.",
        sourceTrigger: trigger.name,
      },
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  return ok({ runId: run.id, status: run.status }, { status: 201 });
}

