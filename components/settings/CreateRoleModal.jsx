"use client";
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CreateRoleModal({ isOpen, onClose }) {
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch permissions dynamically from DB
  useEffect(() => {
    if (isOpen) {
      fetch("/api/permissions")
        .then(res => res.json())
        .then(data => {
          if(Array.isArray(data)) setAllPermissions(data);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePerm = (name) => {
    setSelectedPerms(prev => 
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleSave = async () => {
    setErrorMsg('');
    if (!roleName.trim()) {
      setErrorMsg('Role Name is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roleName, permissions: selectedPerms })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      
      setRoleName('');
      setSelectedPerms([]);
      onClose(true); // pass true to trigger reload
    } catch (err) {
      setErrorMsg(err.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={() => onClose(false)}>
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-xl border border-slate-100 flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Create New Role</h2>
          <button onClick={() => onClose(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-5 h-5 text-slate-500"/>
          </button>
        </header>

        <div className="p-6 space-y-6">
          {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{errorMsg}</div>}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Role Name</label>
            <input type="text" value={roleName} onChange={e=>setRoleName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="e.g. Project Manager" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Select Permissions</label>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {allPermissions.length === 0 ? <p className="text-sm text-slate-400">Loading permissions...</p> : 
                allPermissions.map(p => (
                <div key={p.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer" onClick={() => togglePerm(p.name)}>
                  <input type="checkbox" checked={selectedPerms.includes(p.name)} readOnly className="mt-1 w-5 h-5 accent-sky-600" />
                  <div>
                    <span className="font-bold text-slate-700 block">{p.name}</span>
                    {p.description && <span className="text-xs text-slate-500">{p.description}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-[32px]">
          <button onClick={() => onClose(false)} className="px-6 py-2.5 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={isLoading} className="px-6 py-2.5 font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">
            {isLoading ? "Saving..." : "Save Role"}
          </button>
        </footer>
      </div>
    </div>
  );
}
