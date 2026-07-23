"use client";
import { useState, useRef } from "react";
import { UploadCloud, X } from "lucide-react";

export default function RequestPage() {
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [deploymentGuide, setDeploymentGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    
    let attachment_url = null;
    let attachment_name = null;
    
    try {
      // 1. Upload file if exists
      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "File upload failed");
        
        attachment_url = uploadData.url;
        attachment_name = uploadData.filename;
        setUploading(false);
      }

      // 2. Submit task
      const res = await fetch("/api/tasks/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, projectName, description, startDate, dueDate, 
          deployment_guide: deploymentGuide,
          attachment_url,
          attachment_name
        })
      });
      if (!res.ok) throw new Error("Gagal submit task");
      
      setMsg("Task berhasil disubmit ke DevOps!");
      setTitle("");
      setProjectName("");
      setStartDate("");
      setDueDate("");
      setDescription("");
      setDeploymentGuide("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
    } catch (err) {
      setMsg(err.message);
      setUploading(false);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">New Task Request</h1>
        <p className="text-slate-500">Submit a task directly to the board.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 space-y-6">
        {msg && <div className="p-4 bg-sky-50 text-sky-700 rounded-xl font-bold">{msg}</div>}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Task Title</label>
          <input required type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="e.g. Need new DB for staging" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Project Name</label>
          <input required type="text" value={projectName} onChange={e=>setProjectName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="e.g. Internal Portal" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
            <input required type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Due Date</label>
            <input required type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Description & Links</label>
          <textarea required rows="5" value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="Detailed description..."></textarea>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Deployment Guideline (Optional File)</label>
          <div className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10">
            <div className="text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
              <div className="mt-4 flex text-sm leading-6 text-slate-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-white font-semibold text-sky-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2 hover:text-sky-500"
                >
                  <span>Upload a file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} ref={fileInputRef} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs leading-5 text-slate-500">DOC, PDF, MD, etc. up to 10MB</p>
              {file && (
                <div className="mt-4 text-sm font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-lg flex items-center justify-between">
                  <span>{file.name}</span>
                  <button type="button" onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value = "";}} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Or paste guide here</label>
          <textarea rows="4" value={deploymentGuide} onChange={e=>setDeploymentGuide(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500/20" placeholder="Deployment steps..."></textarea>
        </div>
        <button type="submit" disabled={loading || uploading} className="w-full bg-sky-600 text-white font-bold py-4 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">
          {uploading ? "Uploading file..." : (loading ? "Submitting..." : "Submit Task")}
        </button>
      </form>
    </div>
  );
}
