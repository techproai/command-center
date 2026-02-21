from fastapi import FastAPI, HTTPException

from app.executor import execute_task
from app.models import (
    CancelJobResponse,
    EvaluateRequest,
    EvaluateResponse,
    ExecuteTaskRequest,
    ExecuteTaskResponse,
    JobStatusResponse,
    OrchestrateRunRequest,
    OrchestrateRunResponse,
)
from app.orchestrator import cancel_job, enqueue_run, get_job
from app.policy import evaluate_policy

app = FastAPI(title="Command Center Runtime", version="0.2.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(request: EvaluateRequest) -> EvaluateResponse:
    return evaluate_policy(request)


@app.post("/execute_task", response_model=ExecuteTaskResponse)
def execute(request: ExecuteTaskRequest) -> ExecuteTaskResponse:
    return execute_task(request)


@app.post("/orchestrate", response_model=OrchestrateRunResponse)
def orchestrate_run(request: OrchestrateRunRequest) -> OrchestrateRunResponse:
    task = enqueue_run(request.model_dump(mode="json"))
    return OrchestrateRunResponse(job_id=task.id, state=task.state)


@app.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str) -> JobStatusResponse:
    job = get_job(job_id)

    result_payload = job.result if isinstance(job.result, dict) else None
    error_message = None

    if job.failed() and job.result is not None:
        error_message = str(job.result)

    return JobStatusResponse(
        job_id=job.id,
        state=job.state,
        ready=job.ready(),
        successful=job.successful(),
        failed=job.failed(),
        result=result_payload,
        error=error_message,
    )


@app.post("/jobs/{job_id}/cancel", response_model=CancelJobResponse)
def cancel_job_route(job_id: str) -> CancelJobResponse:
    job = get_job(job_id)
    if job.id is None:
        raise HTTPException(status_code=404, detail="Job not found")

    cancel_job(job_id)
    return CancelJobResponse(job_id=job_id, revoked=True)
