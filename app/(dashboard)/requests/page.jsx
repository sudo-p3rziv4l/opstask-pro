"use client";
import { useState } from "react";

export default function RequestPage() {
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [deploymentGuide, setDeploymentGuide] = useState("");
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
        body: JSON.stringify({ title, projectName, description, startDate, dueDate, deployment_guide: deploymentGuide })
      });
      if (!res.ok) throw new Error("Gagal submit");
      setMsg("Task berhasil disubmit ke DevOps!");
      setTitle("");
      setProjectName("");
      setStartDate("");
      setDueDate("");
      setDescription("");
      setDeploymentGuide("");
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
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
          <input required type="text" value={projectName} onChange={e=>setProjectName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="e.g. Internal Portal" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
            <input required type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" />
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
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Deployment Guide (Optional)</label>
          <textarea rows="4" value={deploymentGuide} onChange={e=>setDeploymentGuide(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="Deployment steps, config changes, etc."></textarea>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">
          {loading ? "Submitting..." : "Submit Task"}
        </button>
      </form>
    </div>
  );
}
