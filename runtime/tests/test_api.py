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

