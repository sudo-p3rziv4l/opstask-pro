import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await query(`
      SELECT completed_by as username, COUNT(*) as done_count
      FROM tasks
      WHERE status = 'done' AND completed_by IS NOT NULL
      GROUP BY completed_by
      ORDER BY done_count DESC
    `);
    return NextResponse.json({ leaderboard: result.rows });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
