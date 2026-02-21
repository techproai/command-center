# Architecture Notes

## Planes

- Control plane (`web`): GUI, API, auth, persistence, policy and approval coordination.
- Runtime plane (`runtime`): FastAPI orchestration endpoints plus Celery workers for async execution, retries, and dead-letter handling.

## Data

- Prisma models capture workspace, agents, deployments, runs, tasks, approvals, policy, and audit events.
- SQLite is default for local dev; switch `DATABASE_URL` to PostgreSQL for production.

## Runtime Contract

- `execute_task(run_id, task_id, context, tool_bindings, policy_context)`
- `evaluate(action, context) -> allow | require_approval | deny`
- `orchestrate(run_id, objective, tools, input) -> job_id`
- `jobs/{job_id} -> state/result`

