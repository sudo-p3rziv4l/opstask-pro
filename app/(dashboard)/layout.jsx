"use client";
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import FloatingChat from '@/components/chatbot/FloatingChat';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (!d.user) {
          router.replace('/login');
          return;
        }

        const perms = d.user.permissions || [];
        const role = d.user.role;
        
        if (role === 'Super Admin' || perms.includes('all')) {
          setAuthorized(true);
          return;
        }

        const routePerms = {
          '/board': 'board:edit',
          '/timeline': 'timeline:view',
          '/requests': 'task:create',
          '/leaderboard': 'reports:view',
          '/projects': 'projects:bulk',
          '/settings': 'settings:access',
          '/profile': 'profile:edit'
        };

        const requiredPerm = routePerms[pathname];
        
        if (requiredPerm && !perms.includes(requiredPerm) && pathname !== '/profile') {
          if (perms.includes('board:edit')) router.replace('/board');
          else if (perms.includes('timeline:view')) router.replace('/timeline');
          else if (perms.includes('task:create')) router.replace('/requests');
          else if (perms.includes('reports:view')) router.replace('/leaderboard');
          else if (perms.includes('projects:bulk')) router.replace('/projects');
          else router.replace('/profile');
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => router.replace('/login'));
  }, [pathname]);

  if (!authorized) {
    return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-pulse text-sky-600 font-bold">Checking Access...</div></div>;
  }

  const mainPadding = sidebarCollapsed ? 'md:pl-[88px]' : 'md:pl-[276px]'; // 72px + 16px (gap) dan 260px + 16px

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      {/* Topbar sekarang juga butuh tau state collapse */}
      <Topbar onMenuClick={() => setSidebarOpen(true)} sidebarCollapsed={sidebarCollapsed} /> 
      <main className={`${mainPadding} p-4 md:p-8 mt-[72px] p-4 md:p-8 transition-all duration-300`}>
        {children}
      </main>
      <FloatingChat />
    </div>
  );
}
