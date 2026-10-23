
import json
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4
import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="StudyFlow AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.218.249.96:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

tasks = [
    {
        "id": "demo-1",
        "title": "Revise calculus basics",
        "subject": "Mathematics",
        "due": "Today",
        "minutes": 40,
        "done": False,
        "priority": "High",
    },
    {
        "id": "demo-2",
        "title": "Review DBMS normalization",
        "subject": "DBMS",
        "due": "Today",
        "minutes": 30,
        "done": False,
        "priority": "Medium",
    },
    {
        "id": "demo-3",
        "title": "Complete DSA practice questions",
        "subject": "DSA",
        "due": "Tomorrow",
        "minutes": 45,
        "done": True,
        "priority": "Medium",
    },
]


class TaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    subject: str = Field(default="General", max_length=60)
    due: str = Field(default="Today", max_length=40)
    minutes: int = Field(default=30, ge=5, le=240)
    priority: str = Field(default="Medium", pattern="^(Low|Medium|High)$")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)


class RescheduleRequest(BaseModel):
    due: str = Field(min_length=1, max_length=40)


def task_summary():
    pending = [t for t in tasks if not t["done"]]
    if not pending:
        return "You're all caught up. Add a task whenever you are ready."
    return "You have " + str(len(pending)) + " pending task(s): " + "; ".join(
        f'{t["title"]} ({t["due"]}, {t["minutes"]} min)' for t in pending
    ) + "."


def generate_plan(message: str):
    # Transparent deterministic demo logic; no external AI/API call.
    lower = message.lower()
    topic_match = re.search(r"(?:revise|study|prepare for|practice)\s+(.+)", lower)
    topic = topic_match.group(1).strip(" .!?") if topic_match else "your priority subject"
    topic = topic[:70]
    tomorrow = "Tomorrow" if any(x in lower for x in ["tomorrow", "exam tomorrow", "next day"]) else "Today"

    plan = [
        {"time": "Session 1 · 25 min", "title": f"Review the key concepts in {topic}", "minutes": 25},
        {"time": "Break · 5 min", "title": "Take a short break and reset", "minutes": 5},
        {"time": "Session 2 · 30 min", "title": f"Solve practice questions for {topic}", "minutes": 30},
        {"time": "Wrap-up · 10 min", "title": "Recall key points and note weak areas", "minutes": 10},
    ]
    for index, item in enumerate(plan):
        if item["title"].startswith("Take a short break"):
            continue
        tasks.append({
            "id": str(uuid4()),
            "title": item["title"],
            "subject": topic.title()[:60],
            "due": tomorrow,
            "minutes": item["minutes"],
            "done": False,
            "priority": "High" if index == 0 else "Medium",
        })
    return {
        "reply": f"I created a focused study plan for {topic}. It includes two work sessions, a short break, and a quick review. You can edit or complete each task below.",
        "plan": plan,
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "StudyFlow AI API"}


@app.get("/tasks")
def get_tasks():
    return {"tasks": tasks}


@app.post("/tasks")
def create_task(payload: TaskCreate):
    task = {
        "id": str(uuid4()),
        **payload.model_dump(),
        "done": False,
    }
    tasks.insert(0, task)
    return {"task": task}


@app.patch("/tasks/{task_id}/complete")
def complete_task(task_id: str):
    for task in tasks:
        if task["id"] == task_id:
            task["done"] = not task["done"]
            return {"task": task}
    raise HTTPException(status_code=404, detail="Task not found")


@app.patch("/tasks/{task_id}/reschedule")
def reschedule_task(task_id: str, payload: RescheduleRequest):
    for task in tasks:
        if task["id"] == task_id:
            task["due"] = payload.due
            return {"task": task}
    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/tasks/{task_id}")
def delete_task(task_id: str):
    global tasks
    before = len(tasks)
    tasks = [t for t in tasks if t["id"] != task_id]
    if len(tasks) == before:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


