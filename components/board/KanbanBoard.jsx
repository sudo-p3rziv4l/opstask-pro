"use client";
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { RefreshCcw } from "lucide-react";
import TaskModal from "./TaskModal";

const COLUMNS = {
  todo: { id: "todo", title: "To Do", color: "bg-slate-100", dot: "bg-slate-400" },
  in_progress: { id: "in_progress", title: "In Progress", color: "bg-sky-50", dot: "bg-sky-500" },
  done: { id: "done", title: "Done", color: "bg-emerald-50", dot: "bg-emerald-500" }
};

export default function KanbanBoard() {
  const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filterMode, setFilterMode] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?t=${Date.now()}`, { credentials: "include" });
      const data = await res.json();
      
      const grouped = { todo: [], in_progress: [], done: [] };
      (data.tasks || []).forEach(t => {
        const statusKey = (t.status || 'todo').toLowerCase().replace(/\s+/g, '_');
        if (grouped[statusKey]) grouped[statusKey].push(t);
        else grouped.todo.push(t);
      });
      setTasks(grouped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/tasks/sync", { method: "POST", credentials: "include" });
      await fetchTasks();
    } catch (e) {
      console.error("Sync failed", e);
    } finally {
      setSyncing(false);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const sourceClone = Array.from(tasks[sourceCol]);
    const destClone = sourceCol === destCol ? sourceClone : Array.from(tasks[destCol]);
    
    const [movedTask] = sourceClone.splice(source.index, 1);
    movedTask.status = destCol;
    destClone.splice(destination.index, 0, movedTask);

    setTasks({ ...tasks, [sourceCol]: sourceClone, [destCol]: destClone });

    const payload = {
      id: draggableId,
      status: destCol
    };

    if (movedTask.redmine_id) {
      payload.is_redmine = true;
      payload.redmine_id = movedTask.redmine_id;
    }

    try {
      const response = await fetch("/api/tasks", { 
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        if (response.status === 500) {
          console.error(`API Error 500 when updating task ${draggableId}. Payload:`, payload);
        } else {
          console.error(`API Error ${response.status} when updating task ${draggableId}.`);
        }
      }
    } catch (error) {
      console.error("Network or fetch error when updating task:", error);
    }
  };

  const getFilteredTasks = (colId) => {
    const colTasks = tasks[colId] || [];
    if (filterMode === "redmine") return colTasks.filter(t => t.redmine_id != null);
    if (filterMode === "internal") return colTasks.filter(t => t.redmine_id == null);
    return colTasks;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2 bg-white/50 backdrop-blur border border-white/60 p-1 rounded-xl shadow-sm">
          <button onClick={() => setFilterMode("all")} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterMode === "all" ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}>
            All Tasks
          </button>
          <button onClick={() => setFilterMode("redmine")} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterMode === "redmine" ? "bg-indigo-50 text-indigo-700 shadow" : "text-slate-500 hover:text-slate-700"}`}>
            Redmine Only
          </button>
          <button onClick={() => setFilterMode("internal")} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filterMode === "internal" ? "bg-fuchsia-50 text-fuchsia-700 shadow" : "text-slate-500 hover:text-slate-700"}`}>
            Internal Only
          </button>
        </div>

        <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm">
          <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing Redmine...' : 'Sync Redmine Tasks'}
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-280px)] min-h-[500px] md:min-h-0">
          {Object.values(COLUMNS).map(col => (
            <div key={col.id} className="flex-1 flex flex-col bg-white/50 backdrop-blur rounded-[24px] border border-white/60 p-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <h3 className="font-bold text-slate-700">{col.title}</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{getFilteredTasks(col.id).length}</span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 overflow-y-auto kanban-scroll flex flex-col gap-3 p-2 rounded-[16px] transition-colors ${snapshot.isDraggingOver ? col.color : 'bg-transparent'}`}>
                    {loading ? <p className="text-center text-slate-400 text-sm py-4">Loading...</p> : getFilteredTasks(col.id).map((task, index) => (
                      <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            onClick={() => setSelectedTask(task)}
                            className={`bg-white p-4 rounded-[16px] border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-sky-500/20' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h4 className="font-bold text-slate-800 text-sm leading-snug">{task.title}</h4>
                              {task.redmine_id && (
                                <span className="shrink-0 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-md">#{task.redmine_id}</span>
                              )}
                              {!task.redmine_id && <span className="shrink-0 bg-fuchsia-50 text-fuchsia-600 text-[10px] font-bold px-2 py-0.5 rounded-md">Internal</span>}
                            </div>
                            {task.project_name && <div className="text-[10px] text-slate-500 font-bold mb-2 uppercase">{task.project_name}</div>}
                            
                            <div className="flex flex-col gap-1 mb-2">
                              {(task.start_date || task.due_date) && (
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {task.start_date && `${new Date(task.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                  {task.start_date && task.due_date && ' - '}
                                  {task.due_date && `${new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                </div>
                              )}
                              {task.deployment_guide && task.deployment_guide.trim() !== '' && (
                                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 w-max px-1.5 py-0.5 rounded">
                                  Deployment Guide: Ada
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-50">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px]">
                                  {task.assigned_to ? task.assigned_to.substring(0,2).toUpperCase() : '?'}
                                </div>
                                <span className="truncate max-w-[100px]">{task.assigned_to}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
