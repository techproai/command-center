export function KpiCard(props: { title: string; value: string; hint: string }) {
  return (
    <article className="surface rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{props.title}</p>
      <p className="mt-2 text-2xl font-semibold">{props.value}</p>
      <p className="mt-1 text-sm text-slate-600">{props.hint}</p>
    </article>
  );
}

