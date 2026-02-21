import os

from celery import Celery


def _env_flag(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


BROKER_URL = os.getenv("RUNTIME_BROKER_URL", "redis://127.0.0.1:6379/0")
RESULT_BACKEND = os.getenv("RUNTIME_RESULT_BACKEND", "redis://127.0.0.1:6379/1")

celery_app = Celery("command_center_runtime", broker=BROKER_URL, backend=RESULT_BACKEND)

celery_app.conf.update(
    task_track_started=True,
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=5,
    task_time_limit=int(os.getenv("RUNTIME_TASK_TIME_LIMIT", "300")),
)

if _env_flag("CELERY_TASK_ALWAYS_EAGER", default=False):
    celery_app.conf.update(task_always_eager=True, task_store_eager_result=True)
