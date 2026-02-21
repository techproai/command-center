"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelRunButton(props: { runId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await fetch(`/api/runs/${props.runId}/cancel`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
      type="button"
      disabled={props.disabled || loading}
      onClick={onClick}
    >
      {loading ? "Cancelling..." : "Cancel"}
    </button>
  );
}

