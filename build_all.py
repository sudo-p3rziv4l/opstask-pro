import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)

# 1. Update Database
db_sql = """
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS division VARCHAR(50);

INSERT INTO permissions (name, description) VALUES 
('task:create', 'Create local tasks'), 
('board:edit', 'Drag and drop tasks'), 
('users:manage', 'Manage users and roles'), 
('reports:view', 'View leaderboard and reports') ON CONFLICT DO NOTHING;

INSERT INTO roles (name, description) VALUES 
('Super Admin', 'Full access'),
('DevOps', 'Manage boards and tasks'),
('SPV', 'View reports and boards'),
('Programmer', 'Submit tasks only') ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'Super Admin') WHERE username = 'admindika';
"""
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', db_sql])

# 2. Update Sidebar
sidebar_code = """
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, Briefcase, Calendar, Settings, Trophy, FileText, PlusCircle } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const menu = [
    { name: 'Board', icon: LayoutDashboard, path: '/board' },
    { name: 'Timeline', icon: Calendar, path: '/timeline' },
    { name: 'New Request', icon: PlusCircle, path: '/requests' },
    { name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="w-[260px] h-screen fixed left-0 top-0 bg-white border-r border-slate-100 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="h-[72px] px-6 flex items-center border-b border-slate-100">
        <h1 className="text-xl font-bold text-sky-600 flex items-center gap-2">
          <Briefcase className="w-6 h-6" /> OpsTask
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {menu.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path}>
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

# 3. Settings Page (RBAC)
settings_code = """
export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings & Users (RBAC)</h1>
        <p className="text-slate-500">Manage roles, permissions, and team members.</p>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4">Roles</h3>
          <ul className="space-y-3">
            <li className="p-3 bg-sky-50 text-sky-700 rounded-xl font-medium border border-sky-100">Super Admin</li>
            <li className="p-3 bg-slate-50 text-slate-600 rounded-xl font-medium border border-slate-100">DevOps</li>
            <li className="p-3 bg-slate-50 text-slate-600 rounded-xl font-medium border border-slate-100">SPV</li>
            <li className="p-3 bg-slate-50 text-slate-600 rounded-xl font-medium border border-slate-100">Programmer</li>
          </ul>
          <button className="w-full mt-4 bg-slate-800 text-white py-2 rounded-xl text-sm font-bold">+ New Role</button>
        </div>
        <div className="col-span-2 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
          <h3 className="font-bold text-lg mb-4">Super Admin Permissions</h3>
          <div className="space-y-3">
            {['task:create', 'board:edit', 'users:manage', 'reports:view'].map(p => (
              <div key={p} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                <span className="font-medium text-slate-700">{p}</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-sky-600" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/settings/page.jsx", settings_code)

# 4. Leaderboard Page
leaderboard_code = """
export default function LeaderboardPage() {
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
              <th className="pb-3 font-medium">Rank</th>
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Tasks Done (30d)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
              <td className="py-4 font-bold text-sky-600">#1</td>
              <td className="py-4 font-bold text-slate-700 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs">AD</div>
                admindika
              </td>
              <td className="py-4 text-slate-500">Super Admin</td>
              <td className="py-4 font-bold text-emerald-600">12 Tasks</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/leaderboard/page.jsx", leaderboard_code)

# 5. Timeline Page
timeline_code = """
export default function TimelinePage() {
  return (
    <div className="max-w-6xl mx-auto fade-in h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Project Timeline</h1>
        <p className="text-slate-500">Gantt chart and schedule view.</p>
      </div>
      <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-700 mb-2">Timeline View</h3>
          <p className="text-slate-400">Calendar & Gantt integration rendering here...</p>
        </div>
      </div>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/timeline/page.jsx", timeline_code)

# 6. Requests Page
request_code = """
export default function RequestPage() {
  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">New DevOps Request</h1>
        <p className="text-slate-500">Submit a task directly to the DevOps team.</p>
      </div>
      <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Task Title</label>
          <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="e.g. Need new DB for staging" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Project / Division</label>
          <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20">
            <option>Internal Tools</option>
            <option>Customer Portal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Description & Redmine Links</label>
          <textarea rows="5" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="Detailed description..."></textarea>
        </div>
        <button className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-colors">Submit Request</button>
      </div>
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/requests/page.jsx", request_code)

# Build and Restart
subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
