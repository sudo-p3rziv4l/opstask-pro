import os
import subprocess

def write_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

calendar_code = """
"use client";
import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import TaskModal from "./TaskModal";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Custom Toolbar for modern look
const CustomToolbar = (toolbar) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');

  const label = () => {
    const date = format(toolbar.date, 'MMMM yyyy');
    return <span className="text-xl font-bold text-slate-800">{date}</span>;
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="flex items-center gap-2">
        <button onClick={goToBack} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"><ChevronLeft className="w-5 h-5"/></button>
        <button onClick={goToCurrent} className="px-4 py-2 font-bold text-sm rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">Today</button>
        <button onClick={goToNext} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"><ChevronRight className="w-5 h-5"/></button>
      </div>
      <div>{label()}</div>
      <div className="flex bg-slate-100 p-1 rounded-xl">
        {toolbar.views.map(view => (
          <button 
            key={view}
            onClick={() => toolbar.onView(view)}
            className={`px-4 py-1.5 text-sm font-bold capitalize rounded-lg transition-all ${toolbar.view === view ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

// Custom Event format
const CustomEvent = ({ event }) => {
  return (
    <div className="flex items-center gap-1.5 px-1 overflow-hidden">
      <div className="truncate text-[11px] leading-tight font-semibold tracking-wide">
        {event.title}
      </div>
    </div>
  );
};

export default function CalendarBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetch("/api/tasks")
      .then(res => res.json())
      .then(data => {
        const events = (data.tasks || []).map(t => {
          let s = t.start_date ? new Date(t.start_date) : new Date(t.created_at || Date.now());
          let e = t.due_date ? new Date(t.due_date) : s;
          return { ...t, start: s, end: e, title: t.title };
        });
        setTasks(events);
        setLoading(false);
      });
  }, []);

  const eventStyleGetter = (event) => {
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

    return {
      style: {
        backgroundColor,
        color,
        border,
        borderRadius: "8px",
        opacity: 1,
        display: "block",
        margin: "1px 2px",
        padding: "2px",
      }
    };
  };

  if (loading) return <div className="flex-1 flex items-center justify-center text-slate-500 animate-pulse">Loading Calendar...</div>;

  return (
    <div className="flex-1 h-full calendar-wrapper">
      <style>{`
        .calendar-wrapper .rbc-calendar { font-family: 'Inter', sans-serif; border: none; }
        .calendar-wrapper .rbc-month-view, .calendar-wrapper .rbc-time-view { border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; background: white; }
        .calendar-wrapper .rbc-header { padding: 12px 0; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; color: #64748b; border-bottom: 1px solid #f1f5f9; }
        .calendar-wrapper .rbc-day-bg { border-left: 1px solid #f8fafc; border-bottom: 1px solid #f8fafc; transition: background 0.2s; }
        .calendar-wrapper .rbc-day-bg:hover { background-color: #f8fafc; }
        .calendar-wrapper .rbc-today { background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%); }
        .calendar-wrapper .rbc-date-cell { padding: 8px; font-weight: 600; color: #334155; font-size: 0.85rem; }
        .calendar-wrapper .rbc-off-range-bg { background-color: #fafafa; }
        .calendar-wrapper .rbc-off-range .rbc-date-cell { color: #cbd5e1; }
        .calendar-wrapper .rbc-event { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .calendar-wrapper .rbc-event:hover { filter: brightness(0.95); transform: translateY(-1px); }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={tasks}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => setSelectedTask(event)}
        views={["month", "week"]}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent
        }}
      />

      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/components/board/CalendarBoard.jsx", calendar_code)

# Build and Restart
subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
