import { Badge } from "@/components/badge";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export default async function DeploymentsPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-4">
      <section className="surface rounded-2xl p-5">
        <h2 className="text-2xl font-semibold">Deployments</h2>
        <p className="mt-2 text-sm text-slate-600">Versioned snapshots of agent config and policy bindings for safe promotion and rollback.</p>
      </section>

      <section className="surface overflow-hidden rounded-2xl">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created By</th>
              <th className="px-4 py-3">Created At</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.deployments.map((deployment) => (
              <tr className="border-t border-slate-100" key={deployment.id}>
                <td className="px-4 py-3">{deployment.agent.name}</td>
                <td className="px-4 py-3">v{deployment.version}</td>
                <td className="px-4 py-3">
                  <Badge label={deployment.status} tone={deployment.status === "active" ? "success" : "neutral"} />
                </td>
                <td className="px-4 py-3">{deployment.createdBy}</td>
                <td className="px-4 py-3">{new Date(deployment.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {snapshot.deployments.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-sm text-slate-500" colSpan={5}>
                  No deployments yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

