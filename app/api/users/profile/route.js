import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const user = jwt.verify(token, process.env.JWT_SECRET || "supersecret_opstask_pro_key_123");
    
    const { avatar_url } = await req.json();
    
    await query("UPDATE users SET avatar_url = $1 WHERE username = $2", [avatar_url, user.username]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
