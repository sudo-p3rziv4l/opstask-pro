import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# 1. Update Database
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', 
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by VARCHAR(50);"])
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', 
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;"])

# 2. Update API Kanban PUT (Catat siapa yang nyelesein task)
api_tasks_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import axios from "axios";
import https from "https";

export async function GET() {
  try {
    const result = await query(`
      SELECT * FROM tasks 
      WHERE status != 'done' 
         OR (status = 'done' AND updated_at >= NOW() - INTERVAL '7 days')
      ORDER BY due_date ASC
    `);
    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // Dapet user login dari cookie
    const token = request.cookies.get("token")?.value;
    let username = "Unknown";
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        username = decoded.username;
      } catch (e) {}
    }

    const { id, status } = await request.json();
    
    // Update local DB (masukin completed_by kalo status = done)
    let res;
    if (status === 'done') {
      res = await query("UPDATE tasks SET status = $1, completed_by = $2, updated_at = NOW() WHERE id = $3 RETURNING *", [status, username, id]);
    } else {
      res = await query("UPDATE tasks SET status = $1, completed_by = NULL, updated_at = NOW() WHERE id = $2 RETURNING *", [status, id]);
    }
    const updatedTask = res.rows[0];

    // Jika dipindah ke DONE dan itu task Redmine, update ke Deployed (60)
    if (status === 'done' && updatedTask.redmine_id) {
      try {
        const agent = new https.Agent({ rejectUnauthorized: false });
        await axios.put(`https://task.ptdika.com/issues/${updatedTask.redmine_id}.json`, {
          issue: { status_id: 60 }
        }, {
          headers: { "X-Redmine-API-Key": "b5408133ea672f817d64ef16f5c6667d6f6b36c3", "Content-Type": "application/json" },
          httpsAgent: agent
        });
      } catch (err) {
        console.error("Failed to update redmine status:", err.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/route.js", api_tasks_code)

# 3. Update API Summary (My Done 7d)
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
      AND completed_by = $1 
      AND updated_at >= NOW() - INTERVAL '7 days'
    `, [username]);
    const myDone = parseInt(resMyDone.rows[0].count);

    // Total Left
    const resLeft = await query("SELECT COUNT(*) FROM tasks WHERE status != 'done'");
    const totalLeft = parseInt(resLeft.rows[0].count);

    // Active Goals / Projects
    const resProjects = await query("SELECT COUNT(DISTINCT project_name) FROM tasks WHERE project_name IS NOT NULL");
    const activeGoals = parseInt(resProjects.rows[0].count);

    return NextResponse.json({ totalCompleted, myDone, totalLeft, activeGoals });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/summary/route.js", api_summary_code)

# 4. Update API Leaderboard
api_leaderboard_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query(`
      SELECT completed_by as username, COUNT(*) as done_count
      FROM tasks
      WHERE status = 'done' AND completed_by IS NOT NULL
      GROUP BY completed_by
      ORDER BY done_count DESC
    `);
    return NextResponse.json({ leaderboard: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/leaderboard/route.js", api_leaderboard_code)

# 5. Hide Done tasks on Calendar
with open("/home/perzival/opstask-pro/components/board/CalendarBoard.jsx", "r") as f:
    kanban = f.read()

# Filter status done dari tasks yang dipassing ke state
kanban = kanban.replace(
    "const events = (data.tasks || []).map(t => {",
    "const events = (data.tasks || []).filter(t => t.status !== 'done').map(t => {"
)
write_file("/home/perzival/opstask-pro/components/board/CalendarBoard.jsx", kanban)

# 6. User Profile Page & Topbar Logic
topbar_code = """
"use client";
import { Bell, Search, Settings, Menu, LogOut, ChevronDown, UserCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Topbar({ onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState({ username: 'AD', avatar_url: null });
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if(d.user) setProfile({ username: d.user.username, avatar_url: d.user.avatar_url });
      });
  }, []);

  const handleLogout = async () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-[72px] bg-white/50 backdrop-blur-md border-b border-white/40 sticky top-0 z-10 md:pl-[260px] flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center flex-1 max-w-md gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
        <div className="relative flex-1 hidden sm:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-white text-slate-500 transition-colors shadow-sm bg-white/50 border border-slate-200"><Bell className="w-5 h-5" /></button>
        
        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-white transition-colors shadow-sm bg-white/50 border border-slate-200">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold uppercase">{profile.username.substring(0,2)}</div>
            )}
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <p className="text-sm font-bold text-slate-700">My Account</p>
                <p className="text-xs text-slate-500 truncate">{profile.username}</p>
              </div>
              <Link href="/profile" onClick={() => setDropdownOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <UserCircle className="w-4 h-4" /> User Info
              </Link>
              <Link href="/settings" onClick={() => setDropdownOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-50 mt-1 pt-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
"""
write_file("/home/perzival/opstask-pro/components/layout/Topbar.jsx", topbar_code)


api_profile_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    
    const { avatar_url } = await req.json();
    
    await query("UPDATE users SET avatar_url = $1 WHERE username = $2", [avatar_url, user.username]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/users/profile/route.js", api_profile_code)


ui_profile_code = """
"use client";
import { useState, useEffect } from "react";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d => {
      if(d.user && d.user.avatar_url) setAvatarUrl(d.user.avatar_url);
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setMsg("Profile updated! Refresh to see changes on topbar.");
    } catch (err) {
      setMsg(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">User Info</h1>
        <p className="text-slate-500">Manage your profile details and avatar.</p>
      </div>

      <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover shadow-sm border-4 border-slate-50" />
          ) : (
            <div className="w-24 h-24 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center"><UserCircle className="w-12 h-12" /></div>
          )}
          <div>
            <h3 className="text-xl font-bold text-slate-800">Avatar Image</h3>
            <p className="text-sm text-slate-500">Provide a direct URL to your profile image (e.g. imgur, github avatar).</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          {msg && <div className="p-4 bg-sky-50 text-sky-700 rounded-xl font-bold">{msg}</div>}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Avatar Image URL</label>
            <input type="url" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="https://example.com/my-photo.jpg" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">
            {loading ? "Updating..." : "Save Profile"}
          </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-slate-100">
          <p className="text-sm text-slate-500">To change your password, please use the <strong>Settings</strong> > <strong>Users</strong> menu (Requires Admin privileges) or the dedicated password modal.</p>
        </div>
      </div>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/profile/page.jsx", ui_profile_code)

# 7. Update auth/me biar ngembaliin avatar_url
api_auth_me_code = """
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request) {
  const token = request.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch latest info from DB (e.g. avatar_url)
    const userDb = await query("SELECT id, username, role, avatar_url FROM users WHERE id = $1", [decoded.id]);
    
    if (userDb.rows.length > 0) {
      return NextResponse.json({ user: userDb.rows[0] });
    }
    return NextResponse.json({ user: decoded });
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/auth/me/route.js", api_auth_me_code)

# Run build
subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
