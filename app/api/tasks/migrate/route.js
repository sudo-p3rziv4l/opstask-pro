import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// Endpoint untuk menambah kolom attachment_url ke tabel tasks (jalankan sekali)
export async function POST() {
  try {
    await query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url TEXT`);
    await query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_name TEXT`);
    return NextResponse.json({ success: true, message: "Columns added" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
