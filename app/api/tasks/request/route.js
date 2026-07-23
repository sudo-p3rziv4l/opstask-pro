import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret_opstask_pro_key_123");
    
    // Cari nama asli
    const userDb = await query("SELECT name, username FROM users WHERE id = $1", [decoded.id]);
    const realName = userDb.rows[0]?.name || userDb.rows[0]?.username || decoded.username;
    
    const { title, projectName, description, startDate, dueDate, deployment_guide } = await req.json();
    
    await query(
      `INSERT INTO tasks (title, description, status, assigned_to, project_name, start_date, due_date, source, requester_name, deployment_guide) 
       VALUES ($1, $2, 'todo', $3, $4, $5, $6, 'internal', $7, $8)`,
      [title, description, realName, projectName, startDate || null, dueDate || null, realName, deployment_guide || null]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
