"use client";
import { useState, useEffect } from "react";
import { X, Paperclip, MessageSquare, AlertTriangle } from "lucide-react";

export default function TaskModal({ task, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!task) return;
    let isMounted = true;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isMounted) setLoading(true);
    fetch(`/api/tasks/${task.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch task details");
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        if (data.error) throw new Error(data.error);
        setDetails(data);
      })
      .catch(err => {
        if (isMounted) setErrorMsg(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      
    return () => { isMounted = false; };
  }, [task]);

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-xl border border-slate-100 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{task.title}</h2>
            {task.redmine_id && <span className="text-sm font-medium text-indigo-600">Redmine #{task.redmine_id}</span>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
            <X className="w-5 h-5 text-slate-500"/>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {loading ? (
            <p className="text-slate-500 animate-pulse">Loading task details...</p>
          ) : errorMsg ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 font-medium">
              <AlertTriangle className="w-5 h-5" /> {errorMsg}
            </div>
          ) : !details ? (
            <p className="text-slate-500">No details found.</p>
          ) : (
            <>
              {details.redmineError && (
                <div className="bg-orange-50 text-orange-600 p-4 rounded-xl flex items-center gap-2 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> 
                  Could not fetch live updates from Redmine ({details.redmineError}). Showing local data.
                </div>
              )}

              <div className="flex gap-4 mb-6">
                {details.local?.project_name && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {details.local.project_name}
                  </span>
                )}
                {(details.local?.start_date || details.local?.due_date) && (
                  <span className="text-sm text-slate-500">
                    {details.local?.start_date && `Start: ${new Date(details.local.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    {details.local?.start_date && details.local?.due_date && ' | '}
                    {details.local?.due_date && `Due: ${new Date(details.local.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{details.local?.description || 'No description provided.'}</p>
              </div>

              {details.local?.deployment_guide && details.local.deployment_guide.trim() !== "" && (
                <div className="mt-6">
                  <h3 className="font-bold text-slate-700 mb-2">Deployment Guide</h3>
                  <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">{details.local.deployment_guide}</p>
                </div>
              )}

              {details.redmine?.attachments?.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4 text-slate-400" />Attachments</h3>
                  <div className="space-y-2">
                    {details.redmine.attachments.map(att => (
                      <a href={att.content_url} target="_blank" rel="noreferrer" key={att.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-100 transition-colors">
                        <span className="text-sm font-medium text-sky-600">{att.filename}</span>
                        <span className="text-xs text-slate-400">({(att.filesize / 1024).toFixed(1)} KB)</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {details.redmine?.journals?.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-slate-400" />Comments</h3>
                  <div className="space-y-5">
                    {details.redmine.journals.map(j => {
                      if (!j.notes || j.notes.trim() === "") return null;
                      return (
                        <div key={j.id} className="flex gap-3">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                            {j.user?.name?.substring(0,2).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{j.user?.name || 'Unknown'} <span className="text-xs text-slate-400 font-normal">on {new Date(j.created_on).toLocaleDateString()}</span></p>
                            <p className="text-sm mt-1 text-slate-600 whitespace-pre-wrap">{j.notes}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
