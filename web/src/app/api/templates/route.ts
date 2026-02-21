import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getWorkspaceId } from "@/lib/workspace";

export async function GET() {
  const workspaceId = await getWorkspaceId();
  const templates = await prisma.agentTemplate.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return ok(templates);
}

