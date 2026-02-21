# API Surface (v1)

## Agent Lifecycle

- `GET /api/agents`
- `POST /api/agents`
- `GET /api/agents/:id`
- `PUT /api/agents/:id`
- `POST /api/agents/:id/deploy`

## Run Lifecycle

- `GET /api/runs`
- `POST /api/runs`
- `GET /api/runs/:id`
- `POST /api/runs/:id/cancel`
- `GET /api/runs/:id/stream`

## Governance

- `POST /api/approvals/:id/decision`
- `GET /api/policies`

## Catalogs and Metrics

- `GET /api/templates`
- `GET /api/metrics/agents/:id`

## Webhooks

- `POST /api/webhooks/:triggerId`
