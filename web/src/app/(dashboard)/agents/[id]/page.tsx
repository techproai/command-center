import Link from "next/link";
import { Badge } from "@/components/badge";
import { CancelRunButton } from "@/components/cancel-run-button";
import { prisma } from "@/lib/prisma";
import { syncPendingRunsForWorkspace } from "@/lib/run-sync";
import { getWorkspaceId } from "@/lib/workspace";

type Params = { params: Promise<{ id: string }> };

export default async function AgentDetailPage({ params }: Params) {
  const workspaceId = await getWorkspaceId();
  await syncPendingRunsForWorkspace(workspaceId);
  const { id } = await params;

  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
    include: {
      policy: true,
      deployments: { orderBy: { version: "desc" } },
      runs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!agent) {
    return (
      <div className="surface rounded-2xl p-6">
        <p>Agent not found.</p>
        <Link className="mt-2 inline-block text-sm text-[#005f73]" href="/agents">
          Back to agents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="surface rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Agent Detail</p>
        <h2 className="mt-2 text-2xl font-semibold">{agent.name}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge label={agent.kind} tone="info" />
          <Badge label={`Policy: ${agent.policy.name}`} tone="neutral" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <h3 className="text-lg font-semibold">Config Snapshot</h3>
          <pre className="mt-3 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(agent.config, null, 2)}</pre>
        </article>

        <article className="surface rounded-2xl p-4">
          <h3 className="text-lg font-semibold">Deployments</h3>
          <div className="mt-3 space-y-2">
            {agent.deployments.map((deployment) => (
              <div className="rounded-xl border border-slate-200 bg-white p-3" key={deployment.id}>
                <p className="text-sm font-medium">Version {deployment.version}</p>
                <p className="text-xs text-slate-500">{deployment.status} • {new Date(deployment.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {agent.deployments.length === 0 ? <p className="text-sm text-slate-500">No deployments yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="surface overflow-hidden rounded-2xl">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold">Recent Runs</h3>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Run</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {agent.runs.map((run) => (
              <tr className="border-t border-slate-100" key={run.id}>
                <td className="px-4 py-3 font-mono text-xs">{run.id.slice(0, 12)}</td>
                <td className="px-4 py-3">
                  <Badge label={run.status} tone={run.status === "failed" ? "danger" : run.status === "succeeded" ? "success" : "info"} />
                </td>
                <td className="px-4 py-3">{run.startedAt ? new Date(run.startedAt).toLocaleString() : "-"}</td>
                <td className="px-4 py-3">
                  <CancelRunButton runId={run.id} disabled={["succeeded", "failed", "cancelled"].includes(run.status)} />
                </td>
              </tr>
            ))}
            {agent.runs.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-sm text-slate-500" colSpan={4}>
                  No runs recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

