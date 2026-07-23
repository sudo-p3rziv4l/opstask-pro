import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.name, r.name as role 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `);
    
    const response = NextResponse.json({ users: result.rows || [] });
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
    
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, name, password, role } = body;
    
    if (!username || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const roleDb = await query("SELECT id FROM roles WHERE name = $1", [role]);
    if (roleDb.rows.length === 0) {
      return NextResponse.json({ error: "Role not found" }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const fullName = name || username;

    const result = await query(
      `INSERT INTO users (username, name, password_hash, role_id) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO NOTHING
       RETURNING id`,
      [username, fullName, hashedPassword, roleDb.rows[0].id]
    );
    
    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "User already exists or something went wrong" }, { status: 409 });
    }

    
    return NextResponse.json({ success: true, message: "User created" }, { status: 200 });
    
  } catch (error) {
    console.error("POST /api/users error:", error);
    if (error.code === '23505') {
       return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
