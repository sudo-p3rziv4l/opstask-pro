"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Calendar, Trophy, PlusCircle, X, ChevronLeft, ChevronRight, BarChart3, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar({ isOpen, setIsOpen, collapsed, setCollapsed }) {
  const pathname = usePathname();
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          if (data.user.permissions) setPermissions(data.user.permissions);
          if (data.user.role) setRole(data.user.role);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allMenus = [
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard', requiredPerm: 'reports:view' },
    { name: 'Board', icon: LayoutDashboard, path: '/board', requiredPerm: 'board:edit' },
    { name: 'Timeline', icon: Calendar, path: '/timeline', requiredPerm: 'timeline:view' },
    { name: 'New Request', icon: PlusCircle, path: '/requests', requiredPerm: 'task:create' },
    { name: 'Projects', icon: Briefcase, path: '/projects', requiredPerm: 'projects:bulk' },

  ];

  const visibleMenus = allMenus.filter(menu => {
    if (role === 'Super Admin' || permissions.includes('all')) return true;
    return permissions.includes(menu.requiredPerm);
  });

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[260px]';

  return (
    <aside className={`${sidebarWidth} h-screen fixed left-0 top-0 bg-white border-r border-slate-100 flex flex-col z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 group`}>
      
      {/* Modern floating toggle button on hover over the border area */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-sky-600 hover:border-sky-600 hover:scale-110 shadow-sm transition-all z-40 opacity-0 group-hover:opacity-100"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="h-[72px] px-4 flex items-center justify-between border-b border-transparent shrink-0">
        {!collapsed ? (
          <h1 className="text-xl font-bold text-sky-600 flex items-center gap-2 whitespace-nowrap overflow-hidden px-2">
            <Briefcase className="w-6 h-6 flex-shrink-0" /> OpsTask
          </h1>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-sky-600" />
            </div>
          </div>
        )}
        <button className="md:hidden p-1 text-slate-500" onClick={() => setIsOpen(false)}>
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {loading ? (
          <div className="text-slate-400 text-sm px-4">Loading...</div>
        ) : (
          <div className="space-y-1.5">
            {visibleMenus.length === 0 && <div className="text-slate-400 text-sm px-2">No access.</div>}
            {visibleMenus.map((item) => {
              const isActive = pathname.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)} title={collapsed ? item.name : ''}>
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-sky-50 text-sky-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                    <item.icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    {!collapsed && <span className="whitespace-nowrap text-[15px]">{item.name}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

    </aside>
  );
}
