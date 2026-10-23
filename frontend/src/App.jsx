import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowRight, BookOpen, CalendarDays, Check, CheckCheck,
  CircleHelp, Clock3, Command, GraduationCap, ListTodo, Plus, Send,
  Sparkles, Trash2, WandSparkles, X
} from "lucide-react";

const API = "http://127.0.0.1:8000";

const starterMessages = [
  { role: "assistant", text: "Hi! I'm StudyFlow, your study-planning assistant. Tell me what you need to study, or ask me to organize your tasks." },
];

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${response.status})`);
  }
  return response.json();
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState(starterMessages);
  const [message, setMessage] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newDue, setNewDue] = useState("Today");
  const [newMinutes, setNewMinutes] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [apiOk, setApiOk] = useState(false);
  const [filter, setFilter] = useState("All");

  async function refreshTasks() {
    try {
      const data = await request("/tasks");
      setTasks(data.tasks);
      setApiOk(true);
      setError("");
    } catch {
      setApiOk(false);
      setError("Can't reach the backend. Start FastAPI in the other terminal (port 8000).");
    }
  }

  useEffect(() => { refreshTasks(); }, []);

  const pending = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);
  const minutes = pending.reduce((sum, task) => sum + task.minutes, 0);
  const visibleTasks = useMemo(() => {
    if (filter === "Pending") return tasks.filter(t => !t.done);
    if (filter === "Completed") return tasks.filter(t => t.done);
    return tasks;
  }, [tasks, filter]);

  async function sendMessage(textOverride) {
    const text = (textOverride ?? message).trim();
    if (!text || busy) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setMessage("");
    setBusy(true);
    setError("");
    try {
      const result = await request("/chat-mcp", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessages(prev => [...prev, { role: "assistant", text: result.reply, plan: result.plan || [] }]);
      await refreshTasks();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function addTask(e) {
    e.preventDefault();
    if (newTask.trim().length < 2) return;
    try {
      await request("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: newTask.trim(),
          subject: "General",
          due: newDue,
          minutes: Number(newMinutes),
          priority: "Medium",
        }),
      });
      setNewTask("");
      await refreshTasks();
    } catch (e) { setError(e.message); }
  }

  async function toggleTask(id) {
    try {
      await request(`/tasks/${id}/complete`, { method: "PATCH" });
      await refreshTasks();
    } catch (e) { setError(e.message); }
  }

  async function reschedule(task) {
    const due = window.prompt("Reschedule to (e.g. Tomorrow, Friday, Next week):", task.due);
    if (!due || !due.trim()) return;
    try {
      await request(`/tasks/${task.id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({ due: due.trim() }),
      });
      await refreshTasks();
    } catch (e) { setError(e.message); }
  }

  async function deleteTask(id) {
    try {
      await request(`/tasks/${id}`, { method: "DELETE" });
      await refreshTasks();
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={21} /></div>
          <div><strong>StudyFlow<span> AI</span></strong><small>PERSONAL ASSISTANT</small></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <button className="nav-item active"><Activity size={18} /> Overview</button>
        <button className="nav-item" onClick={() => document.getElementById("tasks")?.scrollIntoView({ behavior: "smooth" })}><ListTodo size={18} /> My tasks <span className="nav-count">{pending.length}</span></button>
        <button className="nav-item" onClick={() => sendMessage("plan my study for tomorrow and revise calculus")}><CalendarDays size={18} /> Study planner</button>
        <div className="sidebar-bottom">
          <div className="tip-card">
            <div className="tip-icon"><WandSparkles size={18} /></div>
            <strong>Small steps, big progress.</strong>
            <p>Turn a busy day into a plan you can actually follow.</p>
            <button onClick={() => sendMessage("help")}>Explore commands <ArrowRight size={14} /></button>
          </div>
          <div className="profile">
            <div className="avatar">SF</div>
            <div><strong>Student workspace</strong><small>Local demo account</small></div>
            <CircleHelp size={17} className="profile-help" />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="breadcrumb">Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div>
          <div className="topbar-right">
            <span className={`status ${apiOk ? "online" : "offline"}`}><span />{apiOk ? "Assistant online" : "Backend offline"}</span>
            <div className="date-chip"><CalendarDays size={15} /> Student dashboard</div>
          </div>
        </header>

        <section className="welcome">
          <div>
            <div className="eyebrow"><Sparkles size={14} /> YOUR STUDY COMPANION</div>
            <h1>Make room for <span>what matters.</span></h1>
            <p>Plan your next study session, organize tasks, and keep moving forward.</p>
          </div>
          <div className="welcome-art"><div className="orb orb-one"></div><div className="orb orb-two"></div><BookOpen size={44} strokeWidth={1.3} /></div>
        </section>

        {error && <div className="error-banner"><CircleHelp size={17} />{error}<button onClick={() => setError("")}><X size={16} /></button></div>}

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Pending tasks</span><div className="stat-icon blue"><ListTodo size={18} /></div></div><div className="stat-number">{pending.length}<small> tasks</small></div><div className="stat-foot">Ready for your attention</div></div>
          <div className="stat-card"><div className="stat-top"><span>Planned focus time</span><div className="stat-icon purple"><Clock3 size={18} /></div></div><div className="stat-number">{Math.floor(minutes / 60)}<small>h</small> {minutes % 60}<small>m</small></div><div className="stat-foot">Based on pending tasks</div></div>
          <div className="stat-card"><div className="stat-top"><span>Completed</span><div className="stat-icon green"><CheckCheck size={18} /></div></div><div className="stat-number">{completed.length}<small> tasks</small></div><div className="stat-foot">Progress you have made</div></div>
        </section>

        <div className="content-grid">
          <section className="panel assistant-panel">
            <div className="panel-heading">
              <div className="heading-icon assistant-icon"><Sparkles size={19} /></div>
              <div><h2>Talk to StudyFlow</h2><p>Your planning assistant</p></div>
              <span className="demo-pill">RULE-BASED DEMO</span>
            </div>
            <div className="chat-window">
              {messages.map((item, i) => (
                <div className={`message-row ${item.role}`} key={i}>
                  {item.role === "assistant" && <div className="chat-avatar"><Sparkles size={15} /></div>}
                  <div className="bubble">
                    <p>{item.text}</p>
                    {item.plan?.length > 0 && <div className="plan-list">
                      <strong className="plan-title">Your suggested plan</strong>
                      {item.plan.map((step, idx) => <div className="plan-step" key={idx}><span>{idx + 1}</span><div><strong>{step.title}</strong><small>{step.time}</small></div></div>)}
                    </div>}
                  </div>
                </div>
              ))}
              {busy && <div className="message-row assistant"><div className="chat-avatar"><Sparkles size={15} /></div><div className="bubble typing">Thinking through your plan<span>...</span></div></div>}
            </div>
            <div className="suggestions">
              <button onClick={() => sendMessage("plan my study for tomorrow and revise calculus")}>Plan my study <ArrowRight size={13} /></button>
              <button onClick={() => sendMessage("show my tasks")}>Show my tasks <ArrowRight size={13} /></button>
            </div>
            <form className="chat-input" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
              <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask me to plan, add, or organize..." aria-label="Message StudyFlow" />
              <button disabled={!message.trim() || busy} aria-label="Send message"><Send size={17} /></button>
            </form>
            <div className="privacy-note"><Command size={13} /> Local rule-based assistant · No external AI API required</div>
          </section>

          <section className="panel tasks-panel" id="tasks">
            <div className="panel-heading task-heading">
              <div className="heading-icon task-icon"><GraduationCap size={19} /></div>
              <div><h2>My tasks</h2><p>Your next steps, in one place</p></div>
              <span className="task-total">{tasks.length}</span>
            </div>
            <form className="add-task-form" onSubmit={addTask}>
              <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a task..." aria-label="New task title" />
              <select value={newDue} onChange={e => setNewDue(e.target.value)} aria-label="Task due">
                <option>Today</option><option>Tomorrow</option><option>This week</option>
              </select>
              <select value={newMinutes} onChange={e => setNewMinutes(e.target.value)} aria-label="Estimated minutes">
                <option value="15">15 min</option><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option>
              </select>
              <button disabled={newTask.trim().length < 2} aria-label="Add task"><Plus size={17} /></button>
            </form>
            <div className="task-filters">
              {["All", "Pending", "Completed"].map(option => <button key={option} className={filter === option ? "selected" : ""} onClick={() => setFilter(option)}>{option}</button>)}
            </div>
            <div className="task-list">
              {visibleTasks.map(task => (
                <div className={`task-item ${task.done ? "is-done" : ""}`} key={task.id}>
                  <button className={`task-check ${task.done ? "checked" : ""}`} onClick={() => toggleTask(task.id)} aria-label={task.done ? "Mark incomplete" : "Mark complete"}>{task.done && <Check size={14} />}</button>
                  <div className="task-info">
                    <strong>{task.title}</strong>
                    <div className="task-meta"><span>{task.subject || "General"}</span><i /> <span><Clock3 size={12} /> {task.minutes} min</span></div>
                    <div className="task-tags"><span className={task.due === "Today" ? "due-today" : "due-later"}>{task.due}</span><span className={`priority ${String(task.priority || "Medium").toLowerCase()}`}>{task.priority || "Medium"} priority</span></div>
                  </div>
                  <div className="task-actions">
                    <button title="Reschedule" onClick={() => reschedule(task)}><CalendarDays size={15} /></button>
                    <button title="Delete task" onClick={() => deleteTask(task.id)}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
              {visibleTasks.length === 0 && <div className="empty-state"><BookOpen size={25} /><strong>Nothing here yet</strong><span>Add a task or try the study planner.</span></div>}
            </div>
            <div className="task-footer"><span><span className="live-dot" /> Synced with local demo backend</span><button onClick={refreshTasks}>Refresh</button></div>
          </section>
        </div>
        <footer className="footer"><span>StudyFlow AI · Hackathon prototype</span><span>Built for a simulated Alexa+ experience</span></footer>
      </main>
    </div>
  );
}

export default App;
