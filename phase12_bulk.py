import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# 1. Bikin API endpoint bulk upload
api_bulk_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    
    const { tasks } = await req.json();
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
    }

    let inserted = 0;
    for (const task of tasks) {
      // Basic validation
      if (!task['Title'] || !task['Project Name']) continue;

      const title = task['Title'];
      const projectName = task['Project Name'];
      const description = task['Description'] || '';
      const dueDate = task['Due Date'] || null;
      const assignedTo = task['Assigned To'] || 'Unassigned';

      await query(
        `INSERT INTO tasks (title, description, status, assigned_to, project_name, due_date, source, requester_name) 
         VALUES ($1, $2, 'todo', $3, $4, $5, 'internal', $6)`,
        [title, description, assignedTo, projectName, dueDate, user.username]
      );
      inserted++;
    }

    return NextResponse.json({ success: true, count: inserted });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/bulk/route.js", api_bulk_code)

# 2. Bikin Halaman Projects (buat bulk upload & download template)
project_ui_code = """
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
      { "Title": "Create DB Schema", "Project Name": "Internal Tools", "Description": "Setup postgres tables", "Due Date": "2026-12-31", "Assigned To": "admindika" },
      { "Title": "Setup CI/CD", "Project Name": "Internal Tools", "Description": "GitLab CI to staging", "Due Date": "2026-12-31", "Assigned To": "Unassigned" }
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
        e.target.value = null; // reset input
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
        {/* Download Section */}
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

        {/* Upload Section */}
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
"""
write_file("/home/perzival/opstask-pro/app/(dashboard)/projects/page.jsx", project_ui_code)

# 3. Update Sidebar buat nambahin menu Projects
with open("/home/perzival/opstask-pro/components/layout/Sidebar.jsx", "r") as f:
    sidebar = f.read()

sidebar = sidebar.replace(
    "{ name: 'Leaderboard', icon: Trophy, path: '/leaderboard' }",
    "{ name: 'Leaderboard', icon: Trophy, path: '/leaderboard' },\n    { name: 'Projects', icon: Briefcase, path: '/projects' }"
)
write_file("/home/perzival/opstask-pro/components/layout/Sidebar.jsx", sidebar)

# Execute NPM Install & Restart
subprocess.run('cd /home/perzival/opstask-pro && npm install xlsx && npm run build && npx pm2 restart opstask-pro', shell=True)
