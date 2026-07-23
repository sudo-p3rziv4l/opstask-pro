import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# 1. Update DB (Nambahin start_date)
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', 
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;"])

# 2. Update API Sync (Mastiin narik start_date)
api_sync_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST() {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const res = await axios.get("https://task.ptdika.com/issues.json?limit=100", {
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
        INSERT INTO tasks (redmine_id, title, description, status, assigned_to, due_date, start_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (redmine_id) DO UPDATE SET 
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          due_date = EXCLUDED.due_date,
          start_date = EXCLUDED.start_date
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

# 3. Calendar UI Page
calendar_page = """
import CalendarBoard from "@/components/board/CalendarBoard";

export default function TimelinePage() {
  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">Timeline & Calendar</h1>
        <p className="text-slate-500 text-sm">View your tasks across dates.</p>
      </div>

      <div className="flex-1 bg-white/80 p-5 rounded-[20px] shadow-sm border border-white backdrop-blur-sm overflow-hidden flex flex-col">
        <CalendarBoard />
      </div>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/timeline/page.jsx", calendar_page)

# 4. Calendar Component
calendar_comp = """
"use client";
import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import TaskModal from "./TaskModal";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function CalendarBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => {
        const events = (data.tasks || []).map(t => {
          // Defaults to today if no date is set
          let s = t.start_date ? new Date(t.start_date) : new Date(t.created_at || Date.now());
          let e = t.due_date ? new Date(t.due_date) : s;
          return {
            ...t,
            start: s,
            end: e,
            title: t.title
          };
        });
        setTasks(events);
        setLoading(false);
      });
  }, []);

  const eventStyleGetter = (event) => {
    let backgroundColor = "#cbd5e1"; // slate-300
    if (event.status === "in_progress") backgroundColor = "#0ea5e9"; // sky-500
    if (event.status === "done") backgroundColor = "#10b981"; // emerald-500

    return {
      style: {
        backgroundColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
        fontSize: "0.75rem",
        padding: "2px 6px",
        fontWeight: "bold"
      }
    };
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-slate-500 animate-pulse">Loading Calendar...</div>;

  return (
    <div className="flex-1">
      <style>{`
        .rbc-calendar { font-family: inherit; }
        .rbc-btn-group button { border-radius: 8px !important; }
        .rbc-toolbar button.rbc-active { background-color: #f0f9ff; color: #0284c7; box-shadow: none; border-color: #bae6fd; }
        .rbc-today { background-color: #f8fafc; }
        .rbc-event { padding: 4px; }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={tasks}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => setSelectedTask(event)}
        views={["month", "week", "agenda"]}
      />

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/components/board/CalendarBoard.jsx", calendar_comp)

# Execute NPM Install & PM2 Restart
subprocess.run('cd /home/perzival/opstask-pro && npm install react-big-calendar date-fns && npm run build && npx pm2 restart opstask-pro', shell=True)

