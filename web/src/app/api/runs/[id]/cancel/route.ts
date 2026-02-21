import { recordAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cancelRuntimeJob } from "@/lib/runtime-client";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;

  const run = await prisma.run.findFirst({
    where: { id, workspaceId },
  });

  if (!run) {
    return fail("Run not found", 404);
  }

  if (["succeeded", "failed", "cancelled"].includes(run.status)) {
    return fail(`Run already ${run.status}`, 409);
  }

  if (run.runtimeJobId) {
    try {
      await cancelRuntimeJob(run.runtimeJobId);
    } catch {
      // cancellation still proceeds in control plane
    }
  }

  await prisma.task.updateMany({
    where: { runId: id, status: { in: ["queued", "running"] } },
    data: {
      status: "skipped",
      finishedAt: new Date(),
      error: "Run cancelled by operator",
    },
  });

  const cancelled = await prisma.run.update({
    where: { id },
    data: {
      status: "cancelled",
      runtimeState: "REVOKED",
      failureReason: "Cancelled by operator",
      finishedAt: new Date(),
    },
  });

  await recordAudit({
    workspaceId,
    actor: "owner@command.center",
    action: "run.cancel",
    targetType: "run",
    targetId: id,
  });

  return ok(cancelled);
}

