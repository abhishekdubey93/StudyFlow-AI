# StudyFlow AI — Alexa+ Hackathon Prototype

A rule-based student productivity assistant with a simulated voice-assistant-style web experience. It works without an AI API key.

## Features
- Chat-style input for creating tasks and generating a study plan
- Add, complete, and delete tasks
- Rule-based study-plan generation
- Simple rescheduling workflow
- Local in-memory backend storage (resets when backend restarts)
- React + Vite frontend and FastAPI backend

> This is a simulated experience, not a real Alexa+ integration. Describe it honestly in your hackathon submission. Do not claim to use Alexa+ APIs or AWS services unless you actually integrate them.

## Prerequisites (Windows 11)
Install:
- Python 3.11 or newer
- Node.js LTS (includes npm)
- VS Code

Check installations in a new VS Code terminal:
```powershell
python --version
node --version
npm --version
```

## 1. Start the backend
Open a terminal in the project folder:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If PowerShell blocks activation, run this once in that terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Backend health check: http://127.0.0.1:8000/health  
Interactive API docs: http://127.0.0.1:8000/docs

## 2. Start the frontend
Open a SECOND terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite, usually http://localhost:5173.

Keep both terminals running.

## 3. Demo script (about 90 seconds)
1. Say/type: `I have a math exam tomorrow and need to revise calculus`
2. Show the generated plan and the created tasks.
3. Type: `Add a task to finish DBMS assignment`
4. Click a task checkbox to mark it complete.
5. Use the reschedule button to move a task to another day.
6. Explain: “StudyFlow demonstrates an assistant workflow with explicit task actions. This prototype uses transparent local rules and does not call an external AI API.”

## Supported chat commands
- `I have an exam tomorrow and need to revise calculus`
- `plan my study for tomorrow`
- `add a task to finish DBMS assignment`
- `show my tasks`
- `help`

Anything else receives a helpful rule-based response. Use the form to add a task if the chat parser does not infer it correctly.

## Project structure
```text
studyflow-ai/
  backend/
    main.py
    requirements.txt
  frontend/
    index.html
    package.json
    vite.config.js
    src/
      main.jsx
      App.jsx
      styles.css
  .gitignore
  README.md
```

## Before submitting
- Test the project from a fresh start.
- Replace the demo tasks with your own scenario if needed.
- Add your actual team names and project details to Devpost.
- Push the source to a **public GitHub repository** and include an open-source license if the rules require it.
- Record a **public English demo video under 3 minutes**.
- Complete any required feedback forms.
- Check the Devpost submission page and confirm the final submission is actually submitted before the deadline.

## Important limitations
- No persistent database: tasks are stored in memory and disappear when the backend restarts.
- No real speech recognition, calendar sync, account system, or Alexa+ device connection.
- No LLM is used; planning is rule-based so it works without an API key.
