
import os
import httpx
from mcp.server.fastmcp import FastMCP

API_BASE = os.getenv("STUDYFLOW_API_URL", "http://127.0.0.1:8000")

mcp = FastMCP(
    "StudyFlow AI",
    instructions=(
        "StudyFlow is a student study-planning assistant. "
        "Use its tools to list, add, complete, and reschedule tasks "
        "or generate a study plan. Report tool results accurately."
    ),
    host="0.0.0.0",
    port=8001,
    stateless_http=True,
    json_response=True,
)


async def api_request(method: str, path: str, **kwargs):
    """Call the existing StudyFlow FastAPI backend."""
    async with httpx.AsyncClient(
        base_url=API_BASE, timeout=15.0
    ) as client:
        response = await client.request(method, path, **kwargs)
        response.raise_for_status()
        return response.json()


@mcp.tool()
async def list_tasks() -> dict:
    """List all StudyFlow tasks and their completion status."""
    return await api_request("GET", "/tasks")


@mcp.tool()
async def add_task(
    title: str,
    subject: str = "General",
    due: str = "Today",
    minutes: int = 30,
    priority: str = "Medium",
) -> dict:
    """Create a study task. Minutes must be between 5 and 240."""
    if not 5 <= minutes <= 240:
        raise ValueError("Minutes must be between 5 and 240.")

    if priority not in {"Low", "Medium", "High"}:
        raise ValueError("Priority must be Low, Medium, or High.")

    return await api_request(
        "POST",
        "/tasks",
        json={
            "title": title,
            "subject": subject,
            "due": due,
            "minutes": minutes,
            "priority": priority,
        },
    )


@mcp.tool()
async def toggle_task_completion(task_id: str) -> dict:
    """Toggle a task between completed and pending."""
    return await api_request(
        "PATCH", f"/tasks/{task_id}/complete"
    )


@mcp.tool()
async def reschedule_task(task_id: str, due: str) -> dict:
    """Change a task's due date, for example to Tomorrow."""
    return await api_request(
        "PATCH",
        f"/tasks/{task_id}/reschedule",
        json={"due": due},
    )


@mcp.tool()
async def delete_task(task_id: str) -> dict:
    """Delete a task by its exact ID."""
    return await api_request("DELETE", f"/tasks/{task_id}")


@mcp.tool()
async def create_study_plan(request: str) -> dict:
    """Ask StudyFlow to generate a study plan and create its tasks."""
    return await api_request(
        "POST",
        "/chat",
        json={"message": f"plan my study: {request}"},
    )


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
