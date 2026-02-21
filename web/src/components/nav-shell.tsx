"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Mission Control" },
  { href: "/agents", label: "Agents" },
  { href: "/deployments", label: "Deployments" },
  { href: "/runs", label: "Runs" },
  { href: "/approvals", label: "Approvals" },
  { href: "/policies", label: "Policies" },
];

export function NavShell() {
  const pathname = usePathname();

  return (
    <aside className="surface sticky top-4 h-[calc(100vh-2rem)] rounded-2xl p-5">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Agent OS</p>
        <h1 className="mt-2 text-xl font-semibold">Command Center</h1>
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              className={`block rounded-xl px-3 py-2 text-sm transition ${
                active ? "bg-[#005f73] text-white" : "text-slate-700 hover:bg-white"
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 rounded-xl border border-dashed border-[#005f73]/25 p-3 text-xs text-slate-600">
        Policy-gated autonomy is enabled. Tier-3 actions are held for approval.
      </div>
    </aside>
  );
}

