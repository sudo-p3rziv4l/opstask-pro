import os
import subprocess

def write_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# Injek debugger ekstrim
ui_users_code = """
"use client";
import { useState, useEffect } from 'react';
import { UserPlus, Shield, Key, UserCircle, Trash2 } from 'lucide-react';
import CreateUserModal from './CreateUserModal';
import ChangePasswordModal from './ChangePasswordModal';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugLog, setDebugLog] = useState("Initializing...");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    setDebugLog("Starting fetch...");
    
    fetch("/api/users?nocache=" + Date.now(), { credentials: 'include' })
      .then(async (res) => {
        setDebugLog(prev => prev + ` | Status: ${res.status}`);
        const text = await res.text();
        setDebugLog(prev => prev + ` | Raw body length: ${text.length}`);
        
        try {
          const data = JSON.parse(text);
          let userList = [];
          if (Array.isArray(data)) userList = data;
          else if (data && Array.isArray(data.users)) userList = data.users;
          
          setDebugLog(prev => prev + ` | Final list size: ${userList.length}`);
          setUsers(userList);
        } catch(e) {
          setDebugLog(prev => prev + ` | JSON Parse Error: ${e.message}`);
        }
        setLoading(false);
      })
      .catch(err => {
        setDebugLog(prev => prev + ` | Fetch Crash: ${err.message}`);
        setUsers([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const hasUsers = users && users.length > 0;

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500">Add, edit, or remove system users.</p>
          <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 text-xs font-mono rounded">
            DEBUG: {debugLog}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse">Loading users...</div>
      ) : hasUsers ? (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b"><td className="p-4">{u.username} - {u.role}</td></tr>
                ))}
              </tbody>
            </table>
        </div>
      ) : (
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
          <p className="text-slate-500">Click "+ Create User" to add a new member to the system.</p>
        </div>
      )}
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/components/settings/UsersTab.jsx", ui_users_code)
subprocess.run('cd /home/perzival/opstask-pro && rm -rf .next && npm run build && npx pm2 restart opstask-pro', shell=True)
