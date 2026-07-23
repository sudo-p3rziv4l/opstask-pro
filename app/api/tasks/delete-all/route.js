import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await query('DELETE FROM tasks');
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
