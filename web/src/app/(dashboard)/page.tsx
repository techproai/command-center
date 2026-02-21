import Link from "next/link";
import { Badge } from "@/components/badge";
import { KpiCard } from "@/components/kpi-card";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export default async function MissionControlPage() {
  const snapshot = await getDashboardSnapshot();
  const pendingApprovals = snapshot.approvals.filter((approval) => approval.status === "pending").slice(0, 5);
  const recentRuns = snapshot.runs.slice(0, 6);

  return (
    <div className="space-y-4">
      <section className="surface rounded-2xl p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Mission Control</p>
        <h2 className="mt-2 text-3xl font-semibold">Autonomous Agent Command Center</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Launch policy-aware agents, deploy new versions, review guarded actions, and operate lead-gen automation from one control plane.
        </p>
      </section>

      <section className="panel-grid md:grid-cols-4">
        <KpiCard title="Total Agents" value={String(snapshot.stats.totalAgents)} hint="Across browser, LinkedIn, and webhook classes" />
        <KpiCard title="Active Deployments" value={String(snapshot.stats.activeDeployments)} hint="Immutable snapshots serving current runs" />
        <KpiCard title="Queued Approvals" value={String(snapshot.stats.queuedApprovals)} hint="Tier-gated actions awaiting operator decisions" />
        <KpiCard title="Run Success Rate" value={`${snapshot.stats.runSuccessRate}%`} hint="Recent execution reliability signal" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="surface rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Runs</h3>
            <Link className="text-sm text-[#005f73]" href="/runs">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {recentRuns.length === 0 ? <p className="text-sm text-slate-500">No runs yet.</p> : null}
            {recentRuns.map((run) => (
              <div className="rounded-xl border border-slate-200 bg-white p-3" key={run.id}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{run.agent.name}</p>
                  <Badge
                    label={run.status}
                    tone={
                      run.status === "succeeded"
                        ? "success"
                        : run.status === "waiting_approval"
                          ? "warning"
                          : run.status === "failed"
                            ? "danger"
                            : "info"
                    }
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Deployment v{run.deployment.version} • {new Date(run.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Approval Queue</h3>
            <Link className="text-sm text-[#005f73]" href="/approvals">
              Review queue
            </Link>
          </div>

          <div className="space-y-2">
            {pendingApprovals.length === 0 ? <p className="text-sm text-slate-500">No pending approvals.</p> : null}
            {pendingApprovals.map((approval) => (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3" key={approval.id}>
                <p className="text-sm font-medium">{approval.run.agent.name}</p>
                <p className="text-xs text-slate-600">{approval.action}</p>
                <p className="mt-1 text-xs text-slate-500">{approval.reason}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

