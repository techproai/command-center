import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function completeRun(runId: string, output: Record<string, unknown>) {
  const now = new Date();

  await prisma.task.updateMany({
    where: { runId, status: { in: ["queued", "running"] } },
    data: {
      status: "succeeded",
      finishedAt: now,
      output: output as Prisma.InputJsonValue,
    },
  });

  return prisma.run.update({
    where: { id: runId },
    data: {
      status: "succeeded",
      output: output as Prisma.InputJsonValue,
      finishedAt: now,
    },
  });
}

export async function failRun(runId: string, reason: string) {
  const now = new Date();

  await prisma.task.updateMany({
    where: { runId, status: { in: ["queued", "running"] } },
    data: {
      status: "failed",
      finishedAt: now,
      error: reason,
    },
  });

  return prisma.run.update({
    where: { id: runId },
    data: {
      status: "failed",
      failureReason: reason,
      finishedAt: now,
    },
  });
}

