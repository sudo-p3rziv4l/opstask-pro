"use client";
import { useState, useEffect } from 'react';
import { Trash2, Edit2, KeyRound } from 'lucide-react';
import Tabs from '@/components/settings/Tabs';
import CreateUserModal from '@/components/settings/CreateUserModal';
import CreateRoleModal from '@/components/settings/CreateRoleModal';
import ChangePasswordModal from '@/components/settings/ChangePasswordModal';
import EditRoleModal from '@/components/settings/EditRoleModal';
import EditUserModal from '@/components/settings/EditUserModal';

export default function SettingsPage() {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('');
  
  const [users, setUsers] = useState([]);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  
  const [roles, setRoles] = useState([]);
  const [activeRole, setActiveRole] = useState(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/users?t=${Date.now()}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) { console.error(e); }
  };
  
  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRoles(data.roles || data || []);
      }
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user?.role) setCurrentUserRole(data.user.role);
      })
      .catch(e => console.error(e));
  }, []);
  
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
            <div className="w-full">
              {activeTab === 'users' && (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">User Management</h3>
                    <button 
                      onClick={() => setIsUserModalOpen(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                      + Create User
                    </button>
                  </div>
                  
                  {!users || users.length === 0 ? (
                    <div className="border border-slate-100 rounded-xl p-8 text-center bg-slate-50 w-full">
                      <p className="text-slate-500 font-medium">Click "+ Create User" to add a new member to the system.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto w-full">
                      <table className="w-full min-w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-medium">
                          <tr>
                            <th className="px-4 py-3 whitespace-nowrap">Username / Name</th>
                            <th className="px-4 py-3 whitespace-nowrap">Role</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          { (users || []).map((user) => (
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
                                <button 
                                  onClick={() => {
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
                                {currentUserRole === 'Super Admin' && (
                                  <button
                                    onClick={() => {
                                      setSelectedUserForEdit(user);
                                      setIsEditUserModalOpen(true);
                                    }}
                                    title="Edit User"
                                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" />
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

              {activeTab === 'roles' && (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800">Role Management</h3>
                    <button 
                      onClick={() => setIsRoleModalOpen(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                    >
                      + Create Role
                    </button>
                  </div>
                  
                  {!roles || roles.length === 0 ? (
                    <div className="border border-slate-100 rounded-xl p-8 text-center bg-slate-50 w-full">
                      <p className="text-slate-500 font-medium">No roles found.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto w-full">
                      <table className="w-full min-w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-medium">
                          <tr>
                            <th className="px-4 py-3 whitespace-nowrap">Role Name</th>
                            <th className="px-4 py-3 whitespace-nowrap">Permissions Count</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          { (roles || []).map(role => (
                            <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-800">{role.name}</td>
                              <td className="px-4 py-3">
                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                  {role.permissions?.length || 0} permissions
                                </span>
                              </td>
                              <td className="px-4 py-3 flex justify-end gap-2">
                                <button 
                                  title="Edit Role" 
                                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                                  onClick={() => openEditModal(role)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                {role.name !== 'Super Admin' && (
                                  <button 
                                    title="Delete Role" 
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
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
            </div>
          )}
        </Tabs>
      </div>

      <CreateUserModal 
        isOpen={isUserModalOpen} 
        onClose={(refresh) => { setIsUserModalOpen(false); if(refresh) fetchUsers(); }} 
      />

      <CreateRoleModal 
        isOpen={isRoleModalOpen} 
        onClose={(refresh) => { setIsRoleModalOpen(false); if(refresh) fetchRoles(); }} 
      />

      <EditRoleModal 
        isOpen={isEditRoleModalOpen} 
        onClose={(refresh) => { setIsEditRoleModalOpen(false); if(refresh) fetchRoles(); }} 
        role={selectedRoleForEdit}
      />

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedUserForPassword(null);
        }}
        user={selectedUserForPassword}
      />
      
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={(refresh) => {
          setIsEditUserModalOpen(false);
          setSelectedUserForEdit(null);
          if (refresh) fetchUsers();
        }}
        user={selectedUserForEdit}
      />
    </div>
  );
}
