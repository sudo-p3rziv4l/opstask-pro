"use client";
import { Search, Bell, ChevronsUpDown, User, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function Topbar({ onMenuClick, sidebarCollapsed }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  
  const handleLogout = () => {
    fetch('/api/auth/logout').then(() => router.push('/login'));
  };

  const topbarPadding = sidebarCollapsed ? 'md:pl-[88px]' : 'md:pl-[276px]';

  return (
    <header className={`fixed top-0 left-0 right-0 h-[72px] bg-white/80 backdrop-blur-sm border-b border-slate-100 z-10 transition-all duration-300 ${topbarPadding}`}>
      <div className="px-4 md:px-8 h-full flex items-center justify-between">
        <button className="md:hidden p-2 text-slate-500" onClick={onMenuClick}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden md:flex items-center w-full max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
            >
              <div className="w-9 h-9 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center font-bold text-sm">
                {user?.username?.substring(0,2).toUpperCase() || '..'}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-sm font-bold text-slate-800">{user?.name || user?.username}</span>
                <span className="text-xs text-slate-500">{user?.role}</span>
              </div>
              <ChevronsUpDown className="hidden md:block w-4 h-4 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-lg p-2 z-50">
                <div className="p-2">
                  <p className="text-sm font-bold text-slate-800">{user?.name || user?.username}</p>
                  <p className="text-xs text-slate-500">{user?.role}</p>
                </div>
                <div className="w-full h-[1px] bg-slate-100 my-1"></div>
                <button onClick={() => { router.push('/profile'); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm">
                  <User className="w-4 h-4" /> My Profile
                </button>
                <button onClick={() => { router.push('/settings'); setDropdownOpen(false); }} className="w-full text-left flex items-center gap-2 p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
