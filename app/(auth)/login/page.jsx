"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Login failed");

      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      let targetPath = '/board';
      
      if (meData?.user) {
        const role = meData.user.role;
        const perms = meData.user.permissions || [];
        if (role === 'Super Admin' || perms.includes('all')) targetPath = '/board';
        else if (perms.includes('board:edit')) targetPath = '/board';
        else if (perms.includes('timeline:view')) targetPath = '/timeline';
        else if (perms.includes('task:create')) targetPath = '/requests';
        else if (perms.includes('reports:view')) targetPath = '/leaderboard';
        else if (perms.includes('projects:bulk')) targetPath = '/projects';
        else targetPath = '/profile';
      }
      
      router.push(targetPath);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col lg:flex-row bg-[#F8FAFC] overflow-hidden m-0 p-0 font-sans">
      
      {/* LEFT SECTION: Clean, Techy, matches dashboard aesthetics */}
      <div className="hidden lg:flex w-1/2 bg-sky-700 flex-col justify-between p-16 xl:p-24 relative overflow-hidden">
        {/* Subtle background pattern (Dot grid) */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_2px,transparent_2px)] [background-size:24px_24px]"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Briefcase className="w-6 h-6 text-sky-600" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">OpsTask Pro</h1>
          </div>

          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Streamline your<br />DevOps workflow.
          </h2>
          <p className="text-sky-100 text-lg max-w-md font-medium leading-relaxed">
            Manage requests, synchronize with Redmine, and track your team's progress in one clean, unified dashboard.
          </p>
        </div>

        {/* Feature list matching dashboard vibe */}
        <div className="relative z-10 space-y-5">
          {['Real-time Redmine Sync', 'Interactive Kanban Board', 'Dynamic Timeline & Calendar', 'Role-Based Access Control'].map((feat, i) => (
            <div key={i} className="flex items-center gap-4 text-sky-50 font-medium">
              <CheckCircle2 className="w-5 h-5 text-sky-400" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SECTION: The Form (Dashboard UI Matched) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white p-8 lg:p-16 h-screen relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
              <Briefcase className="w-6 h-6 text-sky-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">OpsTask Pro</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-500 font-medium text-sm">Please enter your details to sign in.</p>
          </div>
          
          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <input 
                required type="text" value={username} onChange={e => setUsername(e.target.value)} 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 font-medium" 
                placeholder="e.g. admindika" 
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input 
                required 
                type={showPass ? 'text' : 'password'} 
                value={password} onChange={e => setPassword(e.target.value)} 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800 font-medium pr-10" 
                placeholder="••••••••" 
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 bottom-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1 pb-2">
              <input type="checkbox" id="remember" className="w-4 h-4 text-sky-600 accent-sky-600 rounded border-slate-300 cursor-pointer" defaultChecked />
              <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer select-none">Remember me</label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-50 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            
          </form>
        </div>
      </div>

    </div>
  );
}
