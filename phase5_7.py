import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# 1. API New Request
api_request_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { title, division, description } = await request.json();
    await query(
      "INSERT INTO tasks (title, description, status, assigned_to) VALUES ($1, $2, 'todo', 'Unassigned')",
      [title, `[${division}] ${description}`]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/request/route.js", api_request_code)

# 2. UI New Request
ui_request_code = """
"use client";
import { useState } from "react";

export default function RequestPage() {
  const [title, setTitle] = useState("");
  const [division, setDivision] = useState("Internal Tools");
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
        body: JSON.stringify({ title, division, description })
      });
      if (!res.ok) throw new Error("Gagal submit");
      setMsg("Task berhasil disubmit ke DevOps!");
      setTitle("");
      setDescription("");
    } catch (err) {
      setMsg(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">New DevOps Request</h1>
        <p className="text-slate-500">Submit a task directly to the DevOps team.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 space-y-6">
        {msg && <div className="p-4 bg-sky-50 text-sky-700 rounded-xl font-bold">{msg}</div>}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Task Title</label>
          <input required type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="e.g. Need new DB for staging" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Project / Division</label>
          <select value={division} onChange={e=>setDivision(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20">
            <option>Internal Tools</option>
            <option>Customer Portal</option>
            <option>Redmine Sync</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Description & Links</label>
          <textarea required rows="5" value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="Detailed description..."></textarea>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/requests/page.jsx", ui_request_code)

# 3. API Leaderboard
api_leaderboard_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query(`
      SELECT assigned_to as username, COUNT(*) as done_count
      FROM tasks
      WHERE status = 'done' AND assigned_to IS NOT NULL AND assigned_to != 'Unassigned'
      GROUP BY assigned_to
      ORDER BY done_count DESC
    `);
    return NextResponse.json({ leaderboard: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/leaderboard/route.js", api_leaderboard_code)

# 4. UI Leaderboard
ui_leaderboard_code = """
"use client";
import { useState, useEffect } from "react";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(data => {
        setLeaders(data.leaderboard || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Team Leaderboard</h1>
        <p className="text-slate-500">Analytics and task completion ranking.</p>
      </div>
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100">
              <th className="pb-3 font-medium px-4">Rank</th>
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Tasks Done</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="py-8 text-center text-slate-400">Loading data...</td></tr>
            ) : leaders.length === 0 ? (
              <tr><td colSpan="3" className="py-8 text-center text-slate-400">No completed tasks yet.</td></tr>
            ) : (
              leaders.map((user, idx) => (
                <tr key={user.username} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="py-4 font-bold text-sky-600 px-4">#{idx + 1}</td>
                  <td className="py-4 font-bold text-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs">
                      {user.username.substring(0,2).toUpperCase()}
                    </div>
                    {user.username}
                  </td>
                  <td className="py-4 font-bold text-emerald-600">{user.done_count} Tasks</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/leaderboard/page.jsx", ui_leaderboard_code)

# Execute Build and Restart
subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
