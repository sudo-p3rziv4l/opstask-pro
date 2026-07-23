"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, FileSpreadsheet } from "lucide-react";

export default function ProjectsPage() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Title": "Create DB Schema", "Project Name": "Internal Tools", "Description": "Setup postgres tables", "Start Date": "2026-12-01", "Due Date": "2026-12-31", "Assigned To": "admindika" },
      { "Title": "Setup CI/CD", "Project Name": "Internal Tools", "Description": "GitLab CI to staging", "Start Date": "2026-12-05", "Due Date": "2026-12-25", "Assigned To": "Unassigned" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, "OpsTask_Bulk_Template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMsg("");
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const res = await fetch("/api/tasks/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: data })
        });
        
        const result = await res.json();
        if (!res.ok) throw new Error(result.error);
        
        setMsg(`Success! ${result.count} tasks imported.`);
        e.target.value = null;
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Projects & Bulk Import</h1>
        <p className="text-slate-500">Create multiple tasks across projects via Excel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mb-4">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">1. Download Template</h3>
          <p className="text-slate-500 text-sm mb-6">Use our standard format to prepare your tasks and projects in Excel.</p>
          <button onClick={handleDownloadTemplate} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Download .xlsx
          </button>
        </div>

        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">2. Upload Filled Template</h3>
          <p className="text-slate-500 text-sm mb-6">Upload your populated Excel file to instantly create tasks.</p>
          
          <div className="w-full relative">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
              {loading ? "Importing..." : "Select File & Import"}
            </button>
          </div>
        </div>
      </div>

      {msg && <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-center border border-emerald-100">{msg}</div>}
      {errorMsg && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold text-center border border-red-100">{errorMsg}</div>}
    </div>
  );
}
