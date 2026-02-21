from datetime import UTC, datetime

from app.models import ExecuteTaskRequest, ExecuteTaskResponse


def execute_task(request: ExecuteTaskRequest) -> ExecuteTaskResponse:
    objective = request.context.get("objective", "No objective provided")
    tool_names = list(request.tool_bindings.keys())

    output = {
        "timestamp": datetime.now(tz=UTC).isoformat(),
        "objective": objective,
        "tools_used": tool_names,
        "result": "Task executed in simulation mode",
    }

    return ExecuteTaskResponse(
        run_id=request.run_id,
        task_id=request.task_id,
        status="succeeded",
        output=output,
    )

