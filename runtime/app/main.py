from fastapi import FastAPI

from app.executor import execute_task
from app.models import EvaluateRequest, EvaluateResponse, ExecuteTaskRequest, ExecuteTaskResponse
from app.policy import evaluate_policy

app = FastAPI(title="Command Center Runtime", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(request: EvaluateRequest) -> EvaluateResponse:
    return evaluate_policy(request)


@app.post("/execute_task", response_model=ExecuteTaskResponse)
def execute(request: ExecuteTaskRequest) -> ExecuteTaskResponse:
    return execute_task(request)

