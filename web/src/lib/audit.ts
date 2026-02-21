import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function recordAudit(args: {
  workspaceId: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: Record<string, unknown>;
}) {
  return prisma.auditEvent.create({
    data: {
      workspaceId: args.workspaceId,
      actor: args.actor,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      detail: (args.detail ?? {}) as Prisma.InputJsonValue,
    },
  });
}

