import { prisma } from "@/lib/prisma";
import { syncRunWithRuntime } from "@/lib/run-sync";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const workspaceId = await getWorkspaceId();
  const { id } = await params;
  await syncRunWithRuntime(id);

  const run = await prisma.run.findFirst({
    where: { id, workspaceId },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      approvals: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!run) {
    return new Response("Run not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const eventPayload = {
        run: {
          id: run.id,
          status: run.status,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
        },
        tasks: run.tasks,
        approvals: run.approvals,
      };

      controller.enqueue(encoder.encode(`event: snapshot\n`));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(eventPayload)}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

