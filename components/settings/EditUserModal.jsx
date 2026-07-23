"use client";
import { useState, useEffect } from 'react';
import { X, UserCog } from 'lucide-react';

export default function EditUserModal({ isOpen, onClose, user }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    password: ''
  });
  
  const [roles, setRoles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        role: user.role || '',
        password: ''
      });
    }

    if(isOpen) {
      fetch('/api/roles')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setRoles(data);
          else if (data.roles) setRoles(data.roles)
        })
        .catch(err => console.error(err));
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) setCurrentUser(data.user);
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      let data = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`Server returned invalid response (Status ${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user');
      }

      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden scale-in">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Edit User</h2>
              <p className="text-sm text-slate-500">@{user.username}</p>
            </div>
          </div>
          <button onClick={() => onClose(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold shadow-sm">{error}</div>}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name (Display Name)</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-800"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Reset Password (Optional)</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-800"
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                disabled={!user || currentUser?.id === user?.id || user?.username === 'admin'}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {roles.length === 0 && <option value="Super Admin">Super Admin</option>}
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => onClose(false)}
              className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}