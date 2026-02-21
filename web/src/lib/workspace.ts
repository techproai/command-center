import { prisma } from "@/lib/prisma";
import { DEFAULT_WORKSPACE_ID, ensureBootstrapData } from "@/lib/bootstrap";

export async function getWorkspaceId() {
  await ensureBootstrapData();
  return DEFAULT_WORKSPACE_ID;
}

export async function getWorkspace() {
  const workspaceId = await getWorkspaceId();
  return prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
}

