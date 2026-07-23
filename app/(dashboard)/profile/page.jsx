"use client";
import { useState, useEffect } from "react";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [password, setPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d => {
      if(d.user && d.user.avatar_url) setAvatarUrl(d.user.avatar_url);
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl })
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setMsg("Profile updated! Refresh to see changes on topbar.");
    } catch (err) {
      setMsg(err.message);
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdLoading(true); setPwdMsg("");
    try {
      const res = await fetch("/api/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error("Failed to change password");
      setPwdMsg("Password changed successfully.");
      setPassword("");
    } catch (err) {
      setPwdMsg(err.message);
    }
    setPwdLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">User Info</h1>
        <p className="text-slate-500">Manage your profile details and avatar.</p>
      </div>

      <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover shadow-sm border-4 border-slate-50" />
          ) : (
            <div className="w-24 h-24 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center"><UserCircle className="w-12 h-12" /></div>
          )}
          <div>
            <h3 className="text-xl font-bold text-slate-800">Avatar Image</h3>
            <p className="text-sm text-slate-500">Provide a direct URL to your profile image (e.g. imgur, github avatar).</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          {msg && <div className="p-4 bg-sky-50 text-sky-700 rounded-xl font-bold">{msg}</div>}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Avatar Image URL</label>
            <input type="url" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="https://example.com/my-photo.jpg" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">
            {loading ? "Updating..." : "Save Profile"}
          </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-6">
            {pwdMsg && <div className="p-4 bg-sky-50 text-sky-700 rounded-xl font-bold">{pwdMsg}</div>}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={pwdLoading} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-50">
              {pwdLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
