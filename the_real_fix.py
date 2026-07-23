import os
import subprocess

def write_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# Benerin page.jsx yang ASLI
ui_code = """
"use client";
import { useState, useEffect } from 'react';
import { Trash2, Edit2, KeyRound } from 'lucide-react';
import Tabs from '@/components/settings/Tabs';
import CreateUserModal from '@/components/settings/CreateUserModal';
import CreateRoleModal from '@/components/settings/CreateRoleModal';
import ChangePasswordModal from '@/components/settings/ChangePasswordModal';
import EditRoleModal from '@/components/settings/EditRoleModal';

export default function SettingsPage() {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [users, setUsers] = useState([]);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  
  const [roles, setRoles] = useState([]);
  const [activeRole, setActiveRole] = useState(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      // INI YANG PALING PENTING: credentials include & anti-cache
      const res = await fetch(`/api/users?t=${Date.now()}`, { credentials: 'include' });
      const data = await res.json();
      
      let list = [];
      if (data && data.users && Array.isArray(data.users)) list = data.users;
      else if (Array.isArray(data)) list = data;
      
      setUsers(list);
    } catch (e) { console.error(e); }
  };
  
  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRoles(data);
      }
    } catch(e) { console.error(e); }
  };
  
  const openEditModal = (role) => {
    setSelectedRoleForEdit(role);
    setIsEditRoleModalOpen(true);
  };

  const handleDeleteRole = async (roleId, roleName) => {
    if (roleName === 'Super Admin') return alert("Cannot delete Super Admin role!");
    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) return;

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete role');
      }

      setRoles(roles.filter(r => r.id !== roleId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Nambahin fitur delete user sekalian
  const handleDeleteUser = async (id, username) => {
    if(!confirm(`Are you sure you want to delete user ${username}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: 'include' });
      if(res.ok) fetchUsers();
      else alert("Failed to delete user");
    } catch(err) { console.error(err); }
  };

  const tabs = [
    { id: 'users', name: 'Users' },
    { id: 'roles', name: 'Roles & Permissions' }
  ];

  return (
    <div className="max-w-6xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
        <p className="text-slate-500">Manage your workspace, users, and roles.</p>
      </div>

      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
        <Tabs tabs={tabs} defaultTab="users">
          {(activeTab) => (
            <>
              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">User Management</h3>
                    <button \n                      onClick={() => setIsUserModalOpen(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                      + Create User
                    </button>
                  </div>
                  
                  {users.length === 0 ? (
                    <div className="border border-slate-100 rounded-xl p-8 text-center bg-slate-50">
                      <p className="text-slate-500 font-medium">Click "+ Create User" to add a new member to the system.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-medium">
                          <tr>
                            <th className="px-4 py-3">Username / Name</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {user.name || user.username} 
                                <span className="block text-xs font-normal text-slate-400">@{user.username}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                  {user.role || 'No Role'}
                                </span>
                              </td>
                              <td className="px-4 py-3 flex justify-end gap-2">
                                <button \n                                  onClick={() => {
                                    setSelectedUserForPassword(user);
                                    setIsPasswordModalOpen(true);
                                  }}
                                  title="Change Password"
                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteUser(user.id, user.username)} disabled={user.role === 'Super Admin'} title="Delete User" className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'roles' && (
                <div className="max-w-3xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Role Management</h3>
                    <button \n                      onClick={() => setIsRoleModalOpen(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                      + Create Role
                    </button>
                  </div>
                  
                  {roles.length === 0 ? (
                    <div className="border border-slate-100 rounded-xl p-8 text-center bg-slate-50">
                      <p className="text-slate-500 font-medium">No roles found.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-medium">
                          <tr>
                            <th className="px-4 py-3">Role Name</th>
                            <th className="px-4 py-3">Permissions Count</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {roles.map(role => (
                            <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-800">{role.name}</td>
                              <td className="px-4 py-3">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                  {role.permissions?.length || 0} permissions
                                </span>
                              </td>
                              <td className="px-4 py-3 flex justify-end gap-2">
                                <button \n                                  title="Edit Role" \n                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                                  onClick={() => openEditModal(role)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {role.name !== 'Super Admin' && (
                                  <button \n                                    title="Delete Role" \n                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    onClick={() => handleDeleteRole(role.id, role.name)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Tabs>
      </div>

      <CreateUserModal \n        isOpen={isUserModalOpen} \n        onClose={(refresh) => { setIsUserModalOpen(false); if(refresh) fetchUsers(); }} \n      />\n\n      <CreateRoleModal \n        isOpen={isRoleModalOpen} \n        onClose={(refresh) => { setIsRoleModalOpen(false); if(refresh) fetchRoles(); }} \n      />\n\n      <EditRoleModal \n        isOpen={isEditRoleModalOpen} \n        onClose={(refresh) => { setIsEditRoleModalOpen(false); if(refresh) fetchRoles(); }} \n        role={selectedRoleForEdit}\n      />\n\n      <ChangePasswordModal \n        isOpen={isPasswordModalOpen} \n        onClose={() => {\n          setIsPasswordModalOpen(false);\n          setSelectedUserForPassword(null);\n        }}\n        user={selectedUserForPassword}\n      />\n    </div>\n  );\n}
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/settings/page.jsx", ui_code)
subprocess.run('cd /home/perzival/opstask-pro && rm -rf .next && npm run build && npx pm2 restart opstask-pro', shell=True)
