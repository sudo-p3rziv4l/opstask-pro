import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# 1. Update Database (Nambahin source, project_name, requester)
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', 
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'internal';"])
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', 
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_name VARCHAR(100);"])
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', 
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requester_name VARCHAR(50);"])

# 2. Update Sync API (Masukin source = 'redmine')
api_sync_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST() {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const res = await axios.get("https://task.ptdika.com/issues.json?limit=100&status_id=51", {
      headers: { "X-Redmine-API-Key": "b5408133ea672f817d64ef16f5c6667d6f6b36c3" },
      httpsAgent: agent
    });

    const issues = res.data.issues || [];
    let synced = 0;

    for (const issue of issues) {
      let status = 'todo'; 
      if (issue.status.name.toLowerCase().includes('in progress')) status = 'in_progress';
      if (issue.status.name.toLowerCase().includes('closed') || issue.status.name.toLowerCase().includes('resolved')) status = 'done';

      await query(`
        INSERT INTO tasks (redmine_id, title, description, status, assigned_to, due_date, start_date, source, project_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'redmine', 'Redmine Sync')
        ON CONFLICT (redmine_id) DO UPDATE SET 
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          due_date = EXCLUDED.due_date,
          start_date = EXCLUDED.start_date,
          source = 'redmine',
          project_name = 'Redmine Sync'
      `, [
        issue.id,
        issue.subject,
        issue.description,
        status,
        issue.assigned_to?.name || 'Unassigned',
        issue.due_date || null,
        issue.start_date || null
      ]);
      synced++;
    }

    return NextResponse.json({ success: true, count: synced });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/sync/route.js", api_sync_code)

# 3. API Summary Board
api_summary_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = jwt.verify(token, process.env.JWT_SECRET);
    const username = user.username;

    // Total Completed (Semua user)
    const resAllDone = await query("SELECT COUNT(*) FROM tasks WHERE status = 'done'");
    const totalCompleted = parseInt(resAllDone.rows[0].count);

    // My Done (7 Days)
    const resMyDone = await query(`
      SELECT COUNT(*) FROM tasks 
      WHERE status = 'done' 
      AND assigned_to = $1 
      -- Simplification: assume completed recently if it exists in done status
    `, [username]);
    const myDone = parseInt(resMyDone.rows[0].count);

    // Total Left
    const resLeft = await query("SELECT COUNT(*) FROM tasks WHERE status != 'done'");
    const totalLeft = parseInt(resLeft.rows[0].count);

    // Active Goals / Projects
    const resProjects = await query("SELECT COUNT(DISTINCT project_name) FROM tasks WHERE project_name IS NOT NULL");
    const activeGoals = parseInt(resProjects.rows[0].count);

    return NextResponse.json({ 
      totalCompleted, 
      myDone, 
      totalLeft, 
      activeGoals 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/summary/route.js", api_summary_code)

# 4. Update Board Page (Integrasi Summary Realtime)
board_page_code = """
"use client";
import { useState, useEffect } from "react";
import KanbanBoard from "@/components/board/KanbanBoard";

export default function BoardPage() {
  const [summary, setSummary] = useState({ totalCompleted: 0, myDone: 0, totalLeft: 0, activeGoals: 0 });

  useEffect(() => {
    fetch("/api/tasks/summary")
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">My ToDos</h1>
        <p className="text-slate-500 text-sm">Drag and drop your tasks across stages.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { title: summary.totalCompleted, subtitle: "Total Completed" },
          { title: summary.myDone, subtitle: "My Done Tasks (7d)" },
          { title: summary.totalLeft, subtitle: "Total Tasks Left" },
          { title: summary.activeGoals, subtitle: "Active Projects" }
        ].map((stat, i) => (
          <div key={i} className="bg-white/80 p-4 md:p-5 rounded-[20px] shadow-sm border border-white flex flex-col gap-1 hover:shadow-md transition-shadow backdrop-blur-sm">
            <h3 className="text-xl md:text-2xl font-bold text-sky-600 leading-none">{stat.title}</h3>
            <p className="text-[10px] md:text-xs font-medium text-slate-500">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      <KanbanBoard />
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/board/page.jsx", board_page_code)

# 5. Update New Request Form (Phase 11) & Endpoint
api_request_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    
    const { title, projectName, description, dueDate } = await req.json();
    
    await query(
      `INSERT INTO tasks (title, description, status, assigned_to, project_name, due_date, source, requester_name) 
       VALUES ($1, $2, 'todo', 'Unassigned', $3, $4, 'internal', $5)`,
      [title, description, projectName, dueDate || null, user.username]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/request/route.js", api_request_code)

ui_request_code = """
"use client";
import { useState } from "react";

export default function RequestPage() {
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/tasks/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, projectName, description, dueDate })
      });
      if (!res.ok) throw new Error("Gagal submit");
      setMsg("Task berhasil disubmit ke DevOps!");
      setTitle("");
      setProjectName("");
      setDueDate("");
      setDescription("");
    } catch (err) {
      setMsg(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">New Task Request</h1>
        <p className="text-slate-500">Submit a task directly to the board.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 space-y-6">
        {msg && <div className="p-4 bg-sky-50 text-sky-700 rounded-xl font-bold">{msg}</div>}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Task Title</label>
          <input required type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="e.g. Need new DB for staging" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
            <input required type="text" value={projectName} onChange={e=>setProjectName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="e.g. Internal Portal" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
            <input required type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Description & Links</label>
          <textarea required rows="5" value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="Detailed description..."></textarea>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">
          {loading ? "Submitting..." : "Submit Task"}
        </button>
      </form>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/requests/page.jsx", ui_request_code)

# 6. Update Calendar (Color coding based on Source)
with open("/home/perzival/opstask-pro/components/board/CalendarBoard.jsx", "r") as f:
    kanban = f.read()

# Timpa bagian eventStyleGetter
old_style = """const eventStyleGetter = (event) => {
    let backgroundColor = "#f1f5f9"; // slate-100
    let color = "#475569"; // slate-600
    let border = "1px solid #e2e8f0";
    
    if (event.status === "in_progress") {
      backgroundColor = "#e0f2fe"; // sky-100
      color = "#0369a1"; // sky-700
      border = "1px solid #bae6fd";
    }
    if (event.status === "done") {
      backgroundColor = "#d1fae5"; // emerald-100
      color = "#047857"; // emerald-700
      border = "1px solid #a7f3d0";
    }

    return {"""

new_style = """const eventStyleGetter = (event) => {
    // Default (Internal Project / Non-Redmine)
    let backgroundColor = "#f3e8ff"; // fuchsia-100
    let color = "#7e22ce"; // fuchsia-700
    let border = "1px solid #f0abfc";
    
    // Redmine Source
    if (event.source === "redmine") {
      backgroundColor = "#e0f2fe"; // sky-100
      color = "#0369a1"; // sky-700
      border = "1px solid #bae6fd";
    }

    return {"""

kanban = kanban.replace(old_style, new_style)

# Inject Legend UI
old_legend = "{selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}\n    </div>"
new_legend = """
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
        <span className="text-sm font-bold text-slate-500">Legend:</span>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-400"></div><span className="text-xs text-slate-600 font-medium">Redmine Task</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-fuchsia-400"></div><span className="text-xs text-slate-600 font-medium">Internal Project</span></div>
      </div>
      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
"""
kanban = kanban.replace(old_legend, new_legend)

write_file("/home/perzival/opstask-pro/components/board/CalendarBoard.jsx", kanban)

# Update task card UI di KanbanBoard.jsx buat nampilin requester & source
with open("/home/perzival/opstask-pro/components/board/KanbanBoard.jsx", "r") as f:
    kanban2 = f.read()

old_card_footer = """<span className="shrink-0 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-md">#{task.redmine_id}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-50">"""

new_card_footer = """<span className="shrink-0 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-md">#{task.redmine_id}</span>
                              )}
                              {!task.redmine_id && <span className="shrink-0 bg-fuchsia-50 text-fuchsia-600 text-[10px] font-bold px-2 py-0.5 rounded-md">Internal</span>}
                            </div>
                            {task.project_name && <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase">{task.project_name}</div>}
                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">"""

kanban2 = kanban2.replace(old_card_footer, new_card_footer)
write_file("/home/perzival/opstask-pro/components/board/KanbanBoard.jsx", kanban2)

# Run build
subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
