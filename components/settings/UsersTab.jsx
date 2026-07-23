"use client";
import { useState, useEffect } from 'react';
import { UserPlus, Shield, Key, UserCircle, Trash2 } from 'lucide-react';
import CreateUserModal from './CreateUserModal';
import ChangePasswordModal from './ChangePasswordModal';

export default function UsersTab() {
  const [users, setUsers] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // DEBUGGING LANGSUNG KE LAYAR
  const [debugText, setDebugText] = useState("");

  const loadUsers = async () => {
    try {
      setDebugText(prev => prev + "Fetching API... ");
      const res = await fetch(`/api/users?t=${Date.now()}`, { 
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache, no-store' }
      });
      setDebugText(prev => prev + `Status ${res.status}... `);
      
      const rawText = await res.text();
      setDebugText(prev => prev + `Raw length ${rawText.length}... `);
      
      const data = JSON.parse(rawText);
      
      if (data && data.users && Array.isArray(data.users)) {
        setDebugText(prev => prev + `Got array of ${data.users.length}... `);
        setUsers([...data.users]);
      } else if (Array.isArray(data)) {
        setDebugText(prev => prev + `Got raw array of ${data.length}... `);
        setUsers([...data]); 
      } else {
        setDebugText(prev => prev + `Not an array. Type: ${typeof data}... `);
        setUsers([]);
      }
    } catch (err) {
      setDebugText(prev => prev + `Error: ${err.message}`);
      setUsers([]);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id, username) => {
    if(!confirm(`Are you sure you want to delete user ${username}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: 'include' });
      if(res.ok) {
         setUsers(null);
         loadUsers();
      }
      else alert("Failed to delete user");
    } catch(err) { console.error(err); }
  };

  return (
    <div className="fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">User Management</h2>
          <p className="text-sm text-slate-500">Add, edit, or remove system users.</p>
          
          <div className="mt-4 p-4 bg-red-100 text-red-900 border border-red-500 font-mono text-sm rounded shadow">
            <strong>DEBUG AREA (WILL BE REMOVED):</strong><br/>
            Log: {debugText}<br/>
            State users is NULL? {users === null ? 'YES' : 'NO'}<br/>
            State users length: {users ? users.length : 'null'}<br/>
            State users is Array? {Array.isArray(users) ? 'YES' : 'NO'}<br/>
            Raw State Content: {users ? JSON.stringify(users).substring(0,100) : 'null'}
          </div>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" /> Create User
        </button>
      </div>

      {users === null ? (
        <div className="p-8 text-center text-slate-500 animate-pulse">Loading users...</div>
      ) : users.length > 0 ? (
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
                {users.map((u, i) => (
                  <tr key={u.id || i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                          <UserCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{u.name || u.username || 'No Name'}</p>
                          <p className="text-xs text-slate-500">@{u.username || 'nouser'}</p>
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
        onClose={(refresh) => { setIsCreateModalOpen(false); if(refresh) { setUsers(null); loadUsers(); } }} 
      />
      <ChangePasswordModal 
        isOpen={isPassModalOpen} 
        onClose={() => { setIsPassModalOpen(false); setSelectedUser(null); }} 
        user={selectedUser} 
      />
    </div>
  );
}
