"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApprovalDecisionButtons(props: { approvalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);

  async function decide(decision: "approved" | "rejected") {
    setLoading(decision);
    await fetch(`/api/approvals/${props.approvalId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex gap-2">
      <button
        className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
        type="button"
        onClick={() => decide("approved")}
        disabled={loading !== null}
      >
        {loading === "approved" ? "Approving..." : "Approve"}
      </button>
      <button
        className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-60"
        type="button"
        onClick={() => decide("rejected")}
        disabled={loading !== null}
      >
        {loading === "rejected" ? "Rejecting..." : "Reject"}
      </button>
    </div>
  );
}

