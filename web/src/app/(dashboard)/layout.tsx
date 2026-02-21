import { NavShell } from "@/components/nav-shell";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 p-4 lg:grid-cols-[240px_1fr]">
      <NavShell />
      <main className="space-y-4">{children}</main>
    </div>
  );
}

