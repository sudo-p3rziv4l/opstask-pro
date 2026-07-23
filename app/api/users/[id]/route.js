import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
    console.error("Error in getUser:", err);
    return null;
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'Super Admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { name, role } = await request.json();

    if (!name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let roleId = null;
    if (role !== "Super Admin") {
      const roleRes = await query("SELECT id FROM roles WHERE name = $1", [role]);
      if (roleRes.rows.length === 0) {
        return NextResponse.json({ error: "Role not found" }, { status: 400 });
      }
      roleId = roleRes.rows[0].id;
    }

    const result = await query(
      "UPDATE users SET name = $1, role_id = $2 WHERE id = $3 RETURNING id",
      [name, roleId, id]
    );

    if (result.rowCount === 0) {
       return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
