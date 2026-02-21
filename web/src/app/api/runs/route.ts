import { createRunSchema } from "@/lib/contracts";
import { Prisma } from "@prisma/client";
import { recordAudit } from "@/lib/audit";
import { fail, ok } from "@/lib/http";
import { evaluatePolicy } from "@/lib/policy";
import { prisma } from "@/lib/prisma";
import { completeRun, failRun } from "@/lib/run-executor";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  const workspaceId = await getWorkspaceId();

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
  const run = await prisma.run.create({
    data: {
      workspaceId,
      agentId: agent.id,
      deploymentId: deployment.id,
      status: "running",
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
          objective:
            typeof agentConfig.objective === "string" ? agentConfig.objective : "No objective configured",
        } as Prisma.InputJsonValue,
      },
      {
        runId: run.id,
        name: "execute_primary_action",
        status: "running",
        startedAt,
      },
    ],
  });

  const expectedActionsThisHour = Number(agentConfig.maxActionsPerHour ?? 20);
  const decision = evaluatePolicy(agent.policy, {
    kind: agent.kind,
    action: agent.kind === "linkedin" ? "send_message" : "extract_data",
    expectedActionsThisHour,
  });

  if (decision === "deny") {
    await failRun(run.id, "Blocked by policy limits.");
  } else if (decision === "require_approval") {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "waiting_approval" },
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
    await completeRun(run.id, {
      summary: "Run completed under policy gate.",
      recordsProcessed: Math.floor(Math.random() * 20) + 5,
      action: agent.kind,
    });
  }

  await recordAudit({
    workspaceId,
    actor: "owner@command.center",
    action: "run.create",
    targetType: "run",
    targetId: run.id,
    detail: { agentId: agent.id, deploymentId: deployment.id, policyDecision: decision },
  });

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

