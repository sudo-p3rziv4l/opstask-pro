import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = jwt.decode(token);
    if (!payload || !payload.username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newPassword } = await request.json();
    if (!newPassword) return NextResponse.json({ error: "New password required" }, { status: 400 });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const res = await query(
      `UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id`,
      [hashedPassword, payload.username]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
