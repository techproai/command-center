import { Badge } from "@/components/badge";
import { ApprovalDecisionButtons } from "@/components/approval-decision-buttons";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export default async function ApprovalsPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-4">
      <section className="surface rounded-2xl p-5">
        <h2 className="text-2xl font-semibold">Approvals</h2>
        <p className="mt-2 text-sm text-slate-600">Review and resolve policy-gated actions requiring operator authorization.</p>
      </section>

      <section className="surface overflow-hidden rounded-2xl">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Decision</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.approvals.map((approval) => (
              <tr className="border-t border-slate-100" key={approval.id}>
                <td className="px-4 py-3">{approval.run.agent.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{approval.action}</td>
                <td className="px-4 py-3">{approval.reason}</td>
                <td className="px-4 py-3">
                  <Badge
                    label={approval.status}
                    tone={approval.status === "approved" ? "success" : approval.status === "rejected" ? "danger" : "warning"}
                  />
                </td>
                <td className="px-4 py-3">
                  {approval.status === "pending" ? <ApprovalDecisionButtons approvalId={approval.id} /> : <span className="text-xs text-slate-500">Resolved</span>}
                </td>
              </tr>
            ))}
            {snapshot.approvals.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-sm text-slate-500" colSpan={5}>
                  No approvals requested yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}

