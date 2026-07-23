import os
import subprocess

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content.strip() + "\n")

api_users_code = """
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
    
    // Injeksi DEBUG!
    console.log("=== DEBUG GET /api/users ===");
    console.log("Query Result:", JSON.stringify(result.rows, null, 2));
    console.log("===========================");

    return NextResponse.json({ users: result.rows || [] });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
"""
write_file("/home/perzival/opstask-pro/app/api/users/route.js", api_users_code)

# Hapus semua yg berhubungan sama API POST/DELETE biar script ini fokus ke GET
subprocess.run('cd /home/perzival/opstask-pro && rm -rf app/api/users/[id] && rm -rf .next/cache && npm run build && npx pm2 restart opstask-pro', shell=True)
