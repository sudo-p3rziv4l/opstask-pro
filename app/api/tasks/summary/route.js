import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;
    
    const payload = jwt.decode(token);
    if (!payload || !payload.username) return null;

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
    return null;
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.role === 'Super Admin';
    const userName = user.name;

    const resTotalDone = await query(`SELECT COUNT(*) FROM tasks WHERE LOWER(status) = 'done'`);
    
    const resMyDone = await query(
      `SELECT COUNT(*) FROM tasks 
       WHERE LOWER(status) = 'done' 
       AND completed_by = $1 
       AND updated_at >= NOW() - INTERVAL '7 days'`,
      [userName]
    );

    let sqlTotalLeft = `SELECT COUNT(*) FROM tasks WHERE LOWER(status) != 'done'`;
    let paramLeft = [];
    if (!isSuperAdmin) {
      sqlTotalLeft += ` AND (assigned_to = $1 OR created_by = $1)`;
      paramLeft.push(userName);
    }
    const resTotalLeft = await query(sqlTotalLeft, paramLeft);

    const response = NextResponse.json({
      totalDone: parseInt(resTotalDone.rows[0].count),
      myDone7d: parseInt(resMyDone.rows[0].count),
      totalLeft: parseInt(resTotalLeft.rows[0].count),
      activeProjects: 0
    });

    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;

  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
