const RUNTIME_API_URL = process.env.RUNTIME_API_URL ?? "http://127.0.0.1:8010";
const RUNTIME_API_TIMEOUT_MS = Number(process.env.RUNTIME_API_TIMEOUT_MS ?? 2000);

function runtimeUrl(path: string) {
  return `${RUNTIME_API_URL.replace(/\/$/, "")}${path}`;
}

async function requestRuntime<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUNTIME_API_TIMEOUT_MS);

  try {
    const response = await fetch(runtimeUrl(path), {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Runtime request failed (${response.status})`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export type RuntimeJobStatus = {
  job_id: string;
  state: string;
  ready: boolean;
  successful: boolean;
  failed: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
};

export async function enqueueRuntimeRun(payload: {
  run_id: string;
  agent_kind: string;
  objective: string;
  tools: string[];
  input: Record<string, unknown>;
  max_retries: number;
  simulate_seconds?: number;
}) {
  return requestRuntime<{ job_id: string; state: string }>("/orchestrate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRuntimeJobStatus(jobId: string) {
  return requestRuntime<RuntimeJobStatus>(`/jobs/${jobId}`);
}

export async function cancelRuntimeJob(jobId: string) {
  return requestRuntime<{ job_id: string; revoked: boolean }>(`/jobs/${jobId}/cancel`, {
    method: "POST",
  });
}
