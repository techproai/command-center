import Link from "next/link";
import { Badge } from "@/components/badge";
import { CreateAgentForm } from "@/components/create-agent-form";
import { DeployButton } from "@/components/deploy-button";
import { RunAgentButton } from "@/components/run-agent-button";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export default async function AgentsPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-4">
      <section className="surface rounded-2xl p-5">
        <h2 className="text-2xl font-semibold">Agents</h2>
        <p className="mt-2 text-sm text-slate-600">Create and tune autonomous agents with policy guardrails and deployment versioning.</p>
      </section>

      <CreateAgentForm policies={snapshot.policies} templates={snapshot.templates} />

      <section className="surface overflow-hidden rounded-2xl">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-lg font-semibold">Configured Agents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Policy</th>
                <th className="px-4 py-3">Latest Deployment</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.agents.map((agent) => {
                const latestDeployment = agent.deployments[0];
                return (
                  <tr className="border-t border-slate-100" key={agent.id}>
                    <td className="px-4 py-3">
                      <Link className="font-medium text-[#005f73]" href={`/agents/${agent.id}`}>
                        {agent.name}
                      </Link>
                      <p className="text-xs text-slate-500">Updated {new Date(agent.updatedAt).toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={agent.kind} tone="info" />
                    </td>
                    <td className="px-4 py-3">{agent.policy.name}</td>
                    <td className="px-4 py-3">
                      {latestDeployment ? `v${latestDeployment.version} (${latestDeployment.status})` : "Not deployed"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <DeployButton agentId={agent.id} />
                        <RunAgentButton agentId={agent.id} deploymentId={latestDeployment?.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {snapshot.agents.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-sm text-slate-500" colSpan={5}>
                    No agents yet. Create your first agent above.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

