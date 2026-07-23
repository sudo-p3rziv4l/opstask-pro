import os
import subprocess

def write_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# 1. Update Root Layout (Nambahin state buat Sidebar mobile)
layout_code = """
"use client";
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useState } from 'react';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="transition-all duration-300 w-full md:pl-[260px] min-h-[calc(100vh-72px)] p-4 md:p-8">
        {children}
      </main>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/layout.jsx", layout_code)

# 2. Update Sidebar (Bisa di-toggle di HP)
sidebar_code = """
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, Briefcase, Calendar, Settings, Trophy, PlusCircle, X } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const menu = [
    { name: 'Board', icon: LayoutDashboard, path: '/board' },
    { name: 'Timeline', icon: Calendar, path: '/timeline' },
    { name: 'New Request', icon: PlusCircle, path: '/requests' },
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { name: 'Settings', icon: Settings, path: '/settings' },
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

# 3. Update Topbar (Nambah Hamburger Menu)
topbar_code = """
"use client";
import { Bell, Search, Settings, Menu } from 'lucide-react';

export default function Topbar({ onMenuClick }) {
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
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white text-slate-500 transition-colors shadow-sm bg-white/50 border border-slate-200">
          <Bell className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white text-slate-500 transition-colors shadow-sm bg-white/50 border border-slate-200">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
"""
write_file("/home/perzival/opstask-pro/components/layout/Topbar.jsx", topbar_code)

# 4. Update Board Page (Biar Grid flex di HP)
board_page = """
import KanbanBoard from "@/components/board/KanbanBoard";

export default function BoardPage() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">My ToDos</h1>
        <p className="text-slate-500 text-sm">Drag and drop your tasks across stages.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { title: "0/3", subtitle: "Completed" },
          { title: "12", subtitle: "Done (7d)" },
          { title: "113", subtitle: "Total left" },
          { title: "5", subtitle: "Goals" }
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
write_file("/home/perzival/opstask-pro/app/(dashboard)/board/page.jsx", board_page)

# 5. Update KanbanBoard.jsx (Biar kolom bisa scroll nyamping di HP bukan numpuk manjang banget)
import re
with open("/home/perzival/opstask-pro/components/board/KanbanBoard.jsx", "r") as f:
    kanban = f.read()

# Ubah flex gap biar overflow x (nyamping di HP)
kanban = kanban.replace(
    'className="flex gap-6 h-[calc(100vh-280px)] min-h-[500px]"', 
    'className="flex flex-col md:flex-row gap-6 h-[calc(100vh-280px)] min-h-[500px] md:min-h-0"'
)

write_file("/home/perzival/opstask-pro/components/board/KanbanBoard.jsx", kanban)

# Build and Restart
subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
