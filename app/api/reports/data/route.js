import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req) {
  // Simple check for an internal secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET || process.env.INTERNAL_API_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await query(`
      SELECT 
        status, 
        assigned_to,
        COUNT(*) as total_tasks,
        MIN(start_date) as earliest_start,
        MAX(due_date) as latest_due
      FROM tasks
      GROUP BY status, assigned_to
    `);
    
    return NextResponse.json({
      success: true,
      data: summary.rows
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
