import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    
    // Decode token buat dapet username
    const payload = jwt.decode(token);
    console.log("PAYLOAD_JWT:", payload);
    if (!payload || !payload.username) return null;

    // Ambil full name dan role asli dari database!
    const res = await query(`
       SELECT u.name, r.name as role 
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

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.role === 'Super Admin';
    const userName = user.name;

    let sql = `SELECT id, redmine_id, title, description, status, requester_name as created_by, assigned_to, completed_by, start_date, due_date, created_at, updated_at, source, project_name, deployment_guide FROM tasks`;
    const params = [];
    
    if (!isSuperAdmin) {
        sql += ` WHERE (assigned_to = $1 OR requester_name = $1 OR completed_by = $1)
                 AND (LOWER(status) != 'done' OR updated_at >= NOW() - INTERVAL '7 days')`;
        params.push(userName);
    } else {
        sql += ` WHERE (LOWER(status) != 'done' OR updated_at >= NOW() - INTERVAL '7 days')`;
    }

    sql += ` ORDER BY updated_at DESC`;

    const result = await query(sql, params);
    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userName = user.name;
    const { id, status, priority, progress, redmine_task_id } = await request.json();

    const fields = [];
    const values = [];
    let idx = 1;

    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
      
      if (status.toLowerCase() === 'done') {
        fields.push(`completed_by = $${idx++}`);
        values.push(userName);
      }
    }

    if (fields.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    fields.push(`updated_at = NOW()`);

    values.push(id);
    const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const result = await query(sql, values);
    const updatedTask = result.rows[0];
    const redmineId = redmine_task_id || updatedTask.redmine_id;

    if (status && redmineId) {
       try {
         const https = require("https");
         const axios = require("axios");
         const agent = new https.Agent({ rejectUnauthorized: false });
         
         await axios.put(`https://task.ptdika.com/issues/${redmineId}.json`, {
            issue: { status_id: 51 }
         }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Redmine-API-Key': process.env.REDMINE_API_KEY || 'b5408133ea672f817d64ef16f5c6667d6f6b36c3'
            },
            httpsAgent: agent,
            timeout: 5000
         });
         console.log(`Redmine auto-update success for task ${redmineId}`);
       } catch (err) {
         console.error("Redmine auto-update failed:", err.response?.data || err.message);
       }
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userName = user.name;
    const body = await request.json();
    const { title, description, status, priority, assigned_to, start_date, due_date, deployment_guide, attachment_url, attachment_name, project_name } = body;

    const insertResult = await query(
      `INSERT INTO tasks (title, description, status, requester_name, assigned_to, start_date, due_date, deployment_guide, attachment_url, attachment_name, project_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, status || 'todo', userName, assigned_to || null, start_date || null, due_date || null, deployment_guide || null, project_name || null]
    );

    return NextResponse.json({ success: true, task: insertResult.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
