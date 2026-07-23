import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

# 1. Update API Request (Biar assigned_to otomatis diisi requester)
api_request_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const token = req.cookies.get("token")?.value;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    
    const { title, projectName, description, startDate, dueDate } = await req.json();
    
    await query(
      `INSERT INTO tasks (title, description, status, assigned_to, project_name, start_date, due_date, source, requester_name) 
       VALUES ($1, $2, 'todo', $3, $4, $5, $6, 'internal', $7)`,
      [title, description, user.username, projectName, startDate || null, dueDate || null, user.username]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/request/route.js", api_request_code)


# 2. Update API Kanban Tasks (Filter DONE > 7 Hari & Handler Update ke Redmine)
api_tasks_code = """
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

export async function GET() {
  try {
    // Ambil semua task yang BUKAN done, DAN task done yang umurnya KURANG dari 7 hari
    const result = await query(`
      SELECT * FROM tasks 
      WHERE status != 'done' 
         OR (status = 'done' AND updated_at >= NOW() - INTERVAL '7 days')
      ORDER BY due_date ASC
    `);
    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id, status } = await request.json();
    
    // Update local DB
    const res = await query("UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *", [status, id]);
    const updatedTask = res.rows[0];

    // Jika dipindah ke DONE dan itu adalah task Redmine, update status_id = 60 ("Deployed") ke Redmine Server
    if (status === 'done' && updatedTask.redmine_id) {
      try {
        const agent = new https.Agent({ rejectUnauthorized: false });
        await axios.put(`https://task.ptdika.com/issues/${updatedTask.redmine_id}.json`, {
          issue: { status_id: 60 } // 60 = Deployed
        }, {
          headers: { "X-Redmine-API-Key": "b5408133ea672f817d64ef16f5c6667d6f6b36c3", "Content-Type": "application/json" },
          httpsAgent: agent
        });
      } catch (err) {
        console.error("Failed to update redmine status:", err.message);
        // Tetep lanjut walau redmine error, DB lokal udah update
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/tasks/route.js", api_tasks_code)


# 3. Update Calendar Component (Fix eventStyleGetter)
with open("/home/perzival/opstask-pro/components/board/CalendarBoard.jsx", "r") as f:
    kanban = f.read()

old_style = """const eventStyleGetter = (event) => {
    // Default (Internal Project / Non-Redmine)
    let backgroundColor = "#f3e8ff"; // fuchsia-100
    let color = "#7e22ce"; // fuchsia-700
    let border = "1px solid #f0abfc";
    
    // Redmine Source
    if (event.source === "redmine") {
      backgroundColor = "#e0f2fe"; // sky-100
      color = "#0369a1"; // sky-700
      border = "1px solid #bae6fd";
    }

    return {"""

new_style = """const eventStyleGetter = (event) => {
    // Default (Internal Project / Non-Redmine)
    let backgroundColor = "#f3e8ff"; // fuchsia-100
    let color = "#7e22ce"; // fuchsia-700
    let border = "1px solid #f0abfc";
    
    // Redmine Source
    if (event.source === "redmine" || event.redmine_id) {
      backgroundColor = "#e0f2fe"; // sky-100
      color = "#0369a1"; // sky-700
      border = "1px solid #bae6fd";
    }

    // Done Status Override (Kalo dia udah kelar, bikin warnanya ijo redup tanpa mandang source)
    if (event.status === "done") {
      backgroundColor = "#d1fae5"; // emerald-100
      color = "#047857"; // emerald-700
      border = "1px solid #a7f3d0";
    }

    return {"""

kanban = kanban.replace(old_style, new_style)
write_file("/home/perzival/opstask-pro/components/board/CalendarBoard.jsx", kanban)

# Update Schema DB biar kolom updated_at update otomatis
subprocess.run(['sudo', '-u', 'postgres', 'psql', '-d', 'opstask_pro_db', '-c', 
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"])

# Run build
subprocess.run('cd /home/perzival/opstask-pro && npm run build && npx pm2 restart opstask-pro', shell=True)
