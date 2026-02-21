import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
    include: {
      runs: true,
    },
  });

  if (!agent) {
    return fail("Agent not found", 404);
  }

  const totalRuns = agent.runs.length;
  const succeeded = agent.runs.filter((run) => run.status === "succeeded").length;
  const failed = agent.runs.filter((run) => run.status === "failed").length;
  const waitingApproval = agent.runs.filter((run) => run.status === "waiting_approval").length;

  return ok({
    totalRuns,
    succeeded,
    failed,
    waitingApproval,
    successRate: totalRuns === 0 ? 0 : Number(((succeeded / totalRuns) * 100).toFixed(2)),
  });
}

