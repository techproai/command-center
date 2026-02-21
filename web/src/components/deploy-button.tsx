"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeployButton(props: { agentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onClick() {
    setLoading(true);
    await fetch(`/api/agents/${props.agentId}/deploy`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-60"
      onClick={onClick}
      disabled={loading}
      type="button"
    >
      {loading ? "Deploying..." : "Deploy"}
    </button>
  );
}

