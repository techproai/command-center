import { RunStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { completeRun, failRun } from "@/lib/run-executor";
import { getRuntimeJobStatus } from "@/lib/runtime-client";

function mapRuntimeStateToRunStatus(runtimeState: string): RunStatus {
  switch (runtimeState) {
    case "PENDING":
    case "RECEIVED":
      return "queued";
    case "STARTED":
    case "RETRY":
      return "running";
    case "SUCCESS":
      return "succeeded";
    case "FAILURE":
      return "failed";
    case "REVOKED":
      return "cancelled";
    default:
      return "running";
  }
}

async function markRunAsCancelled(runId: string) {
  const now = new Date();

  await prisma.task.updateMany({
    where: { runId, status: { in: ["queued", "running"] } },
    data: {
      status: "skipped",
      finishedAt: now,
      error: "Cancelled by runtime orchestration",
    },
  });

  await prisma.run.update({
    where: { id: runId },
    data: {
      status: "cancelled",
      finishedAt: now,
    },
  });
}

export async function syncRunWithRuntime(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
  });

  if (!run || !run.runtimeJobId) {
    return;
  }

  if (["succeeded", "failed", "cancelled"].includes(run.status)) {
    return;
  }

  let runtime;
  try {
    runtime = await getRuntimeJobStatus(run.runtimeJobId);
  } catch {
    return;
  }

  const nextStatus = mapRuntimeStateToRunStatus(runtime.state);

  if (runtime.state === "SUCCESS") {
    await completeRun(run.id, runtime.result ?? { summary: "Runtime job finished" });
  } else if (runtime.state === "FAILURE") {
    await failRun(run.id, runtime.error ?? "Runtime execution failed");
  } else if (runtime.state === "REVOKED") {
    await markRunAsCancelled(run.id);
  } else {
    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: nextStatus,
        runtimeState: runtime.state,
      },
    });

    if (nextStatus === "running") {
      await prisma.task.updateMany({
        where: { runId: run.id, name: "execute_primary_action", status: "queued" },
        data: {
          status: "running",
          startedAt: run.startedAt ?? new Date(),
        },
      });
    }
  }

  if (["SUCCESS", "FAILURE", "REVOKED"].includes(runtime.state)) {
    await prisma.run.update({
      where: { id: run.id },
      data: {
        runtimeState: runtime.state,
      },
    });
  }
}

export async function syncPendingRunsForWorkspace(workspaceId: string, take = 20) {
  const pendingRuns = await prisma.run.findMany({
    where: {
      workspaceId,
      runtimeJobId: { not: null },
      status: { in: ["queued", "running"] },
    },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true },
  });

  await Promise.all(pendingRuns.map((run) => syncRunWithRuntime(run.id)));
}
