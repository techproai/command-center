import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;

  const run = await prisma.run.findFirst({
    where: { id, workspaceId },
    include: {
      agent: true,
      deployment: true,
      tasks: true,
      approvals: true,
    },
  });

  if (!run) {
    return fail("Run not found", 404);
  }

  return ok(run);
}

