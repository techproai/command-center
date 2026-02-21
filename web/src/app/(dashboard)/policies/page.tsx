import { Badge } from "@/components/badge";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export default async function PoliciesPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-4">
      <section className="surface rounded-2xl p-5">
        <h2 className="text-2xl font-semibold">Policies</h2>
        <p className="mt-2 text-sm text-slate-600">Configure autonomy limits, approval thresholds, and LinkedIn safety envelopes.</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {snapshot.policies.map((policy) => (
          <article className="surface rounded-2xl p-4" key={policy.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{policy.name}</h3>
              <Badge label={`Tier ${policy.requireApprovalTier}+ approvals`} tone="warning" />
            </div>
            <p className="mt-2 text-sm text-slate-600">{policy.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="text-xs uppercase tracking-[0.12em] text-slate-500">Max actions/hour</dt>
                <dd className="mt-1 text-lg font-semibold">{policy.maxActionsPerHour}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <dt className="text-xs uppercase tracking-[0.12em] text-slate-500">LinkedIn messages/day</dt>
                <dd className="mt-1 text-lg font-semibold">{policy.maxLinkedinMessages}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <section className="surface rounded-2xl p-4">
        <h3 className="text-lg font-semibold">Template Library</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {snapshot.templates.map((template) => (
            <article className="rounded-xl border border-slate-200 bg-white p-3" key={template.id}>
              <p className="font-medium">{template.name}</p>
              <p className="mt-1 text-xs text-slate-500">{template.description}</p>
              <div className="mt-2">
                <Badge label={template.kind} tone="info" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

