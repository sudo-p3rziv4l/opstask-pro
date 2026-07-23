import os
import subprocess

def write_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

ui_users_code = """
"use client";
import { useState, useEffect } from 'react';
import { UserPlus, Shield, Key, UserCircle, Trash2 } from 'lucide-react';
import CreateUserModal from './CreateUserModal';
import ChangePasswordModal from './ChangePasswordModal';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/users?nocache=" + Date.now())
      .then(res => res.json())
      .then(data => {
        // Maksa convert jadi format array apupun bentuk aslinya
        let userList = [];
        if (Array.isArray(data)) userList = data;
        else if (data && Array.isArray(data.users)) userList = data.users;
        
        setUsers(userList);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch users error:", err);
        setUsers([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id, username) => {
    if(!confirm(`Are you sure you want to delete user ${username}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if(res.ok) fetchUsers();
      else alert("Failed to delete user");
    } catch(err) { console.error(err); }
  };

  // Kalo state users-nya ada isinya (lebih dari 0), var ini jadi TRUE
  const hasUsers = users && users.length > 0;

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500">Add, edit, or remove system users.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Create User
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse">Loading users...</div>
      ) : hasUsers ? (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                          <UserCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.name || u.username}</p>
                          <p className="text-xs text-slate-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                        <Shield className="w-3 h-3" /> {u.role || 'No Role'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedUser(u); setIsPassModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Change Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={u.role === 'Super Admin'}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
          <p className="text-slate-500">Click "+ Create User" to add a new member to the system.</p>
        </div>
      )}

      <CreateUserModal 
        isOpen={isCreateModalOpen} 
        onClose={(refresh) => { setIsCreateModalOpen(false); if(refresh) fetchUsers(); }} 
      />
      <ChangePasswordModal 
        isOpen={isPassModalOpen} 
        onClose={() => { setIsPassModalOpen(false); setSelectedUser(null); }} 
        user={selectedUser} 
      />
    </div>
  );
}
"""
write_file("/home/perzival/opstask-pro/components/settings/UsersTab.jsx", ui_users_code)

subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