@app.post("/chat")
def chat(payload: ChatRequest):
    message = payload.message.strip()
    lower = message.lower()

    if any(phrase in lower for phrase in ["show my tasks", "list tasks", "what are my tasks", "pending tasks"]):
        return {"reply": task_summary(), "plan": []}

    if lower in {"help", "what can you do", "commands"}:
        return {
            "reply": "I can create a study plan, add a task, list your tasks, or help you organize a study session. Try: “Plan my study for tomorrow and revise calculus.”",
            "plan": [],
        }

    if any(phrase in lower for phrase in ["plan my study", "study plan", "exam tomorrow", "prepare for my exam", "revise ", "study for "]):
        return generate_plan(message)

    add_match = re.match(r"(?:please\s+)?(?:add|create|make)\s+(?:a\s+)?task\s+(?:to\s+)?(.+)", message, flags=re.I)
    if add_match:
        title = add_match.group(1).strip(" .!?")
        if len(title) < 2:
            return {"reply": "Please tell me what the task is, or use the Add task form.", "plan": []}
        task = {
            "id": str(uuid4()),
            "title": title[:120],
            "subject": "General",
            "due": "Today",
            "minutes": 30,
            "done": False,
            "priority": "Medium",
        }
        tasks.insert(0, task)
        return {"reply": f'Added “{task["title"]}” to your tasks for today.', "plan": []}

    if any(word in lower for word in ["hello", "hi", "hey"]):
        return {"reply": "Hi! I'm StudyFlow. I can build a study plan, add a task, or list your pending tasks. What would you like to do?", "plan": []}

    return {
        "reply": "I can help with study planning and task management. Try “plan my study for tomorrow and revise calculus”, “add a task to finish DBMS assignment”, or “show my tasks”.",
        "plan": [],
    }
    
async def call_mcp_tool(tool_name: str, arguments: dict | None = None):
    """Execute a tool through the local MCP server."""
    async with streamablehttp_client(
        "http://127.0.0.1:8001/mcp"
    ) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool(
                tool_name, arguments or {}
            )

            if result.isError:
                raise HTTPException(
                    status_code=502,
                    detail=f"MCP tool failed: {tool_name}",
                )

            output = []
            for item in result.content:
                if hasattr(item, "text"):
                    try:
                        output.append(json.loads(item.text))
                    except (json.JSONDecodeError, TypeError):
                        output.append(item.text)

            return output


@app.post("/chat-mcp")
async def chat_mcp(payload: ChatRequest):
    """Route supported chat requests to real MCP tools."""
    message = payload.message.strip()
    lower = message.lower()

    if any(phrase in lower for phrase in [
        "show my tasks",
        "list tasks",
        "what are my tasks",
        "pending tasks",
    ]):
        result = await call_mcp_tool("list_tasks")
        return {
            "reply": "Retrieved your tasks through MCP.",
            "plan": [],
            "mcp_result": result,
        }

    add_match = re.match(
        r"(?:please\s+)?(?:add|create|make)\s+"
        r"(?:a\s+)?task\s+(?:to\s+)?(.+)",
        message,
        flags=re.I,
    )

    if add_match:
        title = add_match.group(1).strip(" .!?")
        if len(title) < 2:
            return {"reply": "Please provide a task title.", "plan": []}

        result = await call_mcp_tool(
            "add_task",
            {
                "title": title[:120],
                "subject": "General",
                "due": "Tomorrow" if "tomorrow" in lower else "Today",
                "minutes": 30,
                "priority": "Medium",
            },
        )
        return {
            "reply": f"Created '{title}' through MCP.",
            "plan": [],
            "mcp_result": result,
        }

    return {
        "reply": (
            "I can currently list tasks or create a task through MCP. "
            "Try 'show my tasks' or "
            "'add a task to finish DBMS assignment'."
        ),
        "plan": [],
    }

