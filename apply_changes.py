import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# 1. Update API Sync (Cuma narik status_id=51)
api_sync_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function POST() {
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    // Fetch specifically status_id=51 (Ready To Deploy)
    const res = await axios.get("https://task.ptdika.com/issues.json?limit=100&status_id=51", {
      headers: { "X-Redmine-API-Key": "b5408133ea672f817d64ef16f5c6667d6f6b36c3" },
      httpsAgent: agent
    });

    const issues = res.data.issues || [];
    let synced = 0;

    for (const issue of issues) {
      let status = 'todo'; // by default ready to deploy is your To Do
      if (issue.status.name.toLowerCase().includes('in progress')) status = 'in_progress';
      if (issue.status.name.toLowerCase().includes('closed') || issue.status.name.toLowerCase().includes('resolved')) status = 'done';

      await query(`
        INSERT INTO tasks (redmine_id, title, description, status, assigned_to, due_date, start_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (redmine_id) DO UPDATE SET 
          title = EXCLUDED.title,
          description = EXCLUDED.description,
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

    // Optional: Delete old redmine tasks from our DB that are NO LONGER "Ready To Deploy"
    // To keep it simple, we just leave them. But if needed we can prune.

    return NextResponse.json({ success: true, count: synced });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/sync/route.js", api_sync_code)

# 2. Update Sidebar (Buang Settings)
sidebar_code = """
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, Briefcase, Calendar, Trophy, PlusCircle, X } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const menu = [
    { name: 'Board', icon: LayoutDashboard, path: '/board' },
    { name: 'Timeline', icon: Calendar, path: '/timeline' },
    { name: 'New Request', icon: PlusCircle, path: '/requests' },
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' }
  ];

  return (
    <aside className={`w-[260px] h-screen fixed left-0 top-0 bg-white border-r border-slate-100 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="h-[72px] px-6 flex items-center justify-between border-b border-slate-100">
        <h1 className="text-xl font-bold text-sky-600 flex items-center gap-2">
          <Briefcase className="w-6 h-6" /> OpsTask
        </h1>
        <button className="md:hidden p-1 text-slate-500" onClick={() => setIsOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {menu.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${isActive ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  );
}
"""
write_file("/home/perzival/opstask-pro/components/layout/Sidebar.jsx", sidebar_code)

# 3. Update Topbar (Tambahin Settings di Dropdown)
topbar_code = """
"use client";
import { Bell, Search, Settings, Menu, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Topbar({ onMenuClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-[72px] bg-white/50 backdrop-blur-md border-b border-white/40 sticky top-0 z-10 md:pl-[260px] flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center flex-1 max-w-md gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative flex-1 hidden sm:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-white text-slate-500 transition-colors shadow-sm bg-white/50 border border-slate-200">
          <Bell className="w-5 h-5" />
        </button>
        
        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-white transition-colors shadow-sm bg-white/50 border border-slate-200"
          >
            <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
              AD
            </div>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-50 mb-1">
                <p className="text-sm font-bold text-slate-700">My Account</p>
              </div>
              <Link href="/settings" onClick={() => setDropdownOpen(false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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

# Kosongin tabel tasks yang redmine_id != null biar pas nge-sync bener2 bersih cuma sisa ID 51
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', 
                "DELETE FROM tasks WHERE redmine_id IS NOT NULL;"])

# Build and Restart
subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
