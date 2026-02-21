import json
import os
import time
from datetime import UTC, datetime
from typing import Any

from celery import Task
from celery.signals import task_failure
from redis import Redis

from app.celery_app import BROKER_URL, celery_app

DEAD_LETTER_KEY = os.getenv("RUNTIME_DEAD_LETTER_KEY", "command_center:dead_letter")


def _get_dead_letter_client() -> Redis | None:
    if not BROKER_URL.startswith("redis://"):
        return None

    try:
        return Redis.from_url(BROKER_URL, decode_responses=True)
    except Exception:
        return None


def _to_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _simulate_run(payload: dict[str, Any], task: Task) -> dict[str, Any]:
    simulate_seconds = max(0.0, min(float(payload.get("simulate_seconds", 0.8)), 3.0))
    if simulate_seconds > 0:
        time.sleep(simulate_seconds)

    if payload.get("force_retry"):
        raise TimeoutError("Transient provider timeout")

    if payload.get("force_fail"):
        raise RuntimeError("Forced failure for resilience validation")

    tools = payload.get("tools", [])
    records_processed = max(1, len(tools) * 4)

    return {
        "run_id": payload.get("run_id"),
        "agent_kind": payload.get("agent_kind"),
        "objective": payload.get("objective"),
        "records_processed": records_processed,
        "tools_used": tools,
        "summary": "Runtime worker executed run successfully",
        "worker_task_id": task.request.id,
        "finished_at": datetime.now(tz=UTC).isoformat(),
    }


@celery_app.task(
    bind=True,
    name="runtime.execute_run",
    autoretry_for=(TimeoutError,),
    retry_backoff=True,
    retry_jitter=True,
)
def execute_run_task(self: Task, payload: dict[str, Any]) -> dict[str, Any]:
    max_retries = _to_int(payload.get("max_retries"), 3)

    try:
        return _simulate_run(payload, self)
    except TimeoutError as exc:
        if self.request.retries >= max_retries:
            raise RuntimeError("Retries exhausted while executing run") from exc

        raise self.retry(exc=exc, countdown=min(30, 2 ** self.request.retries))


@task_failure.connect
def handle_task_failure(
    sender: Task | None = None,
    task_id: str | None = None,
    exception: BaseException | None = None,
    args: tuple[Any, ...] | None = None,
    kwargs: dict[str, Any] | None = None,
    **_: Any,
) -> None:
    if sender is None or sender.name != "runtime.execute_run":
        return

    client = _get_dead_letter_client()
    if client is None:
        return

    payload = {
        "task_id": task_id,
        "error": str(exception),
        "payload": kwargs.get("payload") if kwargs else None,
        "failed_at": datetime.now(tz=UTC).isoformat(),
    }

    client.lpush(DEAD_LETTER_KEY, json.dumps(payload))


def enqueue_run(payload: dict[str, Any]):
    return execute_run_task.apply_async(kwargs={"payload": payload})


def get_job(job_id: str):
    return celery_app.AsyncResult(job_id)


def cancel_job(job_id: str) -> None:
    celery_app.control.revoke(job_id, terminate=False)
