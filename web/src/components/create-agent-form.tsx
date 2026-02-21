"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  name: string;
  kind?: string;
  defaults?: unknown;
};

export function CreateAgentForm(props: {
  policies: Option[];
  templates: Option[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [policyId, setPolicyId] = useState(props.policies[0]?.id ?? "");
  const [templateId, setTemplateId] = useState(props.templates[0]?.id ?? "");
  const [objective, setObjective] = useState("Automate lead discovery and outreach under policy controls.");
  const [maxActionsPerHour, setMaxActionsPerHour] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const selectedTemplate = props.templates.find((template) => template.id === templateId);
    const kind = (selectedTemplate?.kind ?? "browser") as "browser" | "linkedin" | "webhook";

    const response = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        policyId,
        templateId,
        kind,
        config: {
          objective,
          tools: kind === "linkedin" ? ["linkedin", "webhook"] : [kind, "webhook"],
          maxRetries: 3,
          maxActionsPerHour,
          linkedInGuardedMode: true,
        },
      }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to create agent");
      setLoading(false);
      return;
    }

    setName("");
    setObjective("Automate lead discovery and outreach under policy controls.");
    setMaxActionsPerHour(15);
    router.refresh();
    setLoading(false);
  }

  return (
    <form className="surface rounded-2xl p-4" onSubmit={onSubmit}>
      <h3 className="text-lg font-semibold">Create Agent</h3>
      <p className="text-sm text-slate-600">Build a policy-aware agent from a template.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm text-slate-700">
          Name
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Q2 LinkedIn Pipeline"
            required
            minLength={3}
          />
        </label>

        <label className="text-sm text-slate-700">
          Template
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            required
          >
            {props.templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Policy
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2"
            value={policyId}
            onChange={(event) => setPolicyId(event.target.value)}
            required
          >
            {props.policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Max Actions / Hour
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2"
            type="number"
            value={maxActionsPerHour}
            min={1}
            max={100}
            onChange={(event) => setMaxActionsPerHour(Number(event.target.value))}
          />
        </label>
      </div>

      <label className="mt-3 block text-sm text-slate-700">
        Objective
        <textarea
          className="mt-1 min-h-20 w-full rounded-lg border border-slate-200 bg-white p-2"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          minLength={10}
          required
        />
      </label>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <button
        className="mt-4 rounded-lg bg-[#005f73] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Agent"}
      </button>
    </form>
  );
}

