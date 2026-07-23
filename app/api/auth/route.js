import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET;

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "2h" } // Token expires in 2 hours
    );

    const res = NextResponse.json({ 
      success: true, 
      user: { id: user.id, name: user.username, role: user.role }
    });

    // Set cookie with 2 hours expiration (auto-logout)
    res.cookies.set("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7200,
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
