import { createRunSchema } from "@/lib/contracts";
import { Prisma } from "@prisma/client";
import { recordAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { evaluatePolicy } from "@/lib/policy";
import { prisma } from "@/lib/prisma";
import { enqueueRuntimeRun } from "@/lib/runtime-client";
import { completeRun, failRun } from "@/lib/run-executor";
import { syncPendingRunsForWorkspace, syncRunWithRuntime } from "@/lib/run-sync";
import { getWorkspaceId } from "@/lib/workspace";

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

export async function GET() {
  const workspaceId = await getWorkspaceId();
  await syncPendingRunsForWorkspace(workspaceId);

  const runs = await prisma.run.findMany({
    where: { workspaceId },
    include: {
      agent: true,
      deployment: true,
      tasks: true,
      approvals: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return ok(runs);
}

export async function POST(req: Request) {
  const workspaceId = await getWorkspaceId();
  const payload = await req.json();
  const parsed = createRunSchema.safeParse(payload);

  if (!parsed.success) {
    return fail(parsed.error.issues.map((issue) => issue.message).join("; "));
  }

  const agent = await prisma.agent.findFirst({
    where: { id: parsed.data.agentId, workspaceId },
    include: { policy: true },
  });

  if (!agent) {
    return fail("Agent not found", 404);
  }

  const deployment = await prisma.deployment.findFirst({
    where: {
      id: parsed.data.deploymentId,
      workspaceId,
      agentId: agent.id,
      status: "active",
    },
  });

  if (!deployment) {
    return fail("Active deployment not found", 404);
  }

  const startedAt = new Date();
  const agentConfig = agent.config as Record<string, unknown>;
  const objective =
    typeof agentConfig.objective === "string" ? agentConfig.objective : "Autonomous run execution objective";
  const tools = Array.isArray(agentConfig.tools)
    ? agentConfig.tools.filter((item): item is string => typeof item === "string")
    : [agent.kind, "webhook"];

  const run = await prisma.run.create({
    data: {
      workspaceId,
      agentId: agent.id,
      deploymentId: deployment.id,
      status: "queued",
      runtimeState: "PENDING",
      startedAt,
      input: parsed.data.input as Prisma.InputJsonValue,
    },
  });

  await prisma.task.createMany({
    data: [
      {
        runId: run.id,
        name: "prepare_context",
        status: "succeeded",
        startedAt,
        finishedAt: new Date(),
        output: {
          source: "control_plane",
          objective,
        } as Prisma.InputJsonValue,
      },
      {
        runId: run.id,
        name: "execute_primary_action",
        status: "queued",
      },
    ],
  });

  const expectedActionsThisHour = Number(agentConfig.maxActionsPerHour ?? 20);
  const decision = evaluatePolicy(agent.policy, {
    kind: agent.kind,
    action: agent.kind === "linkedin" ? "send_message" : "extract_data",
    expectedActionsThisHour,
  });

  let runtimeJobId: string | undefined;

  if (decision === "deny") {
    await failRun(run.id, "Blocked by policy limits.");
    await prisma.run.update({
      where: { id: run.id },
      data: { runtimeState: "DENIED" },
    });
  } else if (decision === "require_approval") {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "waiting_approval", runtimeState: "WAITING_APPROVAL" },
    });

    await prisma.approvalRequest.create({
      data: {
        runId: run.id,
        action: agent.kind === "linkedin" ? "linkedin.send_message" : "external.write",
        reason: "Policy tier requires operator approval.",
        payload: {
          proposedActionCount: expectedActionsThisHour,
          policyId: agent.policyId,
        },
      },
    });
  } else {
    try {
      const runtime = await enqueueRuntimeRun({
        run_id: run.id,
        agent_kind: agent.kind,
        objective,
        tools,
        input: parsed.data.input,
        max_retries: Number(agentConfig.maxRetries ?? 3),
      });

      runtimeJobId = runtime.job_id;
      const nextStatus = mapRuntimeStateToRunStatus(runtime.state);

      await prisma.run.update({
        where: { id: run.id },
        data: {
          runtimeJobId,
          runtimeState: runtime.state,
          status: nextStatus,
        },
      });

      if (nextStatus === "running") {
        await prisma.task.updateMany({
          where: { runId: run.id, name: "execute_primary_action" },
          data: { status: "running", startedAt: new Date() },
        });
      }

      if (nextStatus === "succeeded") {
        await completeRun(run.id, { summary: "Runtime completed quickly", action: agent.kind });
      }

      if (nextStatus === "failed") {
        await failRun(run.id, "Runtime failed before run could start.");
      }
    } catch {
      await failRun(run.id, "Runtime orchestrator is unavailable.");
      await prisma.run.update({
        where: { id: run.id },
        data: { runtimeState: "DISPATCH_FAILED" },
      });
    }
  }

  await recordAudit({
    workspaceId,
    actor: "owner@command.center",
    action: "run.create",
    targetType: "run",
    targetId: run.id,
    detail: {
      agentId: agent.id,
      deploymentId: deployment.id,
      policyDecision: decision,
      runtimeJobId,
    },
  });

  if (runtimeJobId) {
    await syncRunWithRuntime(run.id);
  }

  const hydratedRun = await prisma.run.findUniqueOrThrow({
    where: { id: run.id },
    include: {
      tasks: true,
      approvals: true,
      agent: true,
      deployment: true,
    },
  });

  return ok(hydratedRun, { status: 201 });
}
