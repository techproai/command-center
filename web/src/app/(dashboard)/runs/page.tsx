import { Badge } from "@/components/badge";
import { CancelRunButton } from "@/components/cancel-run-button";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export default async function RunsPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-4">
      <section className="surface rounded-2xl p-5">
        <h2 className="text-2xl font-semibold">Runs</h2>
        <p className="mt-2 text-sm text-slate-600">Inspect execution state, failures, and policy-gated waits.</p>
      </section>

      <section className="surface overflow-hidden rounded-2xl">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Run</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Runtime</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.runs.map((run) => (
              <tr className="border-t border-slate-100" key={run.id}>
                <td className="px-4 py-3 font-mono text-xs">{run.id.slice(0, 12)}</td>
                <td className="px-4 py-3">{run.agent.name}</td>
                <td className="px-4 py-3">
                  <Badge
                    label={run.status}
                    tone={
                      run.status === "succeeded"
                        ? "success"
                        : run.status === "failed"
                          ? "danger"
                          : run.status === "waiting_approval"
                            ? "warning"
                            : "info"
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge label={run.runtimeState ?? "n/a"} tone="neutral" />
                </td>
                <td className="px-4 py-3">{new Date(run.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <CancelRunButton runId={run.id} disabled={["succeeded", "failed", "cancelled"].includes(run.status)} />
                </td>
              </tr>
            ))}
            {snapshot.runs.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-sm text-slate-500" colSpan={6}>
                  No runs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

