import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    
    const payload = jwt.decode(token);
    if (!payload || !payload.username) return null;

    const res = await query(
       `SELECT u.name, r.name as role 
        FROM users u 
        LEFT JOIN roles r ON u.role_id = r.id 
        WHERE u.username = $1`, 
       [payload.username]
    );

    if (res.rows.length === 0) return null;

    return {
       username: payload.username,
       name: res.rows[0].name || payload.username,
       role: res.rows[0].role || 'Super Admin'
    };
  } catch (err) {
    console.error("Error in getUser:", err);
    return null;
  }
}

export async function GET(request, { params }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await query("SELECT id, redmine_id, title, description, status, requester_name as created_by, assigned_to, completed_by, start_date, due_date, created_at, updated_at, source, project_name, deployment_guide FROM tasks WHERE id = $1", [id]);
    if (result.rows.length === 0) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const task = result.rows[0];
    
    let redmineData = null;
    let redmineError = null;
    
    if (task.redmine_id) {
      try {
        const agent = new https.Agent({ rejectUnauthorized: false });
        const res = await axios.get(`https://task.ptdika.com/issues/${task.redmine_id}.json?include=attachments,journals`, {
          headers: { "X-Redmine-API-Key": process.env.REDMINE_API_KEY || "b5408133ea672f817d64ef16f5c6667d6f6b36c3" },
          httpsAgent: agent,
          timeout: 5000
        });
        redmineData = res.data.issue;
      } catch (err) {
        redmineError = err.message;
      }
    }

    return NextResponse.json({ local: task, redmine: redmineData, redmineError });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
