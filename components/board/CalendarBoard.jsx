"use client";
import { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { X, ChevronLeft, ChevronRight, MessageSquare, ExternalLink } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CustomToolbar = (toolbar) => {
  const goToBack = () => toolbar.onNavigate("PREV");
  const goToNext = () => toolbar.onNavigate("NEXT");
  const goToCurrent = () => toolbar.onNavigate("TODAY");

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 w-full">
      <div className="flex items-center gap-2 flex-1">
        <button onClick={goToBack} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <button onClick={goToCurrent} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors">
          Today
        </button>
        <button onClick={goToNext} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>
      <h2 className="text-xl font-bold text-slate-800 flex-1 text-center whitespace-nowrap">{toolbar.label}</h2>
      <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl flex-1 justify-end">
        {['month', 'week', 'agenda'].map(view => (
          <button 
            key={view}
            onClick={() => toolbar.onView(view)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold capitalize transition-all ${toolbar.view === view ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function CalendarBoard() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?t=${Date.now()}`, { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data.tasks)) setTasks(data.tasks);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleUpdateStatus = async (newStatus, redmineId) => {
    const oldStatus = selectedTask.status;
    setSelectedTask({ ...selectedTask, status: newStatus });
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedTask.id, 
          status: newStatus,
          redmine_task_id: redmineId 
        })
      });
      if (res.ok) {
        fetchTasks();
      } else {
        setSelectedTask({ ...selectedTask, status: oldStatus });
        alert("Failed to update status");
      }
    } catch (err) {
      setSelectedTask({ ...selectedTask, status: oldStatus });
      console.error(err);
    }
  };

  const events = tasks.filter(t => t.status?.toLowerCase() !== 'done').map(t => {
    const start = t.start_date ? new Date(t.start_date) : new Date(t.created_at);
    const end = t.due_date ? new Date(t.due_date) : new Date(t.created_at);
    
    return {
      id: t.id,
      title: t.title,
      project_name: t.project_name,
      start,
      end,
      allDay: true,
      description: t.description,
      status: t.status?.toLowerCase() || 'todo',
      source: t.source || 'internal',
      redmine_id: t.redmine_id,
      assigned_to: t.assigned_to,
      comments: t.comments || []
    };
  });

  const eventStyleGetter = (event) => {
    let bgColor = "#0284c7"; // Default sky-600
    if (event.status === 'done') bgColor = "#16a34a"; // green-600
    else if (event.source === 'redmine') bgColor = "#9333ea"; // purple-600
    else if (event.source === 'internal') bgColor = "#0ea5e9"; // sky-500

    return {
      style: {
        backgroundColor: bgColor,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "none",
        padding: "4px 8px",
        fontWeight: "600",
        fontSize: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }
    };
  };

  return (
    <div className="h-full flex flex-col fade-in relative">
      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs font-bold px-2 shrink-0">
        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500"></div> Internal Task</span>
        <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600"></div> Redmine Issue</span>
        
      </div>

      <div className="flex-1 min-h-[500px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%", width: "100%" }}
          onSelectEvent={t => setSelectedTask(t)}
          eventPropGetter={eventStyleGetter}
          components={{ toolbar: CustomToolbar }}
          views={['month', 'week', 'agenda']}
          className="bg-white rounded-xl"
        />
      </div>

      {/* Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden scale-in flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-800 pr-4 truncate">{selectedTask.title}</h3>
                {selectedTask.project_name && <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{selectedTask.project_name}</div>}
                {selectedTask.source === 'redmine' && (
                  <a href={`https://task.ptdika.com/issues/${selectedTask.redmine_id}`} target="_blank" rel="noreferrer" className="text-purple-600 text-xs font-bold mt-1 flex items-center gap-1 hover:underline">
                    Redmine #{selectedTask.redmine_id} <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                <p className="text-slate-700 whitespace-pre-wrap break-words overflow-hidden text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedTask.description || "No description provided."}
                </p>
              </div>

              {selectedTask.source === 'redmine' && selectedTask.comments && selectedTask.comments.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Comments
                  </p>
                  <div className="space-y-3">
                    {selectedTask.comments.map((comment, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                            {(comment.author || 'U').substring(0,2).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{comment.author}</span>
                          <span className="text-[10px] text-slate-400">on {new Date(comment.created_on).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap pl-8" dangerouslySetInnerHTML={{ __html: comment.notes }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(selectedTask.start).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(selectedTask.end).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* QUICK MOVE DROPDOWN (BAWAH) */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quick Move Stage</p>
              <select 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all outline-none cursor-pointer"
                value={selectedTask.status}
                onChange={(e) => handleUpdateStatus(e.target.value, selectedTask.redmine_id)}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
