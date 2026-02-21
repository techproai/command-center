from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_execute_task() -> None:
    response = client.post(
        "/execute_task",
        json={
            "run_id": "run_1",
            "task_id": "task_1",
            "context": {"objective": "Test objective"},
            "tool_bindings": {"browser": {"headless": True}},
            "policy_context": {},
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["status"] == "succeeded"
    assert payload["output"]["objective"] == "Test objective"


def test_orchestrate_run_and_fetch_job_status() -> None:
    response = client.post(
        "/orchestrate",
        json={
            "run_id": "run_1",
            "agent_kind": "browser",
            "objective": "Collect public lead data",
            "tools": ["browser", "webhook"],
            "input": {"source": "test"},
            "max_retries": 2,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["job_id"]

    status_response = client.get(f"/jobs/{payload['job_id']}")
    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert status_payload["ready"] is True
    assert status_payload["successful"] is True
    assert status_payload["result"]["run_id"] == "run_1"


def test_cancel_job_endpoint() -> None:
    response = client.post(
        "/orchestrate",
        json={
            "run_id": "run_cancel",
            "agent_kind": "webhook",
            "objective": "Route inbound payload",
            "tools": ["webhook"],
            "input": {"type": "demo"},
        },
    )
    job_id = response.json()["job_id"]

    cancel_response = client.post(f"/jobs/{job_id}/cancel")
    assert cancel_response.status_code == 200
    assert cancel_response.json()["revoked"] is True

