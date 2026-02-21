# Command Center Monorepo

GUI-first command center to create, deploy, and manage autonomous operational agents (browser automation, LinkedIn lead-gen, webhook agents).

## Workspace Layout

- `web/` Next.js control plane and GUI.
- `runtime/` Python execution plane and policy-aware task runtime.
- `packages/contracts/` Shared schemas and TypeScript contracts.
- `docs/` Architecture and operational notes.

## Quick Start

### 1. Install web dependencies

```powershell
npm install --prefix web
```

### 2. Configure environment

```powershell
Copy-Item web/.env.example web/.env.local
```

Set `PRISMA_LOG_QUERIES="true"` only when you need verbose SQL logs.

### 3. Prepare database

```powershell
npm run db:generate --prefix web
npm run db:push --prefix web
```

### 4. Run web app

```powershell
npm run dev --prefix web
```

### 5. Start Redis (required for async runtime orchestration)

```powershell
docker compose up redis -d
```

### 6. Run runtime services (optional but recommended)

```powershell
python -m venv runtime/.venv
runtime/.venv/Scripts/Activate.ps1
pip install -r runtime/requirements.txt
npm run dev:runtime
npm run dev:worker
```

Runtime orchestration uses Redis + Celery. Keep `docker compose up redis` running for queue/worker execution.

## Design Principles

- Policy-gated autonomy with auditable decisions.
- Schema-driven configurability (no per-customer hardcoding).
- Deployment versioning and safe rollback semantics.
- Compliance-first LinkedIn automation controls.
