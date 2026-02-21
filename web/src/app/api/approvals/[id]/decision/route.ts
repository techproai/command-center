import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { completeRun, failRun } from "@/lib/run-executor";
import { getWorkspaceId } from "@/lib/workspace";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;

  const approval = await prisma.approvalRequest.findFirst({
    where: { id, run: { workspaceId } },
    include: { run: { include: { agent: true } } },
  });

  if (!approval) {
    return fail("Approval request not found", 404);
  }

  if (approval.status !== "pending") {
    return fail("Approval request already resolved", 409);
  }

  const body = await req.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const decidedAt = new Date();
  const next = await prisma.approvalRequest.update({
    where: { id },
    data: {
      status: parsed.data.decision,
      decidedBy: "owner@command.center",
      decidedAt,
      payload: {
        ...(approval.payload as Record<string, unknown>),
        note: parsed.data.note,
      },
    },
  });

  if (parsed.data.decision === "approved") {
    await completeRun(approval.runId, {
      summary: "Run continued after approval.",
      approvedAction: approval.action,
    });
  } else {
    await failRun(approval.runId, "Approval rejected by operator.");
  }

  await recordAudit({
    workspaceId,
    actor: "owner@command.center",
    action: `approval.${parsed.data.decision}`,
    targetType: "approval_request",
    targetId: id,
    detail: { runId: approval.runId, note: parsed.data.note },
  });

  return ok(next);
}

