import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { enqueueRuntimeRun } from "@/lib/runtime-client";
import { failRun } from "@/lib/run-executor";
import { syncRunWithRuntime } from "@/lib/run-sync";
import { getWorkspaceId } from "@/lib/workspace";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

function mapRuntimeStateToRunStatus(runtimeState: string) {
  switch (runtimeState) {
    case "PENDING":
    case "RECEIVED":
      return "queued" as const;
    case "STARTED":
    case "RETRY":
      return "running" as const;
    case "SUCCESS":
      return "succeeded" as const;
    case "FAILURE":
      return "failed" as const;
    case "REVOKED":
      return "cancelled" as const;
    default:
      return "queued" as const;
  }
}

export async function POST(req: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;

  const approval = await prisma.approvalRequest.findFirst({
    where: { id, run: { workspaceId } },
    include: {
      run: {
        include: {
          agent: true,
        },
      },
    },
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
    const agentConfig = approval.run.agent.config as Record<string, unknown>;
    const objective =
      typeof agentConfig.objective === "string"
        ? agentConfig.objective
        : "Execute approved action with policy controls";
    const tools = Array.isArray(agentConfig.tools)
      ? agentConfig.tools.filter((item): item is string => typeof item === "string")
      : [approval.run.agent.kind, "webhook"];

    try {
      const runtime = await enqueueRuntimeRun({
        run_id: approval.runId,
        agent_kind: approval.run.agent.kind,
        objective,
        tools,
        input: (approval.run.input as Record<string, unknown>) ?? {},
        max_retries: Number(agentConfig.maxRetries ?? 3),
      });

      await prisma.run.update({
        where: { id: approval.runId },
        data: {
          status: mapRuntimeStateToRunStatus(runtime.state),
          runtimeJobId: runtime.job_id,
          runtimeState: runtime.state,
        },
      });

      await prisma.task.updateMany({
        where: { runId: approval.runId, name: "execute_primary_action", status: "queued" },
        data: {
          status: "running",
          startedAt: new Date(),
        },
      });

      await syncRunWithRuntime(approval.runId);
    } catch {
      await failRun(approval.runId, "Runtime orchestrator is unavailable after approval.");
      await prisma.run.update({
        where: { id: approval.runId },
        data: { runtimeState: "DISPATCH_FAILED" },
      });
    }
  } else {
    await failRun(approval.runId, "Approval rejected by operator.");
    await prisma.run.update({
      where: { id: approval.runId },
      data: { runtimeState: "REJECTED" },
    });
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
