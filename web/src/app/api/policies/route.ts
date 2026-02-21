import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  const workspaceId = await getWorkspaceId();
  const policies = await prisma.policy.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return ok(policies);
}

