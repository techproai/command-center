const toneClasses = {
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-sky-100 text-sky-700",
  neutral: "bg-slate-100 text-slate-700",
} as const;

export function Badge(props: { label: string; tone?: keyof typeof toneClasses }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${toneClasses[props.tone ?? "neutral"]}`}>
      {props.label}
    </span>
  );
}

