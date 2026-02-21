"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunAgentButton(props: { agentId: string; deploymentId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!props.deploymentId) return;
    setLoading(true);

    await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: props.agentId,
        deploymentId: props.deploymentId,
        input: { initiatedBy: "dashboard" },
      }),
    });

    router.refresh();
    setLoading(false);
  }

  return (
    <button
      className="rounded-lg bg-[#1f7a8c] px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
      onClick={onClick}
      disabled={loading || !props.deploymentId}
      type="button"
      title={!props.deploymentId ? "Deploy agent first" : undefined}
    >
      {loading ? "Running..." : "Run"}
    </button>
  );
}

